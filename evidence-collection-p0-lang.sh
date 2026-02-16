#!/bin/bash
# 🚨 P0: Panel Language Change - Evidence Collection Protocol
# Before next deploy, we need PROOF of what's happening

echo "════════════════════════════════════════════════════════════════"
echo "🔍 P0 EVIDENCE COLLECTION: Panel Language Change"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ========================================================================
# STEP 1: DB State - Source of Truth
# ========================================================================
echo "📊 STEP 1: Database State (Source of Truth)"
echo "────────────────────────────────────────────"

echo ""
echo "Current user language settings:"
docker compose exec -T db psql -U fyd -d fyd -c "
SELECT id, language, lang, language_code, updated_at 
FROM users 
WHERE id IN (SELECT DISTINCT user_id FROM panel_sessions WHERE expires_at > NOW())
ORDER BY id;
"

echo ""
echo "Active panel sessions (should have valid cookies):"
docker compose exec -T db psql -U fyd -d fyd -c "
SELECT 
  id::text as session_id,
  user_id,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 86400 as days_left
FROM panel_sessions 
WHERE expires_at > NOW() 
ORDER BY created_at DESC 
LIMIT 5;
"

# ========================================================================
# STEP 2: Recent API Activity
# ========================================================================
echo ""
echo "📝 STEP 2: Recent API Activity"
echo "────────────────────────────────────────────"

echo ""
echo "Last 20 language-related logs:"
docker compose logs panel --tail 500 | grep -E "(api/user/lang|cookie|session|401)" | tail -20

echo ""
echo "Count of 401 errors in last 500 lines:"
docker compose logs panel --tail 500 | grep -c "401" || echo "0"

# ========================================================================
# STEP 3: Code Verification
# ========================================================================
echo ""
echo "🔧 STEP 3: Code Verification"
echo "────────────────────────────────────────────"

echo ""
echo "✓ Checking if credentials: 'include' exists in Settings:"
docker compose exec panel grep -c 'credentials: "include"' /app/panel/app/settings/page.tsx || echo "❌ NOT FOUND"

echo ""
echo "✓ Checking API route cookie reading method:"
docker compose exec panel grep -n "getSessionUserId\|request.cookies" /app/panel/app/api/user/lang/route.ts | head -5

echo ""
echo "✓ Checking getPanelLang cookie reading method:"
docker compose exec panel grep -n "getUserIdFromAny\|cookies()" /app/panel/app/_lib/getPanelLang.ts | head -5

# ========================================================================
# STEP 4: Manual Browser Test Protocol
# ========================================================================
echo ""
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🧪 MANUAL BROWSER TEST PROTOCOL"
echo "════════════════════════════════════════════════════════════════"
echo ""

cat << 'EOF'
┌─────────────────────────────────────────────────────────────────┐
│ 🌐 BROWSER TEST - Do this in Chrome/Firefox DevTools            │
└─────────────────────────────────────────────────────────────────┘

1️⃣  PREPARATION
   ─────────────
   ✓ Open panel: https://panel.findyourdeal.app
   ✓ Open DevTools (F12)
   ✓ Go to Network tab
   ✓ Check "Preserve log"
   ✓ Go to Application tab → Cookies → https://panel.findyourdeal.app
   
   📸 EVIDENCE A: Screenshot cookies list
       ↳ Look for: `fyd_panel_session` cookie
       ↳ Check: Value (should be UUID), Path (should be /), Expires

2️⃣  TEST: Change Language PL → FR
   ──────────────────────────────
   ✓ Go to Settings page
   ✓ Find language dropdown (current: PL)
   ✓ Change to: FR (Français)
   ✓ Click change/save
   
   In Network tab, find: POST /api/user/lang
   
   📸 EVIDENCE B: Screenshot Network tab showing:
       ↳ Request URL: /api/user/lang
       ↳ Method: POST
       ↳ Status: ??? (200/401/302/307)
       ↳ Request Headers → Cookie: (is fyd_panel_session present?)
       ↳ Request Payload: { "lang": "fr" }
       ↳ Response: { ??? }
   
   Click on the request → Headers tab → Request Headers
   
   📋 COPY & PASTE HERE:
   ┌───────────────────────────────────────┐
   │ Status: _____                         │
   │ Cookie header present: YES / NO       │
   │ Cookie value: ___________________     │
   │ Response body: ___________________    │
   └───────────────────────────────────────┘

3️⃣  TEST: Check DB After Change
   ────────────────────────────────
   Run this on server:
   
   docker compose exec -T db psql -U fyd -d fyd -c \
     "SELECT id, language, lang, updated_at FROM users WHERE id=1;"
   
   📸 EVIDENCE C: Screenshot showing language='fr' after change

4️⃣  TEST: UI Update
   ─────────────────
   After clicking language change:
   
   ✓ Does Topbar switch to French? YES / NO
   ✓ Does Settings page switch to French? YES / NO
   ✓ Any errors in Console tab? YES / NO
   
   📸 EVIDENCE D: Screenshot of UI (with French or still English)

5️⃣  TEST: Refresh Persistence
   ────────────────────────────
   ✓ Press F5 (refresh page)
   ✓ Wait for page to load
   
   ✓ Is UI in French? YES / NO
   ✓ Any flash of English before French? YES / NO
   
   📸 EVIDENCE E: Screenshot after refresh

═══════════════════════════════════════════════════════════════════

🔬 ROOT CAUSE ANALYSIS CHECKLIST

Based on evidence, check which scenario matches:

[ ] SCENARIO 1: 401 Unauthorized
    - Network shows: Status 401
    - Cookie header: NOT present or INVALID  
    - Problem: Cookie not sent or session expired
    → Go to Section 6 below

