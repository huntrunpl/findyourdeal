"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANGS, normLang, type Lang } from "../_lib/i18n";
import { setUserLangAction } from "../auth/actions";

export default function LangSwitch({ value }: { value: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState<Lang>(normLang(value));

  useEffect(() => {
    setV(normLang(value));
  }, [value]);

  async function apply(next: Lang) {
    setV(next);
    await setUserLangAction(next);
    startTransition(() => router.refresh());
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
