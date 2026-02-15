"use client";

import { useEffect, useState } from "react";

export default function TimezonePill() {
  const [timezone, setTimezone] = useState("—");

  useEffect(() => {
    fetch("/api/user/timezone", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.timezone) setTimezone(data.timezone);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="border dark:border-zinc-700 rounded px-2 py-1 text-xs text-gray-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 whitespace-normal sm:whitespace-nowrap truncate max-w-full" title="Timezone">
      TZ: {timezone}
    </div>
  );
}
