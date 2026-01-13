"use client";

import { useEffect, useState } from "react";
import { getUserLangAction, setUserLangAction } from "../auth/actions";

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

export default function LanguageSelect() {
  const [lang, setLang] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const current = await getUserLangAction();
        if (current) setLang(String(current));
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function onChange(next: string) {
    setLang(next);
    try {
      await setUserLangAction(next);
    } catch {}
    window.location.reload();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Language</span>
      <select
        value={lang}
        disabled={loading}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "transparent",
        }}
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
