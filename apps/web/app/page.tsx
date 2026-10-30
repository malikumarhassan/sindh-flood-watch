"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { translate } from "./i18n";
import {
  Advisory,
  Source,
  Guidance,
  ChatAnswer,
  Language,
  labels,
  date,
  client,
} from "@sfw/shared";
const api = client(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
type Tab =
  "home" | "advisories" | "chat" | "preparedness" | "settings" | "admin";
const icons = {
  home: "◫",
  advisories: "≋",
  chat: "◌",
  preparedness: "▤",
  settings: "♧",
  admin: "⚙",
};
type Saved = { id: string; token: string };
export default function Page() {
  const generation = useRef(0);
  const [tab, setTab] = useState<Tab>("home"),
    [district, setDistrict] = useState("Dadu"),
    [districts, setDistricts] = useState<string[]>([
      "Dadu",
      "Sukkur",
      "Thatta",
    ]),
    [language, setLanguage] = useState<Language>("en"),
    [demo, setDemo] = useState(process.env.NEXT_PUBLIC_DEMO_MODE !== "false"),
    [advisories, setAdvisories] = useState<Advisory[]>([]),
    [sources, setSources] = useState<Source[]>([]),
    [guidance, setGuidance] = useState<Guidance[]>([]),
    [detail, setDetail] = useState<Advisory | null>(null),
    [error, setError] = useState(""),
    [cached, setCached] = useState(""),
    [updated, setUpdated] = useState(""),
    [q, setQ] = useState(""),
    [hazard, setHazard] = useState(""),
    [severity, setSeverity] = useState(""),
    [since, setSince] = useState("");
  const [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState<ChatAnswer | null>(null),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState<Saved | null>(null),
    [inbox, setInbox] = useState<
      { kind: string; status: string; receipt: string }[]
    >([]),
    [channel, setChannel] = useState("mock"),
    [destination, setDestination] = useState(""),
    [consent, setConsent] = useState(false),
    [selected, setSelected] = useState<string[]>(["Dadu"]),
    [notice, setNotice] = useState("");
  const t = (text: string) => translate(language, text);
  const formatDate = (value: number | null | undefined) =>
    date(value, language);
  async function refresh() {
    const requestGeneration = ++generation.current;
    setError("");
    const key = "sfw-cache-" + demo;
    try {
      const [a, s, g, ds] = await Promise.all([
        api<Advisory[]>("/advisories?demo=" + demo),
        api<Source[]>("/sources"),
        api<Guidance[]>("/preparedness"),
        api<string[]>("/districts"),
      ]);
      if (requestGeneration !== generation.current) return;
      setAdvisories(a);
      setSources(s);
      setGuidance(g);
      setDistricts(ds);
      const at = new Date().toISOString();
      setUpdated(at);
      setCached("");
      localStorage.setItem(key, JSON.stringify({ a, s, g, ds, at }));
    } catch (e) {
      if (requestGeneration !== generation.current) return;
      setError(String(e));
      const cache = localStorage.getItem(key);
      if (cache) {
        const c = JSON.parse(cache);
        setAdvisories(c.a);
        setSources(c.s);
        setGuidance(c.g);
        setDistricts(c.ds);
        setUpdated(c.at);
        setCached(c.at);
      } else {
        setAdvisories([]);
        setSources([]);
        setGuidance([]);
      }
    }
  }
  function switchMode() {
    generation.current++;
    setAdvisories([]);
    setSources([]);
    setDetail(null);
    setAnswer(null);
    setCached("");
    setUpdated("");
    setChannel("mock");
    setDemo(!demo);
  }
  useEffect(() => {
    void refresh();
  }, [demo]);
  useEffect(() => {
    const preferredLanguage = localStorage.getItem("sfw-language");
    if (preferredLanguage === "ur" || preferredLanguage === "sd")
      setLanguage(preferredLanguage);
    const v = localStorage.getItem("sfw-subscription");
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (v) setSaved(JSON.parse(v));
    const hash = location.hash.slice(1);
    if (
      [
        "home",
        "advisories",
        "chat",
        "preparedness",
        "settings",
        "admin",
      ].includes(hash)
    )
      setTab(hash as Tab);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "en" ? "ltr" : "rtl";
  }, [language]);
  function navigate(next: Tab) {
    setTab(next);
    setDetail(null);
    setNotice("");
    location.hash = next;
  }
  const filtered = advisories.filter(
    (a) =>
      a.districts.includes(district) &&
      (!hazard || a.hazard === hazard) &&
      (!severity || a.severity === severity) &&
      (!since || a.issued >= Date.parse(since) / 1000) &&
      (a.title + " " + a.body).toLowerCase().includes(q.toLowerCase()),
  );
  async function ask(value = question) {
    const requestGeneration = generation.current;
    if (!value.trim()) return;
    setBusy(true);
    try {
      const result = await api<ChatAnswer>("/chat", {
        method: "POST",
        body: JSON.stringify({ question: value, district, demo, language }),
      });
      if (requestGeneration === generation.current) setAnswer(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function subscribe() {
    setNotice("");
    try {
      const body = JSON.stringify({
        districts: selected,
        language,
        channel,
        destination,
        demo,
        consent,
      });
      if (saved) {
        await api("/subscriptions/" + saved.id, {
          method: "PUT",
          headers: { Authorization: "Bearer " + saved.token },
          body,
        });
        setNotice("Preferences updated.");
      } else {
        const result = await api<Saved>("/subscriptions", {
          method: "POST",
          body,
        });
        setSaved(result);
        localStorage.setItem("sfw-subscription", JSON.stringify(result));
        setNotice(
          "Subscription saved. No delivery is claimed until a mock record is available.",
        );
      }
    } catch (e) {
      setNotice(String(e));
    }
  }
  async function loadInbox() {
    if (saved)
      try {
        setInbox(
          await api("/subscriptions/" + saved.id + "/deliveries", {
            headers: { Authorization: "Bearer " + saved.token },
          }),
        );
      } catch (e) {
        setNotice(String(e));
      }
  }
  return (
    <div className="shell">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>
            {t("For the people of Sindh")}
            <span className="utility-divider">|</span>{" "}
            {t("Independent information service")}
          </span>
          <button onClick={() => navigate("admin")}>
            {t("Administrator login ↗")}
          </button>
        </div>
      </div>
      <aside>
        <a className="brand" href="#home" onClick={() => navigate("home")}>
          <Image
            className="brand-emblem"
            src="/branding/sindh-emblem.png"
            alt={t("Sindh emblem")}
            width={55}
            height={63}
            priority
          />
          <span className="brand-wordmark">
            <span className="brand-urdu" lang="ur" dir="rtl">
              سندھ فلڈ واچ
            </span>
            {t("Sindh Flood Watch")}
            <span className="brand-small">
              {t("INDEPENDENT FLOOD INFORMATION")}
            </span>
          </span>
        </a>
        <div className="nav-label">{t("YOUR INFORMATION HUB")}</div>
        <nav>
          {(
            ["home", "advisories", "chat", "preparedness", "settings"] as Tab[]
          ).map((t) => (
            <button
              key={t}
              onClick={() => navigate(t)}
              className={tab === t ? "active" : ""}
            >
              <span>{icons[t]}</span>
              {labels[language][t as keyof typeof labels.en]}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="independent">
            <span>◇</span>
            <strong>{t("Independent. Source-led.")}</strong>
            <p>{t("Public information, with provenance you can check.")}</p>
          </div>
          <button className="admin-link" onClick={() => navigate("admin")}>
            {t("⚙ Administrator workspace")}
          </button>
          <small>{t("Made for the people of Sindh")}</small>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span className="breadcrumb">
            {t("Sindh Flood Watch")}
            <span>/</span>{" "}
            {tab === "admin"
              ? t("ADMINISTRATOR WORKSPACE")
              : labels[language][tab]}
          </span>
          <div className="header-actions">
            <span className="local-tag">
              {t("◇ No government endorsement")}
            </span>
            <select
              aria-label={t("Interface language")}
              value={language}
              onChange={(e) => {
                const next = e.target.value as Language;
                localStorage.setItem("sfw-language", next);
                generation.current++;
                setLanguage(next);
                setAnswer(null);
                setQuestion("");
                setBusy(false);
                void refresh();
              }}
            >
              <option value="en">{t("English")}</option>
              <option value="ur">اردو</option>
              <option value="sd">سنڌي</option>
            </select>
          </div>
        </header>
        <main>
          <div className="demo-banner">
            <span>◈</span>
            <div>
              <strong>
                {demo
                  ? t("DEMO — NOT A REAL WARNING")
                  : t("LIVE INFORMATION MODE")}
              </strong>
              <span>
                {demo
                  ? t(
                      "Fictional advisories for testing. No real flood conditions are represented.",
                    )
                  : t(
                      "No verified feed is connected. Missing advisories do not mean safe conditions.",
                    )}
              </span>
            </div>
            <button onClick={switchMode}>
              {demo ? t("View live mode") : t("Return to demo")} ↗
            </button>
          </div>
          {language !== "en" && (
            <div className="notice">
              {t(
                "Interface translation draft. Emergency guidance remains in reviewed English. Human review is required before translated guidance can be published.",
              )}
            </div>
          )}
          {cached && (
            <div className="notice">
              {t("Offline / connection unavailable. Cached information saved")}{" "}
              {formatDate(Date.parse(cached) / 1000)}
              {t(". This is not a fresh warning.")}
            </div>
          )}
          {error && (
            <div role="alert" className="error">
              {t("Connection unavailable:")}
              {error}
              {t(". Missing data does not establish safety.")}
              <button onClick={refresh}>{t("Retry")}</button>
            </div>
          )}
          {tab === "admin" ? (
            <AdminPanel language={language} />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {t("INFORMATION THAT HELPS YOU PREPARE")}
                  </div>
                  <h1>
                    {detail
                      ? t("Advisory details")
                      : tab === "home"
                        ? t("Stay informed. Stay prepared.")
                        : tab === "chat"
                          ? t("Ask Flood Watch")
                          : tab === "settings"
                            ? t("Your alerts, your choices")
                            : tab === "preparedness"
                              ? t("Prepare with confidence")
                              : t("District advisories")}
                  </h1>
                  <p>
                    {tab === "home"
                      ? t(
                          "Flood information for your district, with sources in view.",
                        )
                      : tab === "chat"
                        ? t(
                            "Answers grounded in published information. No predictions or safety decisions.",
                          )
                        : tab === "settings"
                          ? t(
                              "Choose districts manually. Precise location is never required.",
                            )
                          : tab === "preparedness"
                            ? t("Practical information to keep within reach.")
                            : t(
                                "Read the original wording, source and validity of each bulletin.",
                              )}
                  </p>
                </div>
                <button className="outline" onClick={refresh}>
                  {t("↻ Refresh information")}
                </button>
              </div>
              {(tab === "home" || tab === "advisories") && !detail && (
                <>
                  <section className="district-bar">
                    <div className="district-icon">⌖</div>
                    <div>
                      <label htmlFor="district">{t("YOUR DISTRICT")}</label>
                      <select
                        id="district"
                        value={t(district)}
                        onChange={(e) => setDistrict(e.target.value)}
                      >
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {t(d)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span>
                      {t("All times shown in Pakistan Standard Time (PKT)")}
                    </span>
                    <a href="#settings" onClick={() => navigate("settings")}>
                      {t("♧ Manage alerts →")}
                    </a>
                  </section>
                  <div className="stats">
                    <div>
                      <span className="stat-symbol blue">≋</span>
                      <div>
                        <span>{t("District advisories")}</span>
                        <strong>
                          {filtered.length}
                          <small>
                            {demo
                              ? t("fictional samples")
                              : t("published records")}
                          </small>
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="stat-symbol amber">◷</span>
                      <div>
                        <span>{t("Official source status")}</span>
                        <strong>
                          {t("Unavailable")}
                          <small>{t("Automated integration pending")}</small>
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="stat-symbol teal">◇</span>
                      <div>
                        <span>{t("Your information")}</span>
                        <strong>
                          {cached ? t("Cached copy") : t("Source transparent")}
                          <small>
                            {updated
                              ? t("Retrieved") +
                                " " +
                                formatDate(Date.parse(updated) / 1000)
                              : t("No retrieval yet")}
                          </small>
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="content-grid">
                    <section className="panel">
                      <div className="section-heading">
                        <div>
                          <h2>
                            {tab === "home"
                              ? t("Latest district advisories")
                              : t("Browse advisories")}
                          </h2>
                          <p>
                            {t(district)} ·{" "}
                            {demo
                              ? t("Demo collection")
                              : t("Official records")}
                          </p>
                        </div>
                        <span className="pill">
                          {filtered.length} {t("records")}
                        </span>
                      </div>
                      <div className="filters">
                        <input
                          aria-label={t("Search advisories")}
                          placeholder={t("Search advisories…")}
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                        />
                        <select
                          aria-label={t("Flood type")}
                          value={hazard}
                          onChange={(e) => setHazard(e.target.value)}
                        >
                          <option value="">{t("All flood types")}</option>
                          <option value="river">{t("River flooding")}</option>
                          <option value="flash">{t("Flash flooding")}</option>
                          <option value="urban">{t("Urban flooding")}</option>
                        </select>
                        {tab === "advisories" && (
                          <>
                            <input
                              aria-label={t("Official severity")}
                              placeholder={t("Exact official severity")}
                              value={severity}
                              onChange={(e) => setSeverity(e.target.value)}
                            />
                            <input
                              aria-label={t("Issued since")}
                              type="date"
                              value={since}
                              onChange={(e) => setSince(e.target.value)}
                            />
                          </>
                        )}
                      </div>
                      {filtered.length === 0 ? (
                        <div className="empty">
                          <span>◇</span>
                          <h3>{t("No advisory found")}</h3>
                          <p>
                            {t(
                              "We have no matching published information. This does not mean there is no flood risk. Check official channels.",
                            )}
                          </p>
                        </div>
                      ) : (
                        filtered.map((a) => (
                          <article key={a.id} className="advisory">
                            <div className="advisory-top">
                              <span className="hazard">
                                {a.hazard === "river"
                                  ? "≋"
                                  : a.hazard === "flash"
                                    ? "ϟ"
                                    : "▦"}{" "}
                                {t(
                                  a.hazard === "river"
                                    ? "River flooding"
                                    : a.hazard === "flash"
                                      ? "Flash flooding"
                                      : "Urban flooding",
                                )}
                              </span>
                              <span className="severity">{a.severity}</span>
                            </div>
                            {a.demo && (
                              <div className="demo-label">
                                {t("DEMO — NOT A REAL WARNING")}
                              </div>
                            )}
                            <p className="fine-print">
                              {t(
                                "Original bulletin — shown in its published language",
                              )}
                            </p>
                            <h3
                              lang={a.language}
                              dir={a.language === "en" ? "ltr" : "rtl"}
                            >
                              <button onClick={() => setDetail(a)}>
                                {a.title} <span>↗</span>
                              </button>
                            </h3>
                            <p
                              lang={a.language}
                              dir={a.language === "en" ? "ltr" : "rtl"}
                            >
                              {a.body}
                            </p>
                            <div className="advisory-meta">
                              <span>
                                {t("Valid until")}
                                {formatDate(a.expires)}
                              </span>
                              <span>⌖ {a.districts.join(", ")}</span>
                              <span>◷ {formatDate(a.issued)}</span>
                            </div>
                            <div className="advisory-footer">
                              <span>{a.authority}</span>
                              <strong>
                                {cached
                                  ? t("Cached · verify validity")
                                  : a.current
                                    ? t("Within stated validity")
                                    : a.state === "published"
                                      ? t("Outdated / not currently valid")
                                      : t(a.state)}
                              </strong>
                            </div>
                          </article>
                        ))
                      )}
                      <div className="panel-foot">
                        {t(
                          "◷ Validity is taken from the bulletin. No district-level safety inference.",
                        )}
                      </div>
                    </section>
                    <div className="right-column">
                      <section className="ask-card">
                        <span className="large-icon">◌</span>
                        <div className="eyebrow">
                          {t("A LITTLE CLARITY HELPS")}
                        </div>
                        <h2>
                          {t("Questions about")}
                          <br />
                          {t("flood information?")}
                        </h2>
                        <p>
                          {t(
                            "Find information from published advisories and preparedness guidance, with citations.",
                          )}
                        </p>
                        <button onClick={() => navigate("chat")}>
                          {t("Ask Flood Watch")}
                          <span>→</span>
                        </button>
                        <small>
                          {t("Structured retrieval · No LLM required")}
                        </small>
                      </section>
                      <section className="panel source-panel">
                        <div className="section-heading">
                          <h2>{t("Source transparency")}</h2>
                          <span>◇</span>
                        </div>
                        {sources.map((s) => (
                          <div className="source" key={s.name}>
                            <strong>{t(s.name)}</strong>
                            <span className="source-status">
                              ◷{" "}
                              {s.stale
                                ? t("Unavailable / stale")
                                : t("Recently checked")}
                            </span>
                            <p>{t(s.status)}</p>
                            <small>
                              {t("Last successful check:")}
                              {formatDate(s.last_success)}
                            </small>
                            <a target="_blank" rel="noreferrer" href={s.url}>
                              {t("Visit official source ↗")}
                            </a>
                          </div>
                        ))}
                      </section>
                    </div>
                  </div>
                </>
              )}
              {detail && (
                <section className="panel detail">
                  <button className="outline" onClick={() => setDetail(null)}>
                    {t("← Back to advisories")}
                  </button>
                  {detail.demo && (
                    <p className="demo-label">
                      {t("DEMO — NOT A REAL WARNING")}
                    </p>
                  )}
                  <h2>{detail.title}</h2>
                  <p className="fine-print">
                    {t("Original bulletin — shown in its published language")}
                  </p>
                  <p
                    className="original"
                    lang={detail.language}
                    dir={detail.language === "en" ? "ltr" : "rtl"}
                  >
                    {detail.body}
                  </p>
                  <dl>
                    {Object.entries({
                      "Issuing authority": detail.authority,
                      Districts: detail.districts.join(", "),
                      "Flood type": detail.hazard,
                      "Original severity": detail.severity,
                      "Official issue time": formatDate(detail.issued),
                      "Valid until": formatDate(detail.expires),
                      Ingested: formatDate(detail.ingested),
                      Status:
                        detail.current && !cached
                          ? t("Within stated validity")
                          : cached
                            ? t("Cached; verify with source")
                            : t(detail.state),
                    }).map(([k, v]) => (
                      <div key={k}>
                        <dt>{t(k)}</dt>
                        <dd>{t(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  <a href={detail.source_url} target="_blank" rel="noreferrer">
                    {t("Open original source reference ↗")}
                  </a>
                  {detail.demo && (
                    <p>
                      {t(
                        "Reference points to an official website for context; this fictional bulletin was not issued by that authority.",
                      )}
                    </p>
                  )}
                </section>
              )}
              {tab === "chat" && (
                <section className="panel chat-panel">
                  <div className="chat-intro">
                    <span className="large-icon">◌</span>
                    <h2>{t("What would you like to know?")}</h2>
                    <p>
                      {t("Selected district:")}
                      <strong>{t(district)}</strong>
                      {t(". Answers cite stored evidence and its date.")}
                    </p>
                  </div>
                  <div className="suggestions">
                    {[
                      t("What is the latest advisory for") +
                        " " +
                        t(district) +
                        "?",
                      t("How should I prepare?"),
                      t("Is my village safe?"),
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setQuestion(s);
                          void ask(s);
                        }}
                      >
                        {s} ↗
                      </button>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void ask();
                    }}
                  >
                    <label htmlFor="question">{t("Your question")}</label>
                    <div className="question-row">
                      <input
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={t("Ask about advisories or preparedness…")}
                        maxLength={1000}
                      />
                      <button className="primary" disabled={busy}>
                        {busy ? t("Retrieving…") : t("Ask →")}
                      </button>
                    </div>
                  </form>
                  {answer && (
                    <div className="answer" aria-live="polite">
                      <span className="eyebrow">{t(answer.mode)}</span>
                      <p className="original">{answer.answer}</p>
                      {answer.citations.map((c, i) => (
                        <div className="citation" key={i}>
                          <a
                            href={c.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            [{i + 1}] {c.title} ↗
                          </a>
                          <small>
                            {c.authority} ·{" "}
                            {c.issued ? formatDate(c.issued) : c.reviewed}
                            {c.demo ? " · DEMO — NOT A REAL WARNING" : ""}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="fine-print">
                    {t(
                      "AI must not generate flood predictions or evacuation decisions. District information cannot establish village-level safety.",
                    )}
                  </p>
                </section>
              )}
              {tab === "preparedness" && (
                <section>
                  <input
                    className="guidance-search"
                    aria-label={t("Search preparedness")}
                    placeholder={t("Search preparedness guidance…")}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <div className="guidance-grid">
                    {guidance
                      .filter((g) =>
                        (g.title + g.body)
                          .toLowerCase()
                          .includes(q.toLowerCase()),
                      )
                      .map((g, i) => (
                        <article className="panel guidance" key={g.id}>
                          <span className="guide-number">0{i + 1}</span>
                          <span className="pill">{t("Reviewed English")}</span>
                          <h2>{g.title}</h2>
                          <p
                            lang={g.language}
                            dir={g.language === "en" ? "ltr" : "rtl"}
                          >
                            {g.body}
                          </p>
                          <small>
                            {g.authority} · {t("reviewed")} {g.reviewed}
                          </small>
                          <a
                            href={g.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("Official information channel ↗")}
                          </a>
                        </article>
                      ))}
                  </div>
                  <div className="notice">
                    {t(
                      "Urdu and Sindhi emergency guidance translations are drafts and are not published. No helplines, shelters or routes are inferred.",
                    )}
                  </div>
                </section>
              )}
              {tab === "settings" && (
                <section className="panel settings-panel">
                  <h2>{t("District notifications")}</h2>
                  <p>
                    {demo
                      ? t("Demo mode allows local mock notifications only.")
                      : t(
                          "External channels require operator configuration and a verified destination.",
                        )}
                  </p>
                  <label>{t("Districts")}</label>
                  <div className="district-options">
                    {districts.map((d) => (
                      <label key={d}>
                        <input
                          type="checkbox"
                          checked={selected.includes(d)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, d]
                                : selected.filter((x) => x !== d),
                            )
                          }
                        />
                        {t(d)}
                      </label>
                    ))}
                  </div>
                  <label htmlFor="channel">{t("Delivery channel")}</label>
                  <select
                    id="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="mock">{t("Local mock inbox")}</option>
                    {!demo && (
                      <>
                        <option value="expo">{t("Mobile push (Expo)")}</option>
                        <option value="telegram">Telegram</option>
                      </>
                    )}
                  </select>
                  {channel !== "mock" && (
                    <label>
                      {t("Provider destination")}
                      <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={
                          channel === "expo"
                            ? t("Expo push token from your physical device")
                            : t("Telegram chat ID")
                        }
                      />
                    </label>
                  )}
                  <p>
                    {t("Notification language:")}
                    {t(
                      language === "en"
                        ? "English"
                        : language === "ur"
                          ? "Urdu"
                          : "Sindhi",
                    )}
                    {t(
                      ". A warning is sent only in its reviewed publication language; English content is not silently machine translated.",
                    )}
                  </p>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    {t(
                      "I consent to storing these preferences and destination for district notifications.",
                    )}
                  </label>
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={!consent || selected.length === 0}
                      onClick={subscribe}
                    >
                      {saved
                        ? t("Save preferences")
                        : t("Subscribe to district alerts")}
                    </button>
                    {saved && (
                      <>
                        <button className="outline" onClick={loadInbox}>
                          {t("Refresh delivery history")}
                        </button>
                        <button
                          className="danger"
                          onClick={async () => {
                            try {
                              await api("/subscriptions/" + saved.id, {
                                method: "DELETE",
                                headers: {
                                  Authorization: "Bearer " + saved.token,
                                },
                              });
                              localStorage.removeItem("sfw-subscription");
                              setSaved(null);
                              setInbox([]);
                              setNotice(
                                "Subscription and delivery data deleted.",
                              );
                            } catch (e) {
                              setNotice(String(e));
                            }
                          }}
                        >
                          {t("Unsubscribe & delete data")}
                        </button>
                      </>
                    )}
                  </div>
                  {notice && (
                    <p role="status" className="notice">
                      {t(notice)}
                    </p>
                  )}
                  {inbox.map((d, i) => (
                    <div className="delivery" key={i}>
                      <strong>
                        {d.kind}: {d.status}
                      </strong>
                      <p>{d.receipt}</p>
                    </div>
                  ))}
                  <small>
                    {t(
                      "Keep this browser’s subscription token to manage or delete your subscription. Losing browser storage loses this management capability.",
                    )}
                  </small>
                </section>
              )}
            </>
          )}
          <footer>
            <span className="footer-logo">≈</span>
            <p>
              <strong>{t("An independent information service.")}</strong>{" "}
              {t(
                "Sindh Flood Watch is not an official government warning authority. Do not rely on this as your sole emergency warning channel.",
              )}
            </p>
            <span>{t("SOURCES OVER SPECULATION")}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function AdminPanel({ language }: { language: Language }) {
  const t = (text: string) => translate(language, text);
  const formatDate = (value: number | null | undefined) =>
    date(value, language);
  const [username, setUsername] = useState("admin"),
    [password, setPassword] = useState(""),
    [authenticated, setAuthenticated] = useState(false),
    [rows, setRows] = useState<Advisory[]>([]),
    [health, setHealth] = useState<Record<string, unknown> | null>(null),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState(""),
    [form, setForm] = useState(() => ({
      title: "",
      body: "",
      districts: ["Dadu"],
      hazard: "river",
      severity: "Exercise advisory",
      authority: "Sindh Flood Watch demo fixture",
      source_url: "https://ffd.pmd.gov.pk/",
      issued: new Date().toISOString().slice(0, 16),
      expires: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      demo: true,
      language: "en",
      translation_reviewed: false,
      supersedes: "",
    }));
  async function load() {
    try {
      setRows(await api("/admin/advisories"));
      setHealth(await api("/admin/health"));
      setAuthenticated(true);
    } catch (e) {
      setMessage(String(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function field(k: string, v: unknown) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  if (!authenticated)
    return (
      <section className="panel login">
        <div className="eyebrow">{t("RESTRICTED WORKSPACE")}</div>
        <h1>{t("Administrator sign in")}</h1>
        <p>
          {t(
            "Accounts are created by the local operator. Public administrator registration is disabled.",
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
              });
              setPassword("");
              setMessage("");
              await load();
            } catch (e) {
              setMessage(String(e));
            }
          }}
        >
          <label>
            {t("Username")}
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            {t("Password")}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="primary">{t("Sign in securely →")}</button>
        </form>
        <p role="alert">{t(message)}</p>
      </section>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("ADMINISTRATOR WORKSPACE")}</div>
          <h1>{t("Review before you publish.")}</h1>
          <p>
            {t(
              "Publication requires approval. Only published, current advisories generate warning jobs.",
            )}
          </p>
        </div>
        <button
          className="outline"
          onClick={async () => {
            await api("/auth/logout", { method: "POST" });
            setAuthenticated(false);
          }}
        >
          {t("Sign out")}
        </button>
      </div>
      <div className="admin-grid">
        <section className="panel admin-form">
          <h2>{editing ? t("Edit draft") : t("Create an advisory")}</h2>
          <label>
            {t("Extract PDF or text bulletin (max 2 MiB)")}
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={async (e) => {
                if (!e.target.files?.[0]) return;
                const data = new FormData();
                data.append("file", e.target.files[0]);
                try {
                  const result = await api<{ text: string }>("/admin/upload", {
                    method: "POST",
                    body: data,
                  });
                  field("body", result.text);
                  setMessage(
                    "Extraction is untrusted. Review original wording and all source fields.",
                  );
                } catch (e) {
                  setMessage(String(e));
                }
              }}
            />
          </label>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api(
                  "/admin/advisories" + (editing ? "/" + editing : ""),
                  {
                    method: editing ? "PUT" : "POST",
                    body: JSON.stringify({
                      ...form,
                      supersedes: form.supersedes || null,
                      issued: new Date(form.issued + "Z").toISOString(),
                      expires: new Date(form.expires + "Z").toISOString(),
                    }),
                  },
                );
                setEditing("");
                setMessage("Draft saved. Review, approve, then publish.");
                await load();
              } catch (e) {
                setMessage(String(e));
              }
            }}
          >
            {(["title", "authority", "source_url", "severity"] as const).map(
              (k) => (
                <label key={k}>
                  {t(k.replace("_", " "))}
                  <input
                    required
                    value={form[k]}
                    onChange={(e) => field(k, e.target.value)}
                  />
                </label>
              ),
            )}
            <label>
              {t("Supersedes advisory ID (optional update)")}
              <input
                value={form.supersedes}
                onChange={(e) => field("supersedes", e.target.value)}
              />
            </label>
            <label>
              {t("Original bulletin wording")}
              <textarea
                required
                rows={6}
                value={form.body}
                onChange={(e) => field("body", e.target.value)}
              />
            </label>
            <label>
              {t("Intended districts (comma-separated, exact names)")}
              <input
                value={form.districts.join(",")}
                onChange={(e) =>
                  field(
                    "districts",
                    e.target.value.split(",").map((x) => x.trim()),
                  )
                }
              />
            </label>
            <label>
              {t("Hazard")}
              <select
                value={form.hazard}
                onChange={(e) => field("hazard", e.target.value)}
              >
                <option value="river">{t("River flooding")}</option>
                <option value="flash">{t("Flash flooding")}</option>
                <option value="urban">{t("Urban flooding")}</option>
              </select>
            </label>
            <div className="two-col">
              {(["issued", "expires"] as const).map((k) => (
                <label key={k}>
                  {t(k)} (UTC)
                  <input
                    required
                    type="datetime-local"
                    value={form[k]}
                    onChange={(e) => field(k, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <label>
              {t("Publication language")}
              <select
                value={form.language}
                onChange={(e) => field("language", e.target.value)}
              >
                <option value="en">{t("English")}</option>
                <option value="ur">{t("Urdu")}</option>
                <option value="sd">{t("Sindhi")}</option>
              </select>
            </label>
            <label className="consent">
              <input
                type="checkbox"
                checked={form.demo}
                onChange={(e) => field("demo", e.target.checked)}
              />
              {t("Fictional demo — mock delivery only")}
            </label>
            <label className="consent">
              <input
                type="checkbox"
                checked={form.translation_reviewed}
                onChange={(e) =>
                  field("translation_reviewed", e.target.checked)
                }
              />
              {t("I have completed human review of this translation")}
            </label>
            <button className="primary">
              {editing
                ? t("Save edit & reset approval")
                : t("Save draft for review")}
            </button>
          </form>
          <p role="status">{message}</p>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>{t("Publication queue")}</h2>
            <button className="outline" onClick={load}>
              {t("↻ Refresh")}
            </button>
          </div>
          {rows.map((a) => (
            <article className="queue-item" key={a.id}>
              <span className="pill">
                {t(a.state)} · rev {a.revision}
              </span>
              {a.demo && (
                <p className="demo-label">{t("DEMO — NOT A REAL WARNING")}</p>
              )}
              <h3>{a.title}</h3>
              <p
                className="original"
                lang={a.language}
                dir={a.language === "en" ? "ltr" : "rtl"}
              >
                {a.body}
              </p>
              <small>
                {t("ID:")}
                {a.id}
                <br />
                {t("Preview:")}
                {a.districts.join(", ")} · {a.language} · {a.severity}
                <br />
                {formatDate(a.issued)} → {formatDate(a.expires)}
                <br />
                {a.source_url}
              </small>
              <div className="button-row">
                {["draft", "approved"].includes(a.state) && (
                  <button
                    className="outline"
                    onClick={() => {
                      setEditing(a.id);
                      setForm({
                        title: a.title,
                        body: a.body,
                        districts: a.districts,
                        hazard: a.hazard,
                        severity: a.severity,
                        authority: a.authority,
                        source_url: a.source_url,
                        issued: new Date(a.issued * 1000)
                          .toISOString()
                          .slice(0, 16),
                        expires: new Date(a.expires * 1000)
                          .toISOString()
                          .slice(0, 16),
                        demo: a.demo,
                        language: a.language,
                        translation_reviewed: false,
                        supersedes: "",
                      });
                    }}
                  >
                    {t("Edit")}
                  </button>
                )}
                {(a.state === "draft"
                  ? ["approve"]
                  : a.state === "approved"
                    ? ["publish"]
                    : a.state === "published"
                      ? ["withdraw", "expire"]
                      : []
                ).map((action) => (
                  <button
                    className={action === "publish" ? "primary" : "outline"}
                    key={t(action)}
                    onClick={async () => {
                      try {
                        await api("/admin/advisories/" + a.id + "/" + action, {
                          method: "POST",
                        });
                        setMessage(action + " complete");
                        await load();
                      } catch (e) {
                        setMessage(String(e));
                      }
                    }}
                  >
                    {t(action)}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
      <section className="panel health">
        <h2>{t("Worker, sources & audit trail")}</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>
    </>
  );
}
