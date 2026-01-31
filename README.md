# FindYourDeal - Panel & Billing System

Panel administracyjny dla systemu FindYourDeal z globalnym systemem billing opartym na Stripe.

## Wymagania

- Node.js 20+
- PostgreSQL 16+
- Stripe account (test mode lub production)

## Instalacja

### 1. Panel (Next.js)

```bash
cd panel
npm install
cp .env.example .env.local
# Wypełnij .env.local danymi z Stripe i bazy danych
npm run dev
```

### 2. Zmienne środowiskowe

Wymagane zmienne w `.env.local`:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth secret key (generate: `openssl rand -base64 32`)
- `STRIPE_SECRET_KEY` - Stripe Secret Key (Dashboard → Developers → API Keys)
- `STRIPE_PRICE_*` - Stripe Price IDs dla każdego planu i addonu

#### Utwórz produkty w Stripe Dashboard:

1. Plany subskrypcyjne:
   - **Starter** → `STRIPE_PRICE_STARTER`
   - **Growth** → `STRIPE_PRICE_GROWTH`
   - **Platinum** → `STRIPE_PRICE_PLATINUM`

2. Addony (one-time):
   - **+10 linków** → `STRIPE_PRICE_ADDON_LINKS_10`

## Architektura Billing

### Global CTA System

System billing wyświetla jeden CTA w zależności od aktualnego planu użytkownika:

- **Trial** → Wybierz plan (Starter / Growth / Platinum)
- **Starter** → Upgrade (Growth / Platinum)
- **Growth** → Upgrade do Platinum
- **Platinum** → Dokup +10 linków

### API Endpoints

#### `POST /api/billing/checkout`

Unified endpoint do tworzenia sesji checkout Stripe.

**Request:**
```json
{
  "type": "plan",
  "plan": "starter" | "growth" | "platinum"
}
```

lub

```json
{
  "type": "addon",
  "addon": "links_10"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "requestId": "abc123..."
}
```

**Error Response:**
```json
{
  "error": "invalid_plan",
  "message": "Plan not allowed for your current plan",
  "requestId": "abc123..."
}
```

### Components

#### `/app/billing/_components/BillingCTA.tsx`

Client component renderujący odpowiedni CTA w zależności od planu.

Props:
- `currentPlan`: "trial" | "starter" | "growth" | "platinum"
- `lang`: string (dla i18n)

Features:
- Client-side checkout (fetch + redirect)
- Toast notifications z requestId przy błędach
- Loading states
- Disabled buttons podczas procesu

## Development

```bash
cd panel
npm run dev
```

Panel dostępny na: http://localhost:3000

## Production

### Docker Compose

```bash
docker compose build panel
docker compose up -d panel
```

### Environment

Upewnij się że wszystkie zmienne środowiskowe są ustawione w produkcji:

```bash
# Dockerfile.panel
ENV STRIPE_SECRET_KEY=sk_live_...
ENV STRIPE_PRICE_STARTER=price_live_...
# etc.
```

## Troubleshooting

### Błąd: "checkout_failed_502"

- Sprawdź czy `STRIPE_SECRET_KEY` jest poprawny
- Sprawdź czy Price IDs są poprawne (test vs live mode)

### Toast nie pojawia się

- Sprawdź DevTools → Console
- Upewnij się że `BillingCTA` jest client component ("use client")

### Redirect nie działa

- Sprawdź `NEXT_PUBLIC_PANEL_URL` w `.env.local`
- Sprawdź success_url i cancel_url w `/api/billing/checkout/route.ts`

## License

Private - FindYourDeal
