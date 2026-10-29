import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Linking,
  Platform,
  Switch,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import * as Device from "expo-device";
import {
  Advisory,
  Guidance,
  Source,
  ChatAnswer,
  Language,
  labels,
  date,
  client,
} from "@sfw/shared";
const api = client(process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000");
type Tab = "home" | "advisories" | "chat" | "preparedness" | "settings";
type Saved = {
  id: string;
  token: string;
};
async function saveSecret(value: string | null) {
  if (Platform.OS === "web") {
    if (value) await AsyncStorage.setItem("sfw-sub", value);
    else await AsyncStorage.removeItem("sfw-sub");
  } else if (value) await SecureStore.setItemAsync("sfw-sub", value);
  else await SecureStore.deleteItemAsync("sfw-sub");
}
async function getSecret() {
  return Platform.OS === "web"
    ? AsyncStorage.getItem("sfw-sub")
    : SecureStore.getItemAsync("sfw-sub");
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppScreen />
    </SafeAreaProvider>
  );
}
function ActionButton({
  title,
  onPress,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[s.button, secondary && s.secondary]}
      onPress={onPress}
    >
      <Text style={[s.buttonText, secondary && { color: "#285f47" }]}>
        {title}
      </Text>
    </Pressable>
  );
}
function AppScreen() {
  const generation = useRef(0);
  const [tab, setTab] = useState<Tab>("home"),
    [district, setDistrict] = useState("Dadu"),
    [districts, setDistricts] = useState(["Dadu", "Sukkur", "Thatta"]),
    [demo, setDemo] = useState(process.env.EXPO_PUBLIC_DEMO_MODE !== "false"),
    [lang, setLang] = useState<Language>("en"),
    [items, setItems] = useState<Advisory[]>([]),
    [guides, setGuides] = useState<Guidance[]>([]),
    [sources, setSources] = useState<Source[]>([]),
    [detail, setDetail] = useState<Advisory | null>(null),
    [cached, setCached] = useState(""),
    [retrieved, setRetrieved] = useState(""),
    [message, setMessage] = useState(""),
    [q, setQ] = useState(""),
    [hazard, setHazard] = useState(""),
    [severity, setSeverity] = useState(""),
    [since, setSince] = useState(""),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState<ChatAnswer | null>(null),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState(false),
    [selected, setSelected] = useState(["Dadu"]),
    [saved, setSaved] = useState<Saved | null>(null),
    [channel, setChannel] = useState("mock"),
    [destination, setDestination] = useState(""),
    [history, setHistory] = useState<
      {
        kind: string;
        status: string;
        receipt: string;
      }[]
    >([]);
  async function refresh() {
    const requestGeneration = ++generation.current;
    try {
      const [a, g, s, d] = await Promise.all([
        api<Advisory[]>("/advisories?demo=" + demo),
        api<Guidance[]>("/preparedness"),
        api<Source[]>("/sources"),
        api<string[]>("/districts"),
      ]);
      if (requestGeneration !== generation.current) return;
      setItems(a);
      setGuides(g);
      setSources(s);
      setDistricts(d);
      const at = new Date().toISOString();
      setRetrieved(at);
      setCached("");
      setMessage("");
      await AsyncStorage.setItem(
        "cache-" + demo,
        JSON.stringify({ a, g, s, d, at }),
      );
    } catch {
      const raw = await AsyncStorage.getItem("cache-" + demo);
      if (requestGeneration !== generation.current) return;
      if (raw) {
        const c = JSON.parse(raw);
        setItems(c.a);
        setGuides(c.g);
        setSources(c.s);
        setDistricts(c.d);
        setCached(c.at);
        setRetrieved(c.at);
      } else {
        setItems([]);
        setGuides([]);
        setSources([]);
      }
      setMessage(
        "Connection unavailable. Missing data does not mean safe conditions.",
      );
    }
  }
  function switchMode() {
    generation.current++;
    setItems([]);
    setSources([]);
    setDetail(null);
    setAnswer(null);
    setCached("");
    setRetrieved("");
    setChannel("mock");
    setDemo(!demo);
  }
  useEffect(() => {
    void refresh();
  }, [demo]);
  useEffect(() => {
    void getSecret().then((v) => {
      if (v) setSaved(JSON.parse(v));
    });
  }, []);
  function go(t: Tab) {
    setTab(t);
    setDetail(null);
    setMessage("");
  }
  async function ask(value = question) {
    const requestGeneration = generation.current;
    setBusy(true);
    try {
      const result = await api<ChatAnswer>("/chat", {
        method: "POST",
        body: JSON.stringify({ question: value, district, demo }),
      });
      if (requestGeneration === generation.current) setAnswer(result);
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function pushToken() {
    try {
      if (Platform.OS === "web" || !Device.isDevice)
        throw Error(
          "Push registration requires a physical Android/iOS device and a development build.",
        );
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId)
        throw Error(
          "Set your EAS project ID in app.json and configure FCM/APNs first.",
        );
      const Notifications = await import("expo-notifications");
      if (Platform.OS === "android")
        await Notifications.setNotificationChannelAsync("default", {
          name: "District advisories",
          importance: Notifications.AndroidImportance.HIGH,
        });
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== "granted")
        throw Error("Notification permission was not granted");
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      setDestination(token.data);
      setChannel("expo");
      setMessage(
        "Push token registered. This does not confirm notification delivery.",
      );
    } catch (e) {
      setMessage(String(e));
    }
  }
  async function subscribe() {
    try {
      const body = JSON.stringify({
        districts: selected,
        language: lang,
        channel,
        destination,
        demo,
        consent,
      });
      if (saved)
        await api("/subscriptions/" + saved.id, {
          method: "PUT",
          headers: { Authorization: "Bearer " + saved.token },
          body,
        });
      else {
        const s = await api<Saved>("/subscriptions", { method: "POST", body });
        setSaved(s);
        await saveSecret(JSON.stringify(s));
      }
      setMessage(
        "Preferences saved. Refresh history after an approved advisory is published.",
      );
    } catch (e) {
      setMessage(String(e));
    }
  }
  const card = (a: Advisory) => (
    <Pressable
      accessibilityRole="button"
      key={a.id}
      onPress={() => setDetail(a)}
      style={s.card}
    >
      <Text style={s.tag}>
        {a.hazard.toUpperCase()} FLOODING · {a.severity}
      </Text>
      {a.demo && <Text style={s.demoText}>DEMO — NOT A REAL WARNING</Text>}
      <Text style={s.h2}>{a.title} ↗</Text>
      <Text style={s.p}>{a.body}</Text>
      <Text style={s.small}>
        {a.authority} · {date(a.issued)}
      </Text>
      <Text style={s.small}>
        Valid until {date(a.expires)} ·{" "}
        {cached
          ? "Cached; verify with source"
          : a.current
            ? "Within stated validity"
            : a.state === "published"
              ? "Outdated"
              : a.state}
      </Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Image
          source={require("./assets/sindh-emblem.png")}
          style={s.emblem}
          accessibilityLabel="Sindh emblem"
          alt="Sindh emblem"
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>Sindh Flood Watch</Text>
          <Text style={s.small}>
            Independent service · No government endorsement
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[
          s.content,
          { direction: lang === "en" ? "ltr" : "rtl" },
        ]}
      >
        <View style={s.demo}>
          <Text style={s.demoText}>
            {demo
              ? "DEMO — NOT A REAL WARNING"
              : "LIVE MODE · FEED NOT CONNECTED"}
          </Text>
          <Text style={s.small}>
            {demo
              ? "Fictional sample information only."
              : "No advisory found does not mean safe."}
          </Text>
          {
            <ActionButton
              title={demo ? "Switch to live mode" : "Return to demo"}
              onPress={switchMode}
              secondary={true}
            />
          }
        </View>
        {cached && (
          <Text style={s.notice}>
            Offline cached copy saved {date(Date.parse(cached) / 1000)}. This is
            not a fresh warning.
          </Text>
        )}
        {message && (
          <Text accessibilityRole="alert" style={s.notice}>
            {message}
          </Text>
        )}
        {lang !== "en" && (
          <Text style={s.notice}>
            Draft interface translation. Emergency guidance remains in reviewed
            English.
          </Text>
        )}
        <View style={s.chips}>
          {(["en", "ur", "sd"] as Language[]).map((l) => (
            <Pressable
              accessibilityRole="button"
              key={l}
              onPress={() => setLang(l)}
              style={[s.chip, lang === l && s.chosen]}
            >
              <Text>
                {l === "en" ? "English" : l === "ur" ? "اردو" : "سنڌي"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.h1}>
          {detail
            ? "Advisory details"
            : tab === "home"
              ? "Stay informed. Stay prepared."
              : labels[lang][tab]}
        </Text>
        {
          <ActionButton
            title={"↻ Refresh information"}
            onPress={refresh}
            secondary={true}
          />
        }
        {(tab === "home" || tab === "advisories") && !detail && (
          <>
            <Text style={s.label}>YOUR DISTRICT · MANUAL SELECTION</Text>
            <ScrollView horizontal contentContainerStyle={s.chips}>
              {districts.map((d) => (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  style={[s.chip, d === district && s.chosen]}
                  onPress={() => setDistrict(d)}
                >
                  <Text>{d}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              accessibilityLabel="Search advisories"
              style={s.input}
              placeholder="Search advisories…"
              value={q}
              onChangeText={setQ}
            />
            <View style={s.chips}>
              {["", "river", "flash", "urban"].map((h) => (
                <Pressable
                  key={h}
                  style={[s.chip, hazard === h && s.chosen]}
                  onPress={() => setHazard(h)}
                >
                  <Text>{h || "All types"}</Text>
                </Pressable>
              ))}
            </View>
            {tab === "advisories" && (
              <>
                <TextInput
                  accessibilityLabel="Official severity"
                  style={s.input}
                  placeholder="Exact original severity"
                  value={severity}
                  onChangeText={setSeverity}
                />
                <TextInput
                  accessibilityLabel="Issued since"
                  style={s.input}
                  placeholder="Issued since YYYY-MM-DD (UTC)"
                  value={since}
                  onChangeText={setSince}
                />
              </>
            )}
            {items
              .filter(
                (a) =>
                  a.districts.includes(district) &&
                  (!hazard || a.hazard === hazard) &&
                  (!severity || a.severity === severity) &&
                  (!since || a.issued >= Date.parse(since) / 1000) &&
                  (a.title + a.body).toLowerCase().includes(q.toLowerCase()),
              )
              .map(card)}
            {!items.some((a) => a.districts.includes(district)) && (
              <View style={s.card}>
                <Text style={s.h2}>No advisory found</Text>
                <Text style={s.p}>
                  Missing information is not evidence of safety. Check official
                  sources.
                </Text>
              </View>
            )}
            {tab === "home" && (
              <>
                <Text style={s.h2}>Source transparency</Text>
                {sources.map((src) => (
                  <View key={src.name} style={s.card}>
                    <Text style={s.h2}>{src.name}</Text>
                    <Text style={s.p}>{src.status}</Text>
                    <Text style={s.small}>
                      Last successful check: {date(src.last_success)}
                    </Text>
                    {
                      <ActionButton
                        title={"Official source ↗"}
                        onPress={() => {
                          void Linking.openURL(src.url);
                        }}
                        secondary={true}
                      />
                    }
                  </View>
                ))}
              </>
            )}
          </>
        )}
        {detail && (
          <View style={s.card}>
            {
              <ActionButton
                title={"← Back"}
                onPress={() => setDetail(null)}
                secondary={true}
              />
            }
            {detail.demo && (
              <Text style={s.demoText}>DEMO — NOT A REAL WARNING</Text>
            )}
            <Text style={s.h2}>{detail.title}</Text>
            <Text style={s.p}>{detail.body}</Text>
            <Text style={s.p}>
              {detail.districts.join(", ")} · {detail.hazard} flooding ·{" "}
              {detail.severity}
            </Text>
            <Text style={s.small}>
              {detail.authority}
              {"\n"}Issued: {date(detail.issued)}
              {"\n"}Expires: {date(detail.expires)}
              {"\n"}Ingested: {date(detail.ingested)}
              {"\n"}
              {cached
                ? "Cached; verify current validity"
                : detail.current
                  ? "Within stated validity"
                  : detail.state}
            </Text>
            {
              <ActionButton
                title={"Original source reference ↗"}
                onPress={() => {
                  void Linking.openURL(detail.source_url);
                }}
                secondary={true}
              />
            }
            {detail.demo && (
              <Text style={s.small}>
                Fictional sample; not issued by the linked authority.
              </Text>
            )}
          </View>
        )}
        {tab === "chat" && (
          <View style={s.card}>
            <Text style={s.p}>
              Answers use published evidence for {district}, with source and
              date.
            </Text>
            {
              <ActionButton
                title={"Latest advisory for " + district}
                onPress={() => {
                  setQuestion("Latest advisory for " + district);
                  void ask("Latest advisory for " + district);
                }}
                secondary={true}
              />
            }
            {
              <ActionButton
                title={"How should I prepare?"}
                onPress={() => {
                  void ask("How should I prepare?");
                }}
                secondary={true}
              />
            }
            <TextInput
              accessibilityLabel="Your question"
              style={s.input}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask a question"
              maxLength={1000}
            />
            {
              <ActionButton
                title={busy ? "Retrieving…" : "Ask Flood Watch →"}
                onPress={() => {
                  if (!busy && question.trim()) void ask();
                }}
              />
            }
            {answer && (
              <>
                <Text style={s.tag}>{answer.mode}</Text>
                <Text style={s.p}>{answer.answer}</Text>
                {answer.citations.map((c, i) => (
                  <View key={i}>
                    <Text style={s.small}>
                      {c.authority} · {c.issued ? date(c.issued) : c.reviewed}
                    </Text>
                    {
                      <ActionButton
                        title={c.title + " ↗"}
                        onPress={() => {
                          void Linking.openURL(c.source_url);
                        }}
                        secondary={true}
                      />
                    }
                  </View>
                ))}
              </>
            )}
            <Text style={s.small}>
              No flood predictions, evacuation decisions or village-level safety
              inference.
            </Text>
          </View>
        )}
        {tab === "preparedness" && (
          <>
            <TextInput
              accessibilityLabel="Search preparedness"
              style={s.input}
              placeholder="Search preparedness…"
              value={q}
              onChangeText={setQ}
            />
            {guides
              .filter((g) =>
                (g.title + g.body).toLowerCase().includes(q.toLowerCase()),
              )
              .map((g) => (
                <View key={g.id} style={s.card}>
                  <Text style={s.tag}>REVIEWED ENGLISH · {g.reviewed}</Text>
                  <Text style={s.h2}>{g.title}</Text>
                  <Text style={s.p}>{g.body}</Text>
                  <Text style={s.small}>{g.authority}</Text>
                  {
                    <ActionButton
                      title={"Official information channel ↗"}
                      onPress={() => {
                        void Linking.openURL(g.source_url);
                      }}
                      secondary={true}
                    />
                  }
                </View>
              ))}
          </>
        )}
        {tab === "settings" && (
          <View style={s.card}>
            <Text style={s.h2}>District notifications</Text>
            <Text style={s.p}>
              Choose districts. No precise GPS is collected.
            </Text>
            <View style={s.chips}>
              {districts.map((d) => (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected.includes(d) }}
                  key={d}
                  style={[s.chip, selected.includes(d) && s.chosen]}
                  onPress={() =>
                    setSelected(
                      selected.includes(d)
                        ? selected.filter((x) => x !== d)
                        : [...selected, d],
                    )
                  }
                >
                  <Text>
                    {selected.includes(d) ? "✓ " : ""}
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.label}>Channel: {channel}</Text>
            {
              <ActionButton
                title={"Use mock inbox"}
                onPress={() => {
                  setChannel("mock");
                  setDestination("");
                }}
                secondary={true}
              />
            }
            {!demo && (
              <>
                {
                  <ActionButton
                    title={"Register device for push"}
                    onPress={pushToken}
                    secondary={true}
                  />
                }
                {
                  <ActionButton
                    title={"Use Telegram"}
                    onPress={() => setChannel("telegram")}
                    secondary={true}
                  />
                }
                <TextInput
                  style={s.input}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Push token or Telegram chat ID"
                  accessibilityLabel="Provider destination"
                />
              </>
            )}
            <Text style={s.p}>
              Language: {lang}. Only matching reviewed publication languages are
              sent.
            </Text>
            <View style={s.consent}>
              <Switch
                accessibilityLabel="Consent to district notifications"
                value={consent}
                onValueChange={setConsent}
              />
              <Text style={[s.small, { flex: 1 }]}>
                I consent to storing my preferences and provider destination for
                district notifications.
              </Text>
            </View>
            {
              <ActionButton
                title={saved ? "Save preferences" : "Subscribe"}
                onPress={() => {
                  if (consent && selected.length) void subscribe();
                  else setMessage("Select districts and give consent first.");
                }}
              />
            }
            {saved && (
              <>
                {
                  <ActionButton
                    title={"Refresh delivery history"}
                    onPress={async () => {
                      try {
                        setHistory(
                          await api(
                            "/subscriptions/" + saved.id + "/deliveries",
                            {
                              headers: {
                                Authorization: "Bearer " + saved.token,
                              },
                            },
                          ),
                        );
                      } catch (e) {
                        setMessage(String(e));
                      }
                    }}
                    secondary={true}
                  />
                }
                {
                  <ActionButton
                    title={"Unsubscribe & delete data"}
                    onPress={async () => {
                      try {
                        await api("/subscriptions/" + saved.id, {
                          method: "DELETE",
                          headers: { Authorization: "Bearer " + saved.token },
                        });
                        await saveSecret(null);
                        setSaved(null);
                        setHistory([]);
                        setMessage("Subscription and delivery data deleted.");
                      } catch (e) {
                        setMessage(String(e));
                      }
                    }}
                    secondary={true}
                  />
                }
              </>
            )}
            {history.map((h, i) => (
              <View style={s.card} key={i}>
                <Text style={s.h2}>
                  {h.kind}: {h.status}
                </Text>
                <Text style={s.p}>{h.receipt}</Text>
              </View>
            ))}
            <Text style={s.small}>
              Provider acceptance does not confirm device delivery. Push needs a
              physical device, development build and FCM/APNs configuration.
            </Text>
          </View>
        )}
        <Text style={s.footer}>
          Independent information service, not a government warning authority.
          Do not use as your sole emergency channel.
          {retrieved ? "\nRetrieved " + date(Date.parse(retrieved) / 1000) : ""}
          {"\n"}Times shown in Asia/Karachi.
        </Text>
      </ScrollView>
      <View style={s.tabs}>
        {(
          ["home", "advisories", "chat", "preparedness", "settings"] as Tab[]
        ).map((t) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            key={t}
            onPress={() => go(t)}
            style={[s.tab, tab === t && s.activeTab]}
          >
            <Text style={[s.tabIcon, tab === t && { color: "#285f47" }]}>
              {
                {
                  home: "◫",
                  advisories: "≋",
                  chat: "◌",
                  preparedness: "▤",
                  settings: "♧",
                }[t]
              }
            </Text>
            <Text numberOfLines={1} style={s.tabText}>
              {labels[lang][t]}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f5f0" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 20,
    backgroundColor: "#f3f2ee",
    borderTopWidth: 6,
    borderTopColor: "#285f47",
    borderBottomWidth: 1,
    borderColor: "#dce4d7",
  },
  emblem: { width: 46, height: 55 },
  brand: { fontSize: 23, fontWeight: "800", color: "#285f47" },
  content: {
    padding: 18,
    paddingBottom: 35,
    maxWidth: 850,
    width: "100%",
    alignSelf: "center",
  },
  h1: { fontSize: 29, fontWeight: "800", color: "#193f2b", marginVertical: 18 },
  h2: { fontSize: 18, fontWeight: "700", color: "#193f2b", marginVertical: 10 },
  p: { fontSize: 14, lineHeight: 23, color: "#5f7161", marginVertical: 10 },
  small: { fontSize: 11, lineHeight: 19, color: "#6d7b6b" },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#6c7e61",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e5da",
    padding: 20,
    marginVertical: 10,
  },
  demo: {
    backgroundColor: "#fff6e4",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eeddb8",
  },
  demoText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#956b26",
    marginVertical: 7,
  },
  notice: {
    backgroundColor: "#edf2e7",
    padding: 15,
    borderRadius: 8,
    color: "#476844",
    fontSize: 12,
    lineHeight: 20,
    marginVertical: 12,
  },
  button: {
    backgroundColor: "#285f47",
    padding: 14,
    borderRadius: 7,
    marginVertical: 7,
    minHeight: 46,
  },
  secondary: {
    backgroundColor: "#edf2e7",
    borderWidth: 1,
    borderColor: "#dce5d4",
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce4d7",
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingVertical: 13,
    minHeight: 44,
  },
  chosen: { backgroundColor: "#e5eddd", borderColor: "#86a575" },
  tag: { fontSize: 10, fontWeight: "700", color: "#46714d", lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#dce4d7",
    backgroundColor: "white",
    padding: 13,
    borderRadius: 7,
    minHeight: 48,
    marginVertical: 8,
    fontSize: 14,
  },
  consent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 15,
  },
  footer: {
    fontSize: 10,
    lineHeight: 18,
    color: "#75846f",
    paddingVertical: 25,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#e0e5da",
    paddingVertical: 8,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8, minHeight: 52 },
  activeTab: { backgroundColor: "#edf2e7", borderRadius: 8 },
  tabIcon: { fontSize: 23, color: "#809077" },
  tabText: { fontSize: 8, color: "#496947", marginTop: 4 },
});
