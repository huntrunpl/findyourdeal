import LangSwitch from "./LangSwitch";
import { getPanelLang } from "../_lib/getPanelLang";
import { planName, t } from "../_lib/i18n";

type TopBarProps = {
  title: string;
  current: "links" | "billing";
  planCode: string;
  expiresAtLabel: string | null;
  enabledCount: number;
  limitTotal: number;
};

export default async function TopBar(props: TopBarProps) {
  const lang = await getPanelLang();

  const tabClass = (key: "links" | "billing") =>
    `border rounded px-4 py-2 ${props.current === key ? "bg-black text-white" : ""}`;

  const title = props.current === "links" ? t(lang, "nav_links") : t(lang, "nav_billing");
  const pName = planName(props.planCode);

  const expires = props.expiresAtLabel
    ? ` (${t(lang, "expires_prefix")} ${props.expiresAtLabel})`
    : "";

  const active = `${t(lang, "active_label")}: ${props.enabledCount}/${props.limitTotal}`;

  return (
    <header className="border rounded p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">{title}</h1>

        <a className={tabClass("links")} href="/links">
          {t(lang, "nav_links")}
        </a>
        <a className={tabClass("billing")} href="/billing">
          {t(lang, "nav_billing")}
        </a>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <LangSwitch value={lang} />
        <div className="border rounded-full px-4 py-2 text-sm whitespace-nowrap">
          {t(lang, "plan_label")}: {pName}
          {expires} · {active}
        </div>
      </div>
    </header>
  );
}
