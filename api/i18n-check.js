#!/usr/bin/env node

/**
 * i18n completeness checker
 * Ensures all languages have same keys as EN (master)
 * Usage: node i18n-check.js
 * Exit code: 0 = all good, 1 = missing keys found
 */

import i18n from './i18n_unified.js';

const TRANSLATIONS = i18n.TRANSLATIONS || {};
const EN = TRANSLATIONS.en;
const SUPPORTED_LANGS = Object.keys(TRANSLATIONS).filter(l => l !== 'en');

console.log('🌍 i18n Completeness Check');
console.log(`Master: EN (${countKeys(EN)} keys)`);
console.log(`Languages: ${SUPPORTED_LANGS.join(', ')}\n`);

let hasErrors = false;

for (const lang of SUPPORTED_LANGS) {
  const dict = TRANSLATIONS[lang];
  if (!dict) {
    console.error(`❌ ${lang.toUpperCase()}: language dict missing!`);
    hasErrors = true;
    continue;
  }

  const missing = findMissingKeys(EN, dict, '');
  const extra = findMissingKeys(dict, EN, '');
  
  // P0 SANITY CHECK: Detect English phrases in non-EN translations
  const englishPhrases = findEnglishPhrases(dict, lang, '');
  
  // PLACEHOLDER VALIDATION: Ensure placeholders match EN
  const placeholderErrors = checkPlaceholders(EN, dict, lang, '');
  
  // HTML TAG VALIDATION: Ensure HTML tags match EN
  const htmlErrors = checkHtmlTags(EN, dict, lang, '');

  if (missing.length > 0) {
    console.error(`❌ ${lang.toUpperCase()}: Missing ${missing.length} keys:`);
    missing.forEach(k => console.error(`   - ${k}`));
    hasErrors = true;
  }

  if (extra.length > 0) {
    console.warn(`⚠️  ${lang.toUpperCase()}: Extra ${extra.length} keys (not in EN):`);
    extra.forEach(k => console.warn(`   + ${k}`));
  }
  
  if (englishPhrases.length > 0) {
    console.error(`❌ ${lang.toUpperCase()}: Found English phrases in translations:`);
    englishPhrases.forEach(item => console.error(`   - ${item.key}: "${item.phrase}"`));
    hasErrors = true;
  }
  
  if (placeholderErrors.length > 0) {
    console.error(`❌ ${lang.toUpperCase()}: Placeholder mismatch:`);
    placeholderErrors.forEach(item => console.error(`   - ${item.key}: expected ${JSON.stringify(item.expected)} got ${JSON.stringify(item.actual)}`));
    hasErrors = true;
  }
  
  if (htmlErrors.length > 0) {
    console.error(`❌ ${lang.toUpperCase()}: HTML tag mismatch:`);
    htmlErrors.forEach(item => console.error(`   - ${item.key}: expected ${JSON.stringify(item.expected)} got ${JSON.stringify(item.actual)}`));
    hasErrors = true;
  }

  if (missing.length === 0 && extra.length === 0 && englishPhrases.length === 0 && placeholderErrors.length === 0 && htmlErrors.length === 0) {
    console.log(`✅ ${lang.toUpperCase()}: Complete (${countKeys(dict)} keys)`);
  }
}

if (hasErrors) {
  console.error('\n❌ Fix missing keys before deploy!');
  process.exit(1);
} else {
  console.log('\n✅ All languages complete!');
  process.exit(0);
}

// Helpers
function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      count += countKeys(val, `${prefix}${key}.`);
    } else {
      count++;
    }
  }
  return count;
}

function findMissingKeys(source, target, path) {
  const missing = [];
  for (const key in source) {
    const val = source[key];
    const fullPath = path ? `${path}.${key}` : key;
    
    if (!(key in target)) {
      missing.push(fullPath);
      continue;
    }

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const targetVal = target[key];
      if (typeof targetVal === 'object' && targetVal !== null) {
        missing.push(...findMissingKeys(val, targetVal, fullPath));
      } else {
        missing.push(fullPath);
      }
    }
  }
  return missing;
}

function findEnglishPhrases(dict, lang, path) {
  // Minimal set of English phrases that shouldn't appear in non-EN translations
  // (reduced to avoid false positives)
  const suspiciousPhrases = [
    'Quiet hours',
    'Mode set',
    'Unknown command',
  ];
  
  const found = [];
  
  for (const key in dict) {
    const val = dict[key];
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof val === 'string') {
      // Remove placeholders {xxx} before checking
      const cleanVal = val.replace(/\{[^}]+\}/g, '');
      
      // Check if value contains suspicious English phrases
      for (const phrase of suspiciousPhrases) {
        if (cleanVal.includes(phrase)) {
          found.push({ key: fullPath, phrase });
          break; // One match per key is enough
        }
      }
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      found.push(...findEnglishPhrases(val, lang, fullPath));
    }
  }
  
  return found;
}

function checkPlaceholders(source, target, lang, path) {
  /**
   * Validates that placeholders {xxx} in translations match the source (EN)
   * Returns array of errors with key, expected, and actual placeholders
   */
  const errors = [];
  
  for (const key in source) {
    const sourceVal = source[key];
    const targetVal = target[key];
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof sourceVal === 'string' && typeof targetVal === 'string') {
      // Extract placeholders {xxx}
      const sourcePlaceholders = (sourceVal.match(/\{(\w+)\}/g) || []).sort();
      const targetPlaceholders = (targetVal.match(/\{(\w+)\}/g) || []).sort();
      
      // Compare
      if (JSON.stringify(sourcePlaceholders) !== JSON.stringify(targetPlaceholders)) {
        errors.push({
          key: fullPath,
          expected: sourcePlaceholders,
          actual: targetPlaceholders
        });
      }
    } else if (typeof sourceVal === 'object' && sourceVal !== null && !Array.isArray(sourceVal)) {
      if (typeof targetVal === 'object' && targetVal !== null) {
        errors.push(...checkPlaceholders(sourceVal, targetVal, lang, fullPath));
      }
    }
  }
  
  return errors;
}

function checkHtmlTags(source, target, lang, path) {
  /**
   * Validates that HTML tags in translations match the source (EN)
   * Checks for: <b>, </b>, <i>, </i>, <code>, </code>, &lt;, &gt;
   * Returns array of errors with key, expected, and actual HTML tags
   */
  const errors = [];
  
  for (const key in source) {
    const sourceVal = source[key];
    const targetVal = target[key];
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof sourceVal === 'string' && typeof targetVal === 'string') {
      // Extract HTML-like tags and entities
      const sourceTags = (sourceVal.match(/<[^>]+>|&[a-z]+;/g) || []).sort();
      const targetTags = (targetVal.match(/<[^>]+>|&[a-z]+;/g) || []).sort();
      
      // Compare
      if (JSON.stringify(sourceTags) !== JSON.stringify(targetTags)) {
        errors.push({
          key: fullPath,
          expected: sourceTags,
          actual: targetTags
        });
      }
    } else if (typeof sourceVal === 'object' && sourceVal !== null && !Array.isArray(sourceVal)) {
      if (typeof targetVal === 'object' && targetVal !== null) {
        errors.push(...checkHtmlTags(sourceVal, targetVal, lang, fullPath));
      }
    }
  }
  
  return errors;
}
