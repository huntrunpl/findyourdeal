#!/bin/bash
# 🧪 Manual Test - Panel Language Change
# Use this to verify the fix works

echo "════════════════════════════════════════════════════════════════"
echo "🧪 PANEL LANGUAGE CHANGE - MANUAL TEST GUIDE"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "✅ DEPLOYED: 2026-02-15 13:50 UTC"
echo "✅ FIX: Unified session detection method"
echo "✅ STATUS: Ready for testing"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "📋 BEFORE YOU START"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1. Open Chrome/Firefox with DevTools (F12)"
echo "2. Go to Network tab → Check 'Preserve log'"
echo "3. Go to Console tab → Clear console"
echo "4. Get login link from Telegram: /panel"
echo "5. Click link to open panel"
echo ""
echo "Press Enter when ready..."
read

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🧪 TEST 1: Change Language PL → FR"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1. In panel, click Settings (top right)"
echo "2. Find 'Language' dropdown"
echo "3. Change from PL → FR (Français)"
echo "4. Click Save/Apply"
echo ""
echo "In DevTools → Network tab:"
echo "   • Find: POST /api/user/lang"
echo "   • Click on it"
echo "   • Go to Headers tab"
echo ""
echo "📸 SCREENSHOT 1: Network tab showing:"
echo "   • Status: _____ (200 or 401?)"
echo "   • Request Headers → Cookie: (present?)"
echo "   • Response tab → Body: {'ok': ..., 'lang': ...}"
echo ""
echo "In DevTools → Console tab:"
echo "   • Any red errors?"
echo ""
echo "In panel UI:"
echo "   • Did Settings page switch to French? YES / NO"
echo "   • Did Topbar switch to French (top right)? YES / NO"
echo "   • Topbar should show: 🇫🇷 Français"
echo ""
echo "Press Enter when done checking..."
read

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🔍 TEST 2: Verify Database Updated"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Running SQL query..."
docker compose exec -T db psql -U fyd -d fyd -c "SELECT id, language, lang, updated_at FROM users WHERE id=1;"

echo ""
echo "📸 SCREENSHOT 2: SQL result showing:"
echo "   • language: fr (changed from pl)"
echo "   • lang: fr"
echo "   • updated_at: Fresh timestamp (just now)"
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🔄 TEST 3: Refresh Persistence"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1. In browser, press F5 (refresh page)"
echo "2. Wait for page to fully load"
echo ""
echo "Check:"
echo "   • Page loads in French? YES / NO"
echo "   • Topbar shows: 🇫🇷 Français? YES / NO"
echo "   • No flash of English before French? YES / NO"
echo "   • Settings still in French? YES / NO"
echo ""
echo "📸 SCREENSHOT 3: UI after refresh (should be French)"
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📝 TEST 4: Check Server Logs"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Looking for language change in logs..."
docker compose logs panel --tail 200 | grep -A3 -B1 "api/user/lang"

echo ""
echo "Expected to see:"
echo "   ✓ [getUserIdFromApiSession] Found X UUID cookie(s)"
echo "   ✓ [getUserIdFromApiSession] Found session for user 1"
echo "   ✓ [API /api/user/lang POST] Session userId: 1"
echo "   ✓ [API /api/user/lang POST] User 1 → lang: fr"
echo "   ✓ [API /api/user/lang POST] DB updated, rows: 1"
echo ""
echo "📸 SCREENSHOT 4: Logs showing successful language change"
echo ""

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 RESULTS SUMMARY"
echo "════════════════════════════════════════════════════════════════"
echo ""

cat << 'EOF'
Fill in your results:

┌─────────────────────────────────────────────────────────────┐
│ 1. POST /api/user/lang                                       │
│    Status: ________ (200 = ✅, 401 = ❌)                     │
│    Cookie present in request: YES / NO                       │
│    Response: { ok: ____, lang: ____ }                        │
│                                                               │
│ 2. Database                                                   │
│    language column changed to 'fr': YES / NO                 │
│    updated_at is fresh (recent): YES / NO                    │
│                                                               │
│ 3. UI Behavior                                                │
│    Settings switched to French: YES / NO                      │
│    Topbar switched to French: YES / NO                        │
│    Refresh kept French: YES / NO                              │
│                                                               │
│ 4. Console Errors                                             │
│    Any errors in DevTools Console: YES / NO                   │
│    If YES, describe: ___________________________              │
│                                                               │
│ 5. Logs                                                       │
│    Saw "Found session for user 1": YES / NO                   │
│    Saw "DB updated, rows: 1": YES / NO                        │
└─────────────────────────────────────────────────────────────┘

SCENARIO DETERMINATION:

If ALL of the following are true:
  ✅ Status: 200
  ✅ DB updated to 'fr'
  ✅ UI switched to French
  ✅ Refresh kept French
  ✅ No console errors

→ ✅ FIX SUCCESSFUL! Language change works!

If status is STILL 401:
  → Check logs for why session not found
  → Check DevTools → Application → Cookies
  → Verify fyd_panel_session cookie exists

If status is 200 but UI didn't update:
  → This is SCENARIO 3 (different issue)
  → Settings vs Topbar using different sources
  → Need additional UI fix

EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📸 DELIVERABLES FOR PM"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Provide:"
echo "1. Screenshot: Network tab (POST /api/user/lang with status)"
echo "2. Screenshot/Text: SQL result (language='fr')"
echo "3. Screenshot: UI in French after refresh"
echo "4. Screenshot/Text: Logs showing session found + DB updated"
echo "5. Summary: Which scenario (see above)"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Test guide complete!"
echo "════════════════════════════════════════════════════════════════"
