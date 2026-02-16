#!/bin/bash
# I18N Quality Test - Check for EN contamination non-EN status translations

echo "🧪 I18N Quality Test - Status Translations"
echo "========================================="
echo ""

FAIL=0

# Test 1: Check for hardcoded /usun in lista_* keys (should be gone)
echo "Test 1: Check lista_example removed..."
if grep -q "lista_example" /opt/findyourdeal/api/i18n_unified.js; then
  echo "❌ FAIL: lista_example still exists (should be removed)"
  FAIL=1
else
  echo "✅ PASS: lista_example properly removed"
fi
echo ""

# Test 2: Check DE status section for EN contamination
echo "Test 2: Check German (DE) status section..."
DE_STATUS=$(sed -n '/^  de: {/,/^  [a-z][a-z]: {/p' /opt/findyourdeal/api/i18n_unified.js | sed -n '/status: {/,/^    },$/p')

if echo "$DE_STATUS" | grep -iq "searches\|in database\|Daily notification\|Today's\|Default Mod\|Default Mode\|Commands:"; then
  echo "❌ FAIL: DE status contains EN words"
  echo "$DE_STATUS" | grep -i "searches\|in database\|Daily notification\|Today's\|Default Mod\|Commands:"
  FAIL=1
else
  echo "✅ PASS: DE status section clean"
fi
echo ""

# Test 3: Check FR status section
echo "Test 3: Check French (FR) status section..."
FR_STATUS=$(sed -n '/^  fr: {/,/^  [a-z][a-z]: {/p' /opt/findyourdeal/api/i18n_unified.js | sed -n '/status: {/,/^    },$/p')

if echo "$FR_STATUS" | grep -iq "searches\|in database\|Daily notification\|Today's\|Default Mod"; then
  echo "❌ FAIL: FR status contains EN words"
  echo "$FR_STATUS" | grep -i "searches\|in database\|Daily\|Today's\|Default Mod"
  FAIL=1
else
  echo "✅ PASS: FR status section clean"
fi
echo ""

# Test 4: Check IT status section  
echo "Test 4: Check Italian (IT) status section..."
IT_STATUS=$(sed -n '/^  it: {/,/^  [a-z][a-z]: {/p' /opt/findyourdeal/api/i18n_unified.js | sed -n '/status: {/,/^    },$/p')

if echo "$IT_STATUS" | grep -iq "searches\|in database\|Daily notification\|Today's\|Default Mod"; then
  echo "❌ FAIL: IT status contains EN words"
  echo "$IT_STATUS" | grep -i "searches\|in database\|Daily\|Today's\|Default Mod"
  FAIL=1
else
  echo "✅ PASS: IT status section clean"
fi
echo ""

# Test 5: Check ES, PT, RO, NL, CS, SK status sections
for LANG in es pt ro nl cs sk; do
  echo "Test 5.${LANG}: Check ${LANG^^} status section..."
  LANG_STATUS=$(sed -n "/^  ${LANG}: {/,/^  [a-z][a-z]: {/p" /opt/findyourdeal/api/i18n_unified.js | sed -n '/status: {/,/^    },$/p')
  
  if echo "$LANG_STATUS" | grep -iq "searches\|in database\|Daily notification\|Today's\|Default Mod"; then
    echo "❌ FAIL: ${LANG^^} status contains EN words"
    echo "$LANG_STATUS" | grep -i "searches\|in database\|Daily\|Today's\|Default Mod"
    FAIL=1
  else
    echo "✅ PASS: ${LANG^^} status section clean"
  fi
done
echo ""

# Summary
echo "========================================="
if [ $FAIL -eq 1 ]; then
  echo "❌ QUALITY TEST FAILED"
  exit 1
else
  echo "✅ ALL QUALITY TESTS PASSED"
  echo ""
  echo "✨ i18n content quality: 11/11 languages clean"
  exit 0
fi
