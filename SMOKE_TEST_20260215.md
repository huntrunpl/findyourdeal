# Smoke Test - i18n/help+aliases hotfix
**Deploy:** 20260215_102615  
**Status:** ✅ Bot deployed and healthy  
**Time:** ~15 minutes

---

## ✅ Deployment Completed

- **BUILD_ID:** `20260215_102615`
- **Container:** `findyourdeal-tg-bot-1` - Up and healthy
- **Changes:**
  - ✅ Added 5 missing cmd.* keys (EN+PL)
  - ✅ Restructured command_aliases.js (array → per-language objects)
  - ✅ Fixed help-generator.js getAliases() logic
  - ✅ Fixed composite _off commands (cena_off, rozmiar_off, etc.)
  - ✅ Test suite: test-i18n.js (25/25 passed)

---

## 📋 Smoke Test Checklist (15 minutes)

### Test 1: French (FR) - Primary Pilot
**Goal:** Verify FR commands work, no PL leakage, no cmd.* literals

✅ Tested | Command | Expected Result
---------|---------|------------------
☐ | `/start` → `/lang fr` | Bot switches to FR
☐ | `/help` | Shows FR commands: `/priorité`, `/prix`, `/liste`
☐ | Check output | **NO** `/priorytet`, `/cena`, `/dodaj` (PL)
☐ | Check output | **NO** `cmd.help_plans`, `cmd.help_lang` literals
☐ | `/aide` (FR alias) | Opens help (same as `/help`)
☐ | `/statut` (FR alias) | Shows status
☐ | `/priorité` (FR command) | Works (even if no links)

**Pass criteria:**
- Help shows FR primary commands
- No PL commands visible
- No "cmd.*" strings in output
- FR aliases (`/aide`, `/statut`) work

---

### Test 2: German (DE) - Secondary Pilot
**Goal:** Verify DE commands work, no PL leakage

✅ Tested | Command | Expected Result
---------|---------|------------------
☐ | `/start` → `/lang de` | Bot switches to DE
☐ | `/help` | Shows DE commands: `/priorität`, `/preis`, `/liste`
☐ | Check output | **NO** `/priorytet`, `/cena` (PL)
☐ | `/hilfe` (DE alias) | Opens help
☐ | `/status` | Shows status in DE
☐ | `/priorität` (DE command) | Works

**Pass criteria:**
- Help shows DE primary commands
- No PL commands visible
- DE aliases work

---

### Test 3: Polish (PL) - Control Group
**Goal:** Verify PL still works (regression test)

✅ Tested | Command | Expected Result
---------|---------|------------------
☐ | `/start` → `/lang pl` | Bot switches to PL
☐ | `/help` | Shows PL commands: `/priorytet`, `/cena`, `/lista`
☐ | `/pomoc` (PL alias) | Opens help
☐ | `/status` | Shows status in PL

**Pass criteria:**
- PL commands work as before
- No regression

---

### Test 4: English (EN) - Fallback
**Goal:** Verify EN as master language

✅ Tested | Command | Expected Result
---------|---------|------------------
☐ | `/start` → `/lang en` | Bot switches to EN
☐ | `/help` | Shows EN commands: `/priority`, `/price`, `/list`
☐ | Check output | All text in English
☐ | `/status` | Shows status in EN

**Pass criteria:**
- EN shows EN commands
- All keys have EN translations

---

## 🚨 Known Issues (Not Blockers for Deployment)

### Issue 1: Language not persisting in /status output
**Symptom:** User sets `/lang fr`, but `/status` output still in EN  
**Root cause:** `buildStatusMessage()` may use `user.language_code` (Telegram hint) instead of DB `user.language`  
**Impact:** Medium - affects UX but not functionality  
**Priority:** P1 - Fix in next iteration (see "What's Next")

### Issue 2: Panel still shows hardcoded PL
**Symptom:** Settings, Topbar in panel show PL text regardless of language  
**Root cause:** Hardcoded strings in React components  
**Impact:** Low - panel separate from bot  
**Priority:** P2 - Fix after bot language issues resolved

---

## ✅ Success Criteria for This Deploy

**PASS if:**
1. ✅ `/help` in FR/DE shows localized commands (not PL)
2. ✅ No "cmd.help_*" literals visible to users
3. ✅ FR/DE aliases work (`/aide`, `/hilfe`, `/statut`)
4. ✅ normalizeCommand() recognizes all 11 languages

**ACCEPTABLE if:**
- `/status` output language may not match user choice *(next iteration)*
- Panel shows mixed languages *(P2 priority)*

---

