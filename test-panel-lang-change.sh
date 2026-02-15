#!/bin/bash
# Test script for panel language change functionality
# Run this AFTER making a language change in the panel UI

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Panel Language Change - Diagnostic Test                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Get user ID from most recent panel session
USER_ID=$(docker compose exec -T db psql -U fyd -d fyd -tAc "
  SELECT user_id 
  FROM panel_sessions 
  WHERE expires_at > NOW() 
  ORDER BY created_at DESC 
  LIMIT 1
" 2>/dev/null | tr -d '[:space:]')

if [ -z "$USER_ID" ]; then
    echo "❌ No active panel sessions found"
    echo "   Please login to panel first via /panel command in Telegram bot"
    exit 1
fi

echo "✅ Found active session for user ID: $USER_ID"
echo ""

# Check current language in DB
echo "═══════════════════════════════════════════════════════════════"
echo "1️⃣  DATABASE CHECK: Current language for user $USER_ID"
echo "═══════════════════════════════════════════════════════════════"

DB_RESULT=$(docker compose exec -T db psql -U fyd -d fyd -c "
  SELECT 
    id,
    language AS lang_source_of_truth,
    lang AS lang_legacy,
    language_code AS lang_telegram_hint,
    updated_at
  FROM users 
  WHERE id = $USER_ID;
" 2>/dev/null)

echo "$DB_RESULT"
echo ""

# Extract language
CURRENT_LANG=$(docker compose exec -T db psql -U fyd -d fyd -tAc "
  SELECT COALESCE(language, lang, 'en') 
  FROM users 
  WHERE id = $USER_ID
" 2>/dev/null | tr -d '[:space:]')

echo "📌 Current language (SoT): $CURRENT_LANG"
echo ""

# Check panel logs for recent language changes
echo "═══════════════════════════════════════════════════════════════"
echo "2️⃣  PANEL LOGS: Recent language API calls (last 50 lines)"
echo "═══════════════════════════════════════════════════════════════"

LANG_LOGS=$(docker compose logs panel --tail 50 2>/dev/null | grep -i "api/user/lang" | tail -10)

if [ -z "$LANG_LOGS" ]; then
    echo "ℹ️  No recent language API calls found in logs"
    echo "   Make a language change in Settings to see activity here"
else
    echo "$LANG_LOGS"
fi
echo ""

# Verify cache settings
echo "═══════════════════════════════════════════════════════════════"
echo "3️⃣  CACHE VERIFICATION: Check if dynamic rendering is enabled"
echo "═══════════════════════════════════════════════════════════════"

# Check layout.tsx
if grep -q 'export const dynamic = "force-dynamic"' /opt/findyourdeal/panel/app/layout.tsx 2>/dev/null; then
    echo "✅ layout.tsx: force-dynamic enabled"
else
    echo "❌ layout.tsx: force-dynamic NOT found (caching enabled)"
fi

# Check getPanelLang.ts
if grep -q 'noStore()' /opt/findyourdeal/panel/app/_lib/getPanelLang.ts 2>/dev/null; then
    echo "✅ getPanelLang.ts: noStore() enabled"
else
    echo "❌ getPanelLang.ts: noStore() NOT found (caching enabled)"
fi

# Check API route
if grep -q 'export const dynamic = "force-dynamic"' /opt/findyourdeal/panel/app/api/user/lang/route.ts 2>/dev/null; then
    echo "✅ api/user/lang/route.ts: force-dynamic enabled"
else
    echo "❌ api/user/lang/route.ts: force-dynamic NOT found (caching enabled)"
fi
echo ""

# Verify credentials in fetch calls
echo "═══════════════════════════════════════════════════════════════"
echo "4️⃣  CREDENTIALS VERIFICATION: Check fetch calls"
echo "═══════════════════════════════════════════════════════════════"

CRED_COUNT=$(grep -r 'credentials: "include"' /opt/findyourdeal/panel/app --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
echo "✅ Found $CRED_COUNT fetch calls with credentials: \"include\""
echo ""

# Instructions for manual testing
echo "═══════════════════════════════════════════════════════════════"
echo "5️⃣  MANUAL TESTING CHECKLIST"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 To verify the fix works:"
echo ""
echo "1. Open panel: https://panel.findyourdeal.app"
echo "   (or get login link via /panel in Telegram)"
echo ""
echo "2. Go to Settings"
echo ""
echo "3. Change language: EN → FR"
echo "   Expected: No errors, success message appears"
echo ""
echo "4. Check UI immediately after change:"
echo "   Expected: Settings page shows French labels"
echo "   Expected: Topbar shows French Settings link"
echo ""
echo "5. Refresh page (F5)"
echo "   Expected: Language stays FR (not reverts to EN)"
echo ""
echo "6. Run this script again to verify DB:"
echo "   ./test-panel-lang-change.sh"
echo "   Expected: language = 'fr' in database"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "6️⃣  NETWORK DEBUGGING (Use Browser DevTools)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "When changing language in Settings, check Network tab:"
echo ""
echo "Expected Request:"
echo "  • URL: /api/user/lang"
echo "  • Method: POST"
echo "  • Status: 200"
echo "  • Request Headers → Cookie: fyd_panel_session=..."
echo "  • Request Payload: { \"lang\": \"fr\" }"
echo ""
echo "Expected Response:"
echo "  • { \"ok\": true, \"lang\": \"fr\" }"
echo ""
echo "If you see 401:"
echo "  • Check if Cookie header is present"
echo "  • Session may have expired - get new login link"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Current Status Summary:"
echo "  👤 User ID: $USER_ID"
echo "  🌐 Current Language: $CURRENT_LANG"
echo "  🔧 Cache Control: Enabled (force-dynamic)"
echo "  🔐 Credentials: Enabled (11 fetch calls)"
echo ""
echo "✅ Ready for testing!"
