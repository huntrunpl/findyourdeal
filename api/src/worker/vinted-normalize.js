/**
 * Vinted normalization helpers extracted from api/worker.js
 * normalizeKey is injected because it's defined elsewhere in worker.
 */

export function createVintedNormalize({ normalizeKey }) {
  function deriveVintedTitleFromUrl(url) {
    try {
      const s = String(url || "");
      const m = s.match(/vinted\.[^/]+\/items\/(\d+)(?:-([^?#/]+))?/i);
      if (!m) return null;

      const id = m[1];
      let slug = (m[2] ? decodeURIComponent(m[2]) : "")
        .replace(/[\-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!slug) return "Vinted " + id;

      slug = slug
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return slug || ("Vinted " + id);
    } catch {
      return null;
    }
  }

  function ensureVintedItemFields(it) {
    if (!it || typeof it !== "object") return it;

    const url = String(it.url || it.link || it.href || it.item_url || "");
    if (url) {
      if (!it.url) it.url = url;

      // próbuj ustawić itemKey pod normalizowane URL (kluczowe dla last_key)
      try {
        const itemKey = normalizeKey(url);
        if (itemKey && !it.itemKey) it.itemKey = itemKey;
        if (itemKey && !it.item_key) it.item_key = itemKey;
      } catch {}
    }

    const titleFromUrl = url ? deriveVintedTitleFromUrl(url) : null;
    const currentTitle = String(it.title || it.name || it.itemTitle || "").trim();

    if ((!currentTitle || /^vinted\s+\d+/i.test(currentTitle)) && titleFromUrl) {
      it.title = titleFromUrl;
      it.name = titleFromUrl;
      it.itemTitle = titleFromUrl;
    } else {
      if (!it.title && currentTitle) it.title = currentTitle;
      if (!it.name && currentTitle) it.name = currentTitle;
      if (!it.itemTitle && currentTitle) it.itemTitle = currentTitle;
    }

    // id pomocniczo (nie wszędzie używane)
    const m = url.match(/\/items\/(\d+)/i);
    if (m) {
      const id = m[1];
      if (!it.item_id) it.item_id = id;
      if (!it.vinted_id) it.vinted_id = id;
    }

    return it;
  }

  function fixVintedItems(items) {
    if (!Array.isArray(items)) return items;
    return items.map((it) => ensureVintedItemFields(it));
  }

  return {
    deriveVintedTitleFromUrl,
    ensureVintedItemFields,
    fixVintedItems,
  };
}
