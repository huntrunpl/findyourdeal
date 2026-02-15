/**
 * i18n & alias regression test
 * Tests:
 * 1. No "cmd.*" literals in help output
 * 2. FR/DE users see localized commands, not PL
 * 3. normalizeCommand() works for all languages
 */

import { t } from "./i18n_unified.js";
import { buildAdvancedHelp } from "./utils/help-generator.js";
import { COMMAND_ALIASES, normalizeCommand } from "./command_aliases.js";

const LANGUAGES = ['en', 'pl', 'de', 'fr', 'it', 'es', 'pt', 'cs', 'sk', 'ro', 'nl'];

console.log("🧪 Running i18n tests...\n");

let passed = 0;
let failed = 0;

// Test 1: No cmd.* literals in any language
console.log("Test 1: Check for cmd.* literals in help output");
for (const lang of LANGUAGES) {
  const basicHelp = t(lang, "cmd.help_greeting") + "\n" +
    t(lang, "cmd.help_basic") + "\n" +
    t(lang, "cmd.help_basic_dodaj") + "\n" +
    t(lang, "cmd.help_basic_usun") + "\n" +
    t(lang, "cmd.help_basic_lista") + "\n" +
    t(lang, "cmd.help_plans") + "\n" +
    t(lang, "cmd.help_plans_show") + "\n" +
    t(lang, "cmd.help_lang") + "\n" +
    t(lang, "cmd.help_lang_set");
  
  const advancedHelp = buildAdvancedHelp(lang);
  
  const fullHelp = basicHelp + advancedHelp;
  
  if (fullHelp.includes("cmd.")) {
    console.log(`  ❌ FAIL [${lang}]: Found literal "cmd.*" in help output`);
    console.log(`     Example: ${fullHelp.match(/cmd\.\w+/g)?.[0]}`);
    failed++;
  } else {
    console.log(`  ✅ PASS [${lang}]: No cmd.* literals`);
    passed++;
  }
}

console.log();

// Test 2: FR/DE users see localized commands, not PL
console.log("Test 2: Check FR/DE see localized commands (not PL)");

const PL_MARKERS = ['dodaj', 'usun', 'priorytet', 'cena', 'ukry', 'filtry', 'rozmiar', 'marka'];
const FR_EXPECTED = ['ajouter', 'supprimer', 'priorité', 'prix'];
const DE_EXPECTED = ['hinzufügen', 'entfernen', 'priorität', 'preis'];

// Test FR
const frHelp = buildAdvancedHelp('fr');
let frHasPL = false;
let frHasFR = false;
for (const plMarker of PL_MARKERS) {
  if (frHelp.includes(`/${plMarker}`)) {
    frHasPL = true;
    console.log(`  ❌ FAIL [fr]: Found PL command "/${plMarker}" in FR help`);
    failed++;
    break;
  }
}
for (const frMarker of FR_EXPECTED) {
  if (frHelp.includes(`/${frMarker}`)) {
    frHasFR = true;
  }
}
if (!frHasPL && frHasFR) {
  console.log(`  ✅ PASS [fr]: Shows FR commands, no PL`);
  passed++;
} else if (!frHasPL && !frHasFR) {
  console.log(`  ⚠️  WARN [fr]: No PL, but also no FR markers found`);
  passed++;
}

// Test DE
const deHelp = buildAdvancedHelp('de');
let deHasPL = false;
let deHasDE = false;
for (const plMarker of PL_MARKERS) {
  if (deHelp.includes(`/${plMarker}`)) {
    deHasPL = true;
    console.log(`  ❌ FAIL [de]: Found PL command "/${plMarker}" in DE help`);
    failed++;
    break;
  }
}
for (const deMarker of DE_EXPECTED) {
  if (deHelp.includes(`/${deMarker}`)) {
    deHasDE = true;
  }
}
if (!deHasPL && deHasDE) {
  console.log(`  ✅ PASS [de]: Shows DE commands, no PL`);
  passed++;
} else if (!deHasPL && !deHasDE) {
  console.log(`  ⚠️  WARN [de]: No PL, but also no DE markers found`);
  passed++;
}

console.log();

// Test 3: normalizeCommand() works for all languages
console.log("Test 3: normalizeCommand() recognizes all language aliases");

const testCases = [
  { cmd: '/dodaj', expected: 'dodaj', lang: 'PL' },
  { cmd: '/add', expected: 'dodaj', lang: 'EN' },
  { cmd: '/hinzufügen', expected: 'dodaj', lang: 'DE' },
  { cmd: '/ajouter', expected: 'dodaj', lang: 'FR' },
  { cmd: '/priorytet', expected: 'priorytet', lang: 'PL' },
  { cmd: '/priority', expected: 'priorytet', lang: 'EN' },
  { cmd: '/priorität', expected: 'priorytet', lang: 'DE' },
  { cmd: '/priorité', expected: 'priorytet', lang: 'FR' },
  { cmd: '/cena', expected: 'cena', lang: 'PL' },
  { cmd: '/price', expected: 'cena', lang: 'EN' },
  { cmd: '/preis', expected: 'cena', lang: 'DE' },
  { cmd: '/prix', expected: 'cena', lang: 'FR' },
];

for (const { cmd, expected, lang } of testCases) {
  const result = normalizeCommand(cmd);
  if (result === expected) {
    console.log(`  ✅ PASS [${lang}]: ${cmd} → ${result}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL [${lang}]: ${cmd} → ${result} (expected: ${expected})`);
    failed++;
  }
}

console.log();

// Summary
console.log("─".repeat(50));
console.log(`Summary: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("✅ All tests passed!");
  process.exit(0);
} else {
  console.log("❌ Some tests failed");
  process.exit(1);
}
