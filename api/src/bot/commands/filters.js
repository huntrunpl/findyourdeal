/**
 * Extracted from api/telegram-bot.js (platinum filters)
 * No behavior change.
 */
export function createFiltersHandlers(ctx) {
  const {
    tgSend,
    fydResolveLang,
    escapeHtml,
    dbQuery,
    hasColumn,
    stripPrefixIcons,
    normLang,
    t,
  } = ctx;

  async function handleCena(msg, user) {
    if (!(await requirePlatinum(msg, user))) return;
  
    const parts = String(msg.text || "").trim().split(/\s+/);
    if (parts.length < 3) {
      await tgSend(msg.chat.id, "Użycie: /cena <ID> <MIN> <MAX>  albo  /cena <ID> off");
      return;
    }
  
    const id = Number(parts[1]);
    const mode = String(parts[2] || "").toLowerCase();
  
    let cur;
    try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
    if (cur == null) {
      await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
      return;
    }
  
    const f = { ...(cur || {}) };
  
    if (mode === "off") {
      f.minPrice = null;
      f.maxPrice = null;
      await setLinkFilters(user.id, id, f);
      await tgSend(msg.chat.id, `✅ /cena OFF dla ID ${id}`);
      return;
    }
  
    if (parts.length < 4) {
      await tgSend(msg.chat.id, "Użycie: /cena <ID> <MIN> <MAX>");
      return;
    }
  
    const mn = Number(parts[2]);
    const mx = Number(parts[3]);
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) {
      await tgSend(msg.chat.id, "❌ MIN/MAX muszą być liczbami.");
      return;
    }
  
    f.minPrice = mn;
    f.maxPrice = mx;
    await setLinkFilters(user.id, id, f);
    await tgSend(msg.chat.id, `✅ Ustawiono cenę dla ID ${id}: ${mn}–${mx}`);
  }
  
  async function handleRozmiar(msg, user) {
    if (!(await requirePlatinum(msg, user))) return;
  
    const raw = String(msg.text || "").trim();
    const parts = raw.split(/\s+/);
    if (parts.length < 3) {
      await tgSend(msg.chat.id, "Użycie: /rozmiar <ID> <R1,R2,...>  albo  /rozmiar <ID> off");
      return;
    }
  
    const id = Number(parts[1]);
    const mode = String(parts[2] || "").toLowerCase();
  
    let cur;
    try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
    if (cur == null) {
      await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
      return;
    }
  
    const f = { ...(cur || {}) };
  
    if (mode === "off") {
      f.sizes = null;
      await setLinkFilters(user.id, id, f);
      await tgSend(msg.chat.id, `✅ /rozmiar OFF dla ID ${id}`);
      return;
    }
  
    const sizesRaw = raw.split(/\s+/).slice(2).join(" ").trim();
    const sizes = sizesRaw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!sizes.length) {
      await tgSend(msg.chat.id, "❌ Podaj rozmiar(y), np. /rozmiar 153 44,45");
      return;
    }
  
    f.sizes = sizes;
    await setLinkFilters(user.id, id, f);
    await tgSend(msg.chat.id, `✅ Ustawiono rozmiar(y) dla ID ${id}: ${sizes.join(", ")}`);
  }
  
  async function handleMarka(msg, user) {
    if (!(await requirePlatinum(msg, user))) return;
  
    const raw = String(msg.text || "").trim();
    const parts = raw.split(/\s+/);
    if (parts.length < 3) {
      await tgSend(msg.chat.id, "Użycie: /marka <ID> <BRAND1,BRAND2,...>  albo  /marka <ID> off");
      return;
    }
  
    const id = Number(parts[1]);
    const mode = String(parts[2] || "").toLowerCase();
  
    let cur;
    try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
    if (cur == null) {
      await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
      return;
    }
  
    const f = { ...(cur || {}) };
  
    if (mode === "off") {
      f.brand = null;
      await setLinkFilters(user.id, id, f);
      await tgSend(msg.chat.id, `✅ /marka OFF dla ID ${id}`);
      return;
    }
  
    const brandsRaw = raw.split(/\s+/).slice(2).join(" ").trim();
    const brands = brandsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!brands.length) {
      await tgSend(msg.chat.id, "❌ Podaj markę(i), np. /marka 153 Nike,Jordan");
      return;
    }
  
    f.brand = brands;
    await setLinkFilters(user.id, id, f);
    await tgSend(msg.chat.id, `✅ Ustawiono markę(i) dla ID ${id}: ${brands.join(", ")}`);
  }
  
  async function handleFiltry(msg, user) {
    const parts = String(msg.text || "").trim().split(/\s+/);
    if (parts.length < 2) {
      await tgSend(msg.chat.id, "Użycie: /filtry <ID>");
      return;
    }
    const id = Number(parts[1]);
  
    let cur;
    try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
    if (cur == null) {
      await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
      return;
    }
  
    const pretty = JSON.stringify(cur || {}, null, 2);
    await tgSend(msg.chat.id, `ℹ️ Filtry dla ID ${id}:\n<code>${escapeHtml(pretty)}</code>`, { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
  }
  
  async function handleResetFiltry(msg, user) {
    if (!(await requirePlatinum(msg, user))) return;
  
    const parts = String(msg.text || "").trim().split(/\s+/);
    if (parts.length < 2) {
      await tgSend(msg.chat.id, "Użycie: /resetfiltry <ID>");
      return;
    }
    const id = Number(parts[1]);
  
    let cur;
    try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
    if (cur == null) {
      await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
      return;
    }
  
    await setLinkFilters(user.id, id, {});
    await tgSend(msg.chat.id, `✅ Wyczyszczono filtry dla ID ${id}`);
  }
  

  return { handleCena, handleRozmiar, handleMarka, handleFiltry, handleResetFiltry };
}