## 📊 Test Results Log

**Tester:**  
**Date:** 2026-02-15  
**Time started:**  
**Time completed:**  

### Test 1: FR
- [ ] `/lang fr` works: ___
- [ ] `/help` shows FR: ___
- [ ] No PL commands: ___
- [ ] `/aide` works: ___

### Test 2: DE
- [ ] `/lang de` works: ___
- [ ] `/help` shows DE: ___
- [ ] No PL commands: ___

### Test 3: PL
- [ ] PL commands work: ___

### Overall Result
- [ ] ✅ PASS - Proceed to Priority 1 tasks
- [ ] ❌ FAIL - Issues found (describe below)

**Issues found:**
```
(none expected - all tests passed in pre-deployment)
```

---

## 📈 What's Next: Priority 1

### Task 1: Create getEffectiveLang(user) - Single Source of Truth
**Goal:** Ensure language from DB wins over Telegram hint  
**Files to modify:**
- `telegram-bot.js` - add `getEffectiveLang(user)` function
- All handlers - replace local lang detection with `getEffectiveLang(user)`

**Logic:**
```javascript
function getEffectiveLang(user) {
  // 1. Explicit user choice (DB)
  const explicit = user.language || user.lang;
  if (explicit) return normalizeLangCode(explicit);
  
  // 2. Telegram hint (language_code)
  const hint = user.language_code;
  if (hint) return normalizeLangCode(hint);
  
  // 3. Fallback to EN
  return "en";
}
```

**Acceptance:**
- `/lang fr` → `/status` shows FR output
- Bot restart doesn't reset language
- All 11 languages respect user choice

---

### Task 2: Remove STATUS_I18N Hardcoded Maps
**Goal:** Eliminate duplicate translation maps  
**Files to modify:**
- Remove `STATUS_I18N` object from telegram-bot.js
- Replace all `STATUS_I18N[status][lang]` with `t(lang, "status.*")`

**Benefit:**
- Single source of truth (i18n_unified.js)
- Easier to maintain
- Consistent fallback behavior

**Acceptance:**
- Status messages in all 11 languages
- No hardcoded translation maps

---

### Task 3: Add Language Regression Tests
**Goal:** Prevent future language selection bugs  
**New test:** `test-language-persistence.js`

**Scenarios:**
1. User sets `/lang fr` → `user.language` in DB = "fr"
2. `/status` uses DB language, not Telegram hint
3. Bot restart preserves language

---

## 🎯 Priority 2: Panel Fixes

### Task 1: Panel Language Selection
- Remove hardcoded PL strings from Settings/Topbar
- Fallback to EN (not PL)
- Fix 401 Unauthorized on `/api/user/lang`

### Task 2: Session Management
- Ensure language refresh doesn't reset session
- Clear error messages on auth failure

---

## 📝 Deployment Log

**Build started:** 2026-02-15 10:26:15  
**Build completed:** 2026-02-15 10:27:00 (36s no-cache rebuild)  
**Container recreated:** 2026-02-15 10:27:05  
**Health check passed:** 2026-02-15 10:27:47  
**Status:** ✅ Deployed successfully

**Build command:**
```bash
cd /opt/findyourdeal
docker compose build --no-cache tg-bot
docker compose up -d --force-recreate tg-bot
```

**Verification:**
```bash
docker logs findyourdeal-tg-bot-1 --tail 20
# Output: [BOT_VERSION] 20260215_102615
```

---

## 🔧 Rollback Plan (If Needed)

**If critical issues found during smoke test:**

1. Restore previous version:
   ```bash
   cd /opt/findyourdeal/api
   git revert HEAD
   docker compose build tg-bot
   docker compose up -d --force-recreate tg-bot
   ```

2. Or restore from backup:
   ```bash
   cp command_aliases.js.backup_before_perlangrewrite_20260215_091405 command_aliases.js
   # Revert other changes manually
   ```

**Rollback trigger:**
- Bot crashes on `/help`
- normalizeCommand() breaks (commands not recognized)
- Critical regression in PL language

**Note:** Not expected - all tests passed (25/25)

---

## 📚 Documentation Updated

- ✅ test-i18n.js - regression test suite
- ✅ command_aliases.js - restructured with per-language objects
- ✅ help-generator.js - fixed getAliases() logic
- ✅ i18n_unified.js - added 5 missing keys (EN+PL)
- ✅ telegram-bot.js - BUILD_ID = 20260215_102615

**Backup created:**
- `command_aliases.js.backup_before_perlangrewrite_20260215_091405`

---

**End of Smoke Test Document**
