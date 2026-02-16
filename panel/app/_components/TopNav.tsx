import Link from "next/link";
import { t, type Lang } from "../_lib/i18n";

type Props = {
  current: string; // "links" | "billing" | ...
  lang: Lang;
};

function tabClass(active: boolean) {
  return [
    "border rounded px-3 py-2 text-sm",
    active ? "bg-black text-white" : "bg-white",
  ].join(" ");
}

export default function TopNav({ current, lang }: Props) {
  return (
    <nav className="flex items-center gap-2">
      <Link className={tabClass(current === "links")} href="/links">
        {t(lang, "nav_links")}
      </Link>
      <Link className={tabClass(current === "billing")} href="/billing">
        {t(lang, "nav_billing")}
      </Link>
    </nav>
  );
}
