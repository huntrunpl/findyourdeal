import getPanelLang from "@/app/_lib/getPanelLang";
import { t, normLang } from "@/app/_lib/i18n";

export default async function BillingCancelPage() {
  const lang = normLang(await getPanelLang());
  const L = new Proxy({}, { get: (_t, k) => t(lang, String(k)) }) as any;

  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>{L.billing_cancel_title}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>
        {L.billing_cancel_desc}
      </p>
      <div style={{ marginTop: 20 }}>
        <a href="/" style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 10, textDecoration: "none" }}>
          {L.billing_cancel_back_btn}
        </a>
      </div>
    </main>
  );
}
