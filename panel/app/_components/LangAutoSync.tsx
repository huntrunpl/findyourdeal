"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { normLang } from "../_lib/i18n";

export default function LangAutoSync({ value }: { value: string }) {
  const router = useRouter();
  const last = useRef(normLang(value));

  useEffect(() => {
    last.current = normLang(value);
  }, [value]);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const res = await fetch("/api/user/lang", { cache: "no-store" });
        if (!res.ok) return;
        const js = await res.json().catch(() => null);
        const next = normLang(js?.lang);

        if (alive && next !== last.current) {
          last.current = next;
          router.refresh();
        }
      } catch {}
    }

    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [router]);

  return null;
}
