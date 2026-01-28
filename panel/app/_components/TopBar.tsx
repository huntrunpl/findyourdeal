import { t, type Lang } from "../_lib/i18n";

function getLangDisplay(lang: Lang) {
  const LANGS = [
    { code: "pl", name: "Polski", flag: "🇵🇱" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ro", name: "Română", flag: "🇷🇴" },
    { code: "nl", name: "Nederlands", flag: "🇳🇱" },
    { code: "cs", name: "Čeština", flag: "🇨🇿" },
    { code: "sk", name: "Slovenčina", flag: "🇸🇰" },
  ];
  const found = LANGS.find(l => l.code === lang);
  return found ? `${found.flag} ${found.name}` : "🌍 English";
}





function prettyPlan(code: string) {
  const c = String(code || "").toLowerCase();
  if (c === "trial") return "Trial";
  if (c === "basic") return "Basic";
  if (c === "growth") return "Growth";
  if (c === "platinum") return "Platinum";
  if (!c) return "Free";
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export default async function TopBar(props: {
  lang: Lang;
  title: string;
  current: "links" | "billing";
  planCode: string;
  expiresAtLabel: string | null;
  enabledCount: number;
  limitTotal: number;
}) {
  const lang = props.lang;
  const tabClass = (id: "links" | "billing") =>
    `border rounded px-3 py-2 text-sm ${props.current === id ? "bg-black text-white" : ""}`;

  const planName = prettyPlan(props.planCode);
  const expires = props.expiresAtLabel ? ` (${t(lang, "until_prefix")} ${props.expiresAtLabel})` : "";
  const active = `${t(lang, "active")}: ${props.enabledCount}/${props.limitTotal}`;

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">{props.title}</h1>

        <div className="flex gap-2">
          <a className={tabClass("links")} href="/links">
            {t(lang, "nav_links")}
          </a>
          <a className={tabClass("billing")} href="/billing">
            {t(lang, "nav_billing")}
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Static language display */}
        <div className="border rounded px-3 py-2 text-sm whitespace-nowrap" title={t(lang, "settings_link")}>
          {getLangDisplay(lang)}
        </div>

        {/* Settings link */}
        <a 
          href="/settings" 
          className="border rounded px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
          title={t(lang, "settings_link")}
        >
          ⚙️ {t(lang, "settings_title")}
        </a>

        <div className="border rounded-full px-4 py-2 text-sm whitespace-nowrap">
          {t(lang, "plan_lower")} {planName}
          {expires} · {active}
        </div>
      </div>
    </div>
  );
}
