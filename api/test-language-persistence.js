/**
 * Language persistence regression test
 * Tests that user language choice (DB) wins over Telegram hint
 * and that language is correctly reflected in all outputs
 */

import { getUserLang, t } from "./i18n_unified.js";
import { buildAdvancedHelp } from "./utils/help-generator.js";

console.log("🧪 Running language persistence tests...\n");

let passed = 0;
let failed = 0;

// Test 1: getUserLang priority - DB explicit choice wins
console.log("Test 1: getUserLang() priority - DB explicit choice wins over Telegram hint");

const testCases = [
  {
    name: "Explicit FR in DB, EN in Telegram → FR",
    user: { language: "fr", language_code: "en" },
    expected: "fr"
  },
  {
    name: "Explicit DE in DB, PL in Telegram → DE",
    user: { language: "de", language_code: "pl" },
    expected: "de"
  },
  {
    name: "user.lang (legacy) present → uses it",
    user: { lang: "it", language_code: "en" },
    expected: "it"
  },
  {
    name: "No explicit choice, only Telegram hint → uses hint",
    user: { language_code: "es" },
    expected: "es"
  },
  {
    name: "No data at all → fallback to EN",
    user: {},
    expected: "en"
  },
  {
    name: "Explicit choice overrides lang (language > lang)",
    user: { language: "de", lang: "pl", language_code: "en" },
    expected: "de"
  },
  {
    name: "Invalid language code → fallback to EN",
    user: { language: "xyz" },
    expected: "en"
  }
];

for (const { name, user, expected } of testCases) {
  const result = getUserLang(user);
  if (result === expected) {
    console.log(`  ✅ PASS: ${name}`);
    console.log(`     getUserLang() = "${result}"`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${name}`);
    console.log(`     Expected: "${expected}", Got: "${result}"`);
    failed++;
  }
}

console.log();

// Test 2: Status translations use correct language
console.log("Test 2: Status/mode keys work in all languages");

const statusKeys = [
  "status.title",
  "status.plan",
  "status.links_enabled", 
  "status.chat_line_enabled",
  "status.quiet_off",
  "mode.single",
  "mode.batch",
  "mode.off"
];

const languages = ['en', 'pl', 'de', 'fr', 'it', 'es', 'pt', 'cs', 'sk', 'ro', 'nl'];

for (const lang of languages) {
  let langOk = true;
  const missing = [];
  
  for (const key of statusKeys) {
    const val = t(lang, key);
    // Check if it returned the literal key (meaning not found)
    if (val === key) {
      missing.push(key);
      langOk = false;
    }
  }
  
  if (langOk) {
    console.log(`  ✅ PASS [${lang}]: All status/mode keys present`);
    passed++;
  } else {
    console.log(`  ❌ FAIL [${lang}]: Missing keys: ${missing.join(', ')}`);
    failed++;
  }
}

console.log();

// Test 3: Help output respects user language
console.log("Test 3: Help output shows commands in correct language");

const helpTestCases = [
  { lang: "fr", shouldContain: ["/priorité", "/prix"], shouldNotContain: ["/priorytet", "/cena"] },
  { lang: "de", shouldContain: ["/priorität", "/preis"], shouldNotContain: ["/priorytet", "/cena"] },
  { lang: "pl", shouldContain: ["/priorytet", "/cena"], shouldNotContain: ["/priority", "/price"] },
  { lang: "en", shouldContain: ["/priority", "/price"], shouldNotContain: ["/priorytet", "/cena"] }
];

for (const { lang, shouldContain, shouldNotContain } of helpTestCases) {
  const help = buildAdvancedHelp(lang);
  let ok = true;
  const errors = [];
  
  for (const cmd of shouldContain) {
    if (!help.includes(cmd)) {
      ok = false;
      errors.push(`Missing: ${cmd}`);
    }
  }
  
  for (const cmd of shouldNotContain) {
    if (help.includes(cmd)) {
      ok = false;
      errors.push(`Found unwanted: ${cmd}`);
    }
  }
  
  if (ok) {
    console.log(`  ✅ PASS [${lang}]: Help shows correct commands`);
    passed++;
  } else {
    console.log(`  ❌ FAIL [${lang}]: ${errors.join(', ')}`);
    failed++;
  }
}

console.log();

// Test 4: No raw keys in output
console.log("Test 4: No raw i18n keys (cmd.*, status.*, mode.*) in user-facing text");

for (const lang of languages) {
  const statusText = t(lang, "status.title") + " " + 
                     t(lang, "status.chat_line_enabled", { mode: t(lang, "mode.single"), daily: 5, limit: 50 }) + " " +
                     t(lang, "status.quiet_off");
  
  const help = buildAdvancedHelp(lang);
  const combined = statusText + help;
  
  const hasRawKeys = /\b(cmd|status|mode)\.\w+/.test(combined);
  
  if (!hasRawKeys) {
    console.log(`  ✅ PASS [${lang}]: No raw keys in output`);
    passed++;
  } else {
    const matches = combined.match(/\b(cmd|status|mode)\.\w+/g);
    console.log(`  ❌ FAIL [${lang}]: Found raw keys: ${matches?.join(', ')}`);
    failed++;
  }
}

console.log();

// Test 5: Mode labels are translated
console.log("Test 5: Mode labels are properly translated (not English in FR/DE)");

const modeTestCases = [
  { lang: "fr", key: "mode.single", shouldNotBe: "single" },
  { lang: "fr", key: "mode.batch", shouldNotBe: "batch" },
  { lang: "de", key: "mode.single", shouldNotBe: "single" },
  { lang: "de", key: "mode.batch", shouldNotBe: "batch" },
  { lang: "pl", key: "mode.single", shouldNotBe: "single" },
  { lang: "pl", key: "mode.batch", shouldNotBe: "batch" }
];

for (const { lang, key, shouldNotBe } of modeTestCases) {
  const val = t(lang, key);
  if (val !== shouldNotBe && val !== key) {
    console.log(`  ✅ PASS [${lang}]: ${key} = "${val}" (translated)`);
    passed++;
  } else {
    console.log(`  ❌ FAIL [${lang}]: ${key} = "${val}" (not translated or missing)`);
    failed++;
  }
}

console.log();

// Summary
console.log("─".repeat(50));
console.log(`Summary: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("✅ All language persistence tests passed!");
  process.exit(0);
} else {
  console.log("❌ Some tests failed");
  process.exit(1);
}
