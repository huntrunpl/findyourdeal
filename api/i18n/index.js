import pl from "./pl.js";

const dicts = { pl };

// prosta interpolacja: "tekst {name}" + vars = {name:"X"}
function format(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] === undefined || vars[k] === null ? `{${k}}` : String(vars[k])
  );
}

function getByPath(obj, path) {
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object" || !(p in cur)) return null;
    cur = cur[p];
  }
  return cur;
}

export function getLang(user, fallback = "pl") {
  const lc = String(user?.language_code || "").toLowerCase();
  if (lc.startsWith("pl")) return "pl";
  // na razie wszystko inne -> pl; później dołożymy en/hr itd.
  return fallback;
}

export function t(lang, key, vars) {
  const d = dicts[lang] || dicts.pl;
  const raw = getByPath(d, key) ?? getByPath(dicts.pl, key) ?? key;
  return format(raw, vars);
}
