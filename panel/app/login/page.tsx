import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams?.token;
  if (token) {
    redirect(`/auth/login?token=${encodeURIComponent(token)}`);
  }

  return (
    <div style={{ padding: 48, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h1 style={{ fontSize: 44, margin: 0 }}>Logowanie do panelu</h1>

      <p style={{ fontSize: 18, color: "#555", marginTop: 12 }}>
        Ten panel nie ma hasła. Logujesz się bezpiecznym linkiem z Telegrama.
      </p>

      <div style={{ marginTop: 18, fontSize: 16, color: "#333" }}>
        1) Otwórz rozmowę z botem w Telegramie<br />
        2) Wpisz komendę: <b>/panel</b><br />
        3) Kliknij link i gotowe
      </div>

      <p style={{ marginTop: 24 }}>
        <Link href="/links">Przejdź do panelu</Link>
      </p>
    </div>
  );
}
