"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGS, normLang, t } from "../_lib/i18n";

const SUPPORTED_TIMEZONES = [
  "Europe/Warsaw",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Prague",
  "Europe/Vienna",
  "Europe/Bucharest",
  "Europe/Brussels",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Athens",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function SettingsPage() {
  const [lang, setLang] = useState<ReturnType<typeof normLang>>("en");
  const [timezone, setTimezone] = useState<string>("Europe/Warsaw");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [langRes, tzRes] = await Promise.all([
          fetch("/api/user/lang"),
          fetch("/api/user/timezone"),
        ]);

        if (langRes.ok) {
          const data = await langRes.json();
          setLang(normLang(data.lang));
        }
        if (tzRes.ok) {
          const data = await tzRes.json();
          setTimezone(String(data.timezone || "Europe/Warsaw"));
        }
      } catch (error) {
        console.error("[settings] fetch error", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const L = useMemo(() => t(lang) as Record<string, string>, [lang]);

  const handleLangChange = async (next: string) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: next }),
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = normLang(data.lang);
        setLang(normalized);
        setMessage(t(normalized, "settings_saved_lang", { lang: data.lang }));
        
        // Refresh panel to update all UI with new language
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(`❌ ${err.error || "Error"}`);
      }
    } catch (e) {
      setMessage("❌ " + L.settings_error);
    } finally {
      setSaving(false);
    }
  };

  const handleTimezoneChange = async (next: string) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/timezone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: next }),
      });
      if (res.ok) {
        const data = await res.json();
        setTimezone(data.timezone);
        setMessage(t(lang, "settings_saved_tz", { tz: data.timezone }));
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(`❌ ${err.error || "Error"}`);
      }
    } catch (e) {
      setMessage("❌ " + L.settings_error);
    } finally {
      setSaving(false);
    }
  };

  const currentTime = useMemo(() => {
    try {
      return new Date().toLocaleString("en-US", {
        timeZone: timezone,
        dateStyle: "medium",
        timeStyle: "medium",
      });
    } catch (e) {
      return "";
    }
  }, [timezone]);

  if (loading) {
    return (
      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Settings</h1>
          <p className="text-sm text-gray-600">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{L.settings_title || "Settings"}</h1>
          <p className="text-sm text-gray-600">{L.settings_desc || "Manage your language and timezone."}</p>
        </div>

        {message && (
          <div
            className={`border rounded p-3 text-sm ${
              message.startsWith("✅")
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <section className="border rounded-lg p-5 space-y-3">
          <div>
            <h2 className="text-lg font-medium">{L.settings_language_label || "Language"}</h2>
          </div>
          <select
            value={lang}
            onChange={(e) => handleLangChange(e.target.value)}
            disabled={saving}
            className="w-full border rounded px-3 py-2 bg-white disabled:opacity-50"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} ({l.code})
              </option>
            ))}
          </select>
        </section>

        <section className="border rounded-lg p-5 space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">{L.settings_timezone_label || "Timezone"}</h2>
            <p className="text-sm text-gray-600">{L.settings_timezone_hint || "Used for notifications and history times."}</p>
          </div>
          <select
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            disabled={saving}
            className="w-full border rounded px-3 py-2 bg-white disabled:opacity-50"
          >
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {currentTime && (
            <div className="text-sm text-gray-600">
              {L.settings_current_time || "Current time:"} {" "}
              <span className="font-mono font-medium">{currentTime}</span>
            </div>
          )}
        </section>

        <div className="pt-2">
          <a href="/links" className="inline-block border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition text-sm">
            POWRÓT DO WYSZUKIWANIA
          </a>
        </div>
      </div>
    </main>
  );
}