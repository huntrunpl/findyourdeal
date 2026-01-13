export default function BillingSuccessPage() {
  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Płatność przyjęta ✅</h1>
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>
        Dziękujemy! Jeśli właśnie kupiłeś plan, odśwież panel albo wróć do bota i sprawdź <b>/status</b>.
      </p>
      <div style={{ marginTop: 20 }}>
        <a href="/" style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 10, textDecoration: "none" }}>
          Wróć do panelu
        </a>
      </div>
      <p style={{ marginTop: 18, fontSize: 13, opacity: 0.7 }}>
        Jeśli plan nie odświeżył się w ciągu minuty, wejdź w bota i użyj /status (to wymusza odczyt z bazy).
      </p>
    </main>
  );
}
