"use client";

import { useState } from "react";
import { LANGS, normalizeLang } from "../_lib/i18n";

export default function LangSwitch({ value }: { value: string }) {
  const [v, setV] = useState<string>(normalizeLang(value));

  async function onChange(next: string) {
    const n = normalizeLang(next);
    setV(n);

    await fetch("/api/user/lang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lang: n }),
    });

    // “od razu” w panelu = natychmiastowy reload UI
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-3 py-2 text-sm"
        value={v}
        onChange={(e) => onChange(e.target.value)}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}
