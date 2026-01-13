import { t, type Lang } from "../_lib/i18n";
import LangSwitch from "./LangSwitch";
import LangAutoSync from "./LangAutoSync";

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
        <LangAutoSync value={lang} />
        <LangSwitch value={lang} />
        <div className="border rounded-full px-4 py-2 text-sm whitespace-nowrap">
          {t(lang, "plan_lower")} {planName}
          {expires} · {active}
        </div>
      </div>
    </div>
  );
}