[ ] SCENARIO 2: 200 OK but DB not updated
    - Network shows: Status 200, Response: { ok: true, lang: "fr" }
    - DB shows: language still 'pl'
    - Problem: API returns success but doesn't update DB
    → Check API logs for "DB updated, rows: X"

[ ] SCENARIO 3: 200 OK, DB updated, but UI stuck
    - Network shows: Status 200
    - DB shows: language='fr' ✓
    - UI shows: Still English (EN)
    → This is the "two paths" bug (Settings vs Topbar)
    → Go to Section 7 below

[ ] SCENARIO 4: Redirect loop (307/302)
    - Network shows: Status 307 or 302
    - Redirects to: /login or /auth/login
    - Problem: Middleware blocking despite valid session
    → Check middleware.ts

═══════════════════════════════════════════════════════════════════
EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📋 DELIVERABLES FOR PM"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Before next deploy, provide:"
echo ""
echo "1. Screenshot: Network tab POST /api/user/lang"
echo "   - Status code (200/401/302)"
echo "   - Cookie header (present or missing)"
echo "   - Response body"
echo ""
echo "2. SQL Result: Before and after language change"
echo "   - Before: language='pl'"
echo "   - After: language='fr' (or not?)"
echo ""
echo "3. Root Cause: Select scenario from checklist above"
echo ""
echo "4. UI Behavior:"
echo "   - Does Topbar change language? YES/NO"
echo "   - Does Settings change language? YES/NO"  
echo "   - Does refresh keep language? YES/NO"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# ========================================================================
# SECTION 6: If SCENARIO 1 (401) - Cookie Debugging
# ========================================================================

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🔍 SECTION 6: Cookie Debugging (if 401)"
echo "════════════════════════════════════════════════════════════════"
echo ""

cat << 'EOF'
If you see 401 Unauthorized:

1. In DevTools → Application → Cookies → panel.findyourdeal.app
   
   Check:
   ✓ Cookie name: fyd_panel_session
   ✓ Cookie value: Should be UUID (e.g., acd636de-a34c-4f4e-8cff-76bd14403fc0)
   ✓ Path: Should be /
   ✓ Expires: Should be future date (not expired)
   ✓ HttpOnly: Should be ✓
   ✓ Secure: Should be ✓ (for HTTPS)
   ✓ SameSite: Should be Lax

2. In Network tab → POST /api/user/lang → Headers → Request Headers
   
   Look for:
   Cookie: fyd_panel_session=<UUID>
   
   If Cookie header is MISSING → credentials: "include" not working
   If Cookie header is PRESENT but 401 → session expired or invalid

3. Test: Get new login link
   
   In Telegram:
   /panel
   
   Click link → Should set new cookie → Try language change again

4. Compare cookie UUID with DB:
   
   Copy UUID from browser cookie (e.g., acd636de-a34c-4f4e-8cff-76bd14403fc0)
   
   Run:
   docker compose exec -T db psql -U fyd -d fyd -c \
     "SELECT id::text, user_id, expires_at FROM panel_sessions \
      WHERE id='<PASTE-UUID-HERE>'::uuid;"
   
   Should return:
   - user_id: 1 (or your user ID)
   - expires_at: Future date
   
   If empty → Cookie is invalid (stale, from old session)
   → Need new login link

EOF

# ========================================================================
# SECTION 7: If SCENARIO 3 (UI not updating) - Component Analysis
# ========================================================================

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🔍 SECTION 7: UI Component Analysis (if DB updates but UI doesn't)"
echo "════════════════════════════════════════════════════════════════"
echo ""

cat << 'EOF'
If DB updates correctly (language='fr') but UI stays English:

Problem: "Two paths for language" - Settings and Topbar use different sources

Check in code:

1. Where does Topbar get language?
   File: panel/app/_components/Topbar.tsx or similar
   
   Look for:
   - Hard-coded "en"?
   - Reading from different context?
   - Not using global language provider?

2. Where does Settings get language?
   File: panel/app/settings/page.tsx
   
   Current implementation:
   - Has local state: const [lang, setLang] = useState(...)
   - On change: setLang(newLang) + router.refresh()
   
   Question: Does router.refresh() update Topbar language?

3. Is there a global language provider?
   
   Search for:
   - I18nProvider / LangProvider in layout.tsx
   - React Context for language
   - Zustand/Redux store for language
   
   If NO global provider → Topbar can't see Settings change!

4. What getPanelLang() returns?
   File: panel/app/_lib/getPanelLang.ts
   
   This reads from DB correctly.
   
   Question: Who uses getPanelLang()?
   - layout.tsx uses it (Server Component)
   - Does Topbar use it?
   - Does Settings use it?
   
   If Settings uses local state and Topbar uses getPanelLang():
   → Settings updates local state
   → Topbar still shows cached getPanelLang() result
   → router.refresh() should re-fetch, but maybe doesn't?

FIX NEEDED:

After POST /api/user/lang succeeds:
1. Update global language state (if exists)
2. OR: Force full re-render with router.refresh() + router.refresh()
3. OR: Both Settings and Topbar must use same source (getPanelLang)

EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Evidence collection protocol ready!"
echo ""
echo "Next steps:"
echo "1. Run this script: ./evidence-collection-p0-lang.sh"
echo "2. Follow manual browser test protocol"
echo "3. Collect all screenshots"
echo "4. Report findings: which scenario matches?"
echo "5. Then we do targeted fix + deploy with evidence"
echo "════════════════════════════════════════════════════════════════"
