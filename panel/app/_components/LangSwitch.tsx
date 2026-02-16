"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANGS, normLang, type Lang } from "../_lib/i18n";

export default function LangSwitch({ value }: { value: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState<Lang>(normLang(value));

  useEffect(() => {
    setV(normLang(value));
  }, [value]);

  async function apply(next: Lang) {
    setV(next);
    
    // Call API endpoint instead of Server Action
    try {
      const res = await fetch("/api/user/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lang: next }),
      });
      
      if (!res.ok) {
        console.error("[LangSwitch] API error:", await res.text());
        return;
      }
      
      const data = await res.json();
      console.log("[LangSwitch] Language changed to:", data.lang);
      
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("[LangSwitch] Fetch error:", error);
    }
  }

  return (
    <select
      className="border rounded px-3 py-2 text-sm"
      value={v}
      disabled={pending}
      onChange={(e) => apply(normLang(e.target.value))}
      aria-label="Language"
      title="Language"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.name}
        </option>
      ))}
    </select>
  );
}
