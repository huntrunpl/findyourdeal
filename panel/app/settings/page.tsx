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
  const [quietEnabled, setQuietEnabled] = useState<boolean>(false);
  const [quietStart, setQuietStart] = useState<number>(22);
  const [quietEnd, setQuietEnd] = useState<number>(7);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(true);
  const [notifMode, setNotifMode] = useState<string>("single");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [langRes, tzRes, quietRes, notifRes] = await Promise.all([
          fetch("/api/user/lang"),
          fetch("/api/user/timezone"),
          fetch("/api/user/quiet-hours"),
          fetch("/api/user/notifications"),
        ]);

        if (langRes.ok) {
          const data = await langRes.json();
          setLang(normLang(data.lang));
        }
        if (tzRes.ok) {
          const data = await tzRes.json();
          setTimezone(String(data.timezone || "Europe/Warsaw"));
        }
        if (quietRes.ok) {
          const data = await quietRes.json();
          setQuietEnabled(!!data.enabled);
          setQuietStart(data.start ?? 22);
          setQuietEnd(data.end ?? 7);
        }
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifEnabled(!!data.enabled);
          setNotifMode(data.mode || "single");
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

  const handleNotificationsSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: notifEnabled,
          mode: notifMode,
        }),
      });
      if (res.ok) {
        setMessage("✅ Notification settings saved");
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(`❌ ${err.error || "Error saving notifications"}`);
      }
    } catch (e) {
      setMessage("❌ Error saving notifications");
    } finally {
      setSaving(false);
    }
  };

  const handleQuietHoursSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/quiet-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: quietEnabled,
          start: quietStart,
          end: quietEnd,
        }),
      });
      if (res.ok) {
        setMessage("✅ Quiet hours saved");
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(`❌ ${err.error || "Error saving quiet hours"}`);
      }
    } catch (e) {
      setMessage("❌ Error saving quiet hours");
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
      <main className="p-6 bg-white dark:bg-zinc-950 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 bg-white dark:bg-zinc-950 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-black dark:text-white">{L.settings_title || "Settings"}</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400">{L.settings_desc || "Manage your language and timezone."}</p>
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

        <section className="border dark:border-zinc-700 rounded-lg p-5 space-y-3 bg-white dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-medium text-black dark:text-white">{L.settings_language_label || "Language"}</h2>
          </div>
          <select
            value={lang}
            onChange={(e) => handleLangChange(e.target.value)}
            disabled={saving}
            className="w-full border dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white disabled:opacity-50"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} ({l.code})
              </option>
            ))}
          </select>
        </section>

        <section className="border dark:border-zinc-700 rounded-lg p-5 space-y-3 bg-white dark:bg-zinc-900">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-black dark:text-white">{L.settings_timezone_label || "Timezone"}</h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400">{L.settings_timezone_hint || "Used for notifications and history times."}</p>
          </div>
          <select
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            disabled={saving}
            className="w-full border dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white disabled:opacity-50"
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

        <section className="border dark:border-zinc-700 rounded-lg p-5 space-y-4 bg-white dark:bg-zinc-900">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-black dark:text-white">🌙 Cisza nocna (brak powiadomień)</h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              Nie wysyłaj powiadomień w wybranych godzinach (w Twojej strefie czasowej)
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quietEnabled}
              onChange={(e) => setQuietEnabled(e.target.checked)}
              disabled={saving}
              className="w-4 h-4 disabled:opacity-50"
            />
            <span className="text-sm text-black dark:text-white">Włącz ciszę nocną</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Od godziny:</label>
              <select
                value={quietStart}
                onChange={(e) => setQuietStart(Number(e.target.value))}
                disabled={saving}
                className="w-full border dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white disabled:opacity-50"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Do godziny:</label>
              <select
                value={quietEnd}
                onChange={(e) => setQuietEnd(Number(e.target.value))}
                disabled={saving}
                className="w-full border dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white disabled:opacity-50"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleQuietHoursSave}
            disabled={saving}
            className="w-full border border-blue-600 rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Zapisywanie..." : "Zapisz ustawienia ciszy nocnej"}
          </button>
        </section>


        <section className="border dark:border-zinc-700 rounded-lg p-5 space-y-4 bg-white dark:bg-zinc-900">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-black dark:text-white">Powiadomienia</h2>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifEnabled}
              onChange={(e) => setNotifEnabled(e.target.checked)}
              disabled={saving}
              className="w-4 h-4 disabled:opacity-50"
            />
            <span className="text-sm text-black dark:text-white">Powiadomienia włączone</span>
          </label>

          <div>
            <label className="block text-sm text-gray-700 dark:text-zinc-300 mb-2">Domyślny tryb powiadomień</label>
            <select
              value={notifMode}
              onChange={(e) => setNotifMode(e.target.value)}
              disabled={saving}
              className="w-full border dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white disabled:opacity-50"
            >
              <option value="single">Pojedyncze (natychmiastowe)</option>
              <option value="batch">Zbiorcze</option>
            </select>
          </div>

          <button
            onClick={handleNotificationsSave}
            disabled={saving}
            className="w-full border border-blue-600 rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Zapisywanie..." : "Zapisz ustawienia powiadomień"}
          </button>
        </section>

        <div className="pt-2">
          <a href="/links" className="inline-block border border-blue-600 rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition text-sm">
            POWRÓT DO WYSZUKIWANIA
          </a>
        </div>
      </div>
    </main>
  );
}
