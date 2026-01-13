import Link from "next/link";

type Props = {
  current: string; // "links" | "billing" | ...
};

function tabClass(active: boolean) {
  return [
    "border rounded px-3 py-2 text-sm",
    active ? "bg-black text-white" : "bg-white",
  ].join(" ");
}

export default function TopNav({ current }: Props) {
  return (
    <nav className="flex items-center gap-2">
      <Link className={tabClass(current === "links")} href="/links">
        Wyszukiwania
      </Link>
      <Link className={tabClass(current === "billing")} href="/billing">
        Billing
      </Link>
    </nav>
  );
}
