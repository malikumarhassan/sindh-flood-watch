export type Language = "en" | "ur" | "sd";
export type Advisory = {
  id: string;
  title: string;
  body: string;
  districts: string[];
  hazard: "river" | "flash" | "urban";
  severity: string;
  authority: string;
  source_url: string;
  issued: number;
  expires: number;
  ingested: number;
  state: string;
  demo: boolean;
  current: boolean;
  language: Language;
  revision: number;
};
export type Source = {
  name: string;
  url: string;
  status: string;
  last_check: number | null;
  last_success: number | null;
  stale: boolean;
};
export type Guidance = {
  id: string;
  title: string;
  body: string;
  source_url: string;
  authority: string;
  reviewed: string;
  language: string;
  status: string;
};
export type Citation = {
  title: string;
  source_url: string;
  authority: string;
  issued?: number;
  reviewed?: string;
  demo?: boolean;
};
export type ChatAnswer = {
  answer: string;
  citations: Citation[];
  mode: string;
};
export const labels = {
  en: {
    home: "Overview",
    advisories: "Advisories",
    chat: "Ask Flood Watch",
    preparedness: "Preparedness",
    settings: "Alert settings",
  },
  ur: {
    home: "جائزہ",
    advisories: "اطلاعات",
    chat: "سوال پوچھیں",
    preparedness: "تیاری",
    settings: "اطلاع کی ترتیبات",
  },
  sd: {
    home: "جائزو",
    advisories: "اطلاعون",
    chat: "سوال پڇو",
    preparedness: "تياري",
    settings: "اطلاع جون سيٽنگون",
  },
};
export function date(
  value: number | null | undefined,
  language: Language = "en",
) {
  return value
    ? new Intl.DateTimeFormat(language === "en" ? "en-PK" : language + "-PK", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value * 1000)) + " PKT"
    : language === "ur"
      ? "دستیاب نہیں"
      : language === "sd"
        ? "موجود ناهي"
        : "Not available";
}
export function client(base: string) {
  return async function api<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(base + path, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      let detail;
      try {
        detail = (await response.json()).detail;
      } catch {
        detail = response.statusText;
      }
      throw new Error(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    }
    return response.json();
  };
}
