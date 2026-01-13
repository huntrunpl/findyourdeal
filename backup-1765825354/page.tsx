import { redirect } from "next/navigation";

export default function LoginPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const token = searchParams?.token;
  const t = Array.isArray(token) ? token[0] : token;

  // jeśli ktoś trafi na /login?token=... (np. stary link) -> przekieruj na poprawny endpoint
  if (t) {
    redirect(`/api/auth/login?token=${encodeURIComponent(t)}`);
  }

  return (
    <main style={{ padding: 48 }}>
      <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 16 }}>Login</h1>
      <p style={{ fontSize: 20, opacity: 0.8 }}>
        Wejdź linkiem z Telegrama: komenda <b>/panel</b>
      </p>
    </main>
  );
}
