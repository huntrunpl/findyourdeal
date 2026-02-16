import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "../_lib/i18n";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams?.token;
  if (token) {
    redirect(`/auth/login?token=${encodeURIComponent(token)}`);
  }

  // ✅ PUBLIC PAGE CONTRACT: always EN (no user context, no token)
  const lang = "en";

  return (
    <div style={{ padding: 48, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h1 style={{ fontSize: 44, margin: 0 }}>{t(lang, "login_title")}</h1>

      <p style={{ fontSize: 18, color: "#555", marginTop: 12 }}>
        {t(lang, "login_subtitle")}
      </p>

      <div style={{ marginTop: 18, fontSize: 16, color: "#333" }}>
        {t(lang, "login_step_1")}<br />
        {t(lang, "login_step_2")} <b>/panel</b><br />
        {t(lang, "login_step_3")}
      </div>

      <p style={{ marginTop: 24 }}>
        <Link href="/links">{t(lang, "login_cta")}</Link>
      </p>
    </div>
  );
}
