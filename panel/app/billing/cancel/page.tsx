export default function BillingCancelPage() {
  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Płatność anulowana</h1>
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>
        Nic się nie stało — możesz wrócić do panelu i spróbować ponownie.
      </p>
      <div style={{ marginTop: 20 }}>
        <a href="/" style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 10, textDecoration: "none" }}>
          Wróć do panelu
        </a>
      </div>
    </main>
  );
}
