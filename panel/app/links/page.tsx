import { pool } from "../../lib/db";
import { getSessionUserId } from "../../lib/auth";
import {
  resetBaseline,
  toggleLinkActive,
  setLinkNotificationMode,
  clearLinkNotificationMode,
} from "./actions";
import getPanelLang from "../_lib/getPanelLang";
import {t, normLang} from "../_lib/i18n";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function sp1(v: SP[keyof SP]) {
  return Array.isArray(v) ? v[0] : v;
}

function formatWarsaw(dt: any) {
  if (!dt) return null;
  const d = dt instanceof Date ? dt : new Date(dt);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function modeLabel(lang: any, m?: string | null) {
  const x = String(m || "").toLowerCase();
  if (x === "off") return t(lang, "mode_off");
  if (x === "batch") return t(lang, "mode_batch");
  return t(lang, "mode_single");
}

export default async function LinksPage({ searchParams }: { searchParams: SP }) {
  const lang = normLang(await getPanelLang());
  const L = new Proxy({}, { get: (_t, k) => t(lang, String(k)) }) as any;


  const q = (sp1(searchParams.q) ?? "").trim();
  const onlyActive = sp1(searchParams.active) === "1";

  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return null;

  const entQ = await pool.query(
    `
    SELECT plan_code, expires_at, links_limit_total
    FROM user_entitlements_v
    WHERE user_id = $1
    LIMIT 1
    `,
    [sessionUserId]
  );
  const ent = entQ.rows[0] || null;

  const chatQ = await pool.query(
    `
    SELECT chat_id, enabled, mode
    FROM chat_notifications
    WHERE user_id=$1
    ORDER BY enabled DESC, updated_at DESC, id DESC
    LIMIT 1
    `,
    [sessionUserId]
  );
  const chat = chatQ.rows[0] || null;
  const primaryChatId = String(chat?.chat_id || "");
  const chatEnabled = !!chat?.enabled;
  const chatMode = String(chat?.mode || "single").toLowerCase();

  const where: string[] = ["l.user_id = $1"];
  const params: any[] = [sessionUserId];

  if (onlyActive) where.push("l.active = true");
  if (q) {
    params.push(`%${q}%`);
    where.push(`(l.name ILIKE $${params.length} OR l.url ILIKE $${params.length})`);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const sql = `
    WITH fl AS (
      SELECT l.id, l.user_id, l.name, l.url, l.source, l.active, l.last_key
      FROM links l
      ${whereSql}
      ORDER BY l.active DESC, l.id DESC
      LIMIT 200
    ),
    li AS (
      SELECT
        link_id,
        COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '24 hours') AS new24,
        MAX(first_seen_at) AS max_seen_at
      FROM link_items
      WHERE link_id IN (SELECT id FROM fl)
      GROUP BY link_id
    )
    SELECT
      fl.id, fl.user_id, fl.name, fl.url, fl.source, fl.active, fl.last_key,
      COALESCE(li.new24, 0) AS items_cnt,
      li.max_seen_at
    FROM fl
    LEFT JOIN li ON li.link_id = fl.id
    ORDER BY fl.active DESC, fl.id DESC
  `;


  const { rows } = await pool.query(sql, params);

  const linkIds = rows.map((r: any) => Number(r.id)).filter((x: any) => Number.isFinite(x));
  const modeMap = new Map<number, string>();
  if (primaryChatId && linkIds.length) {
    const mQ = await pool.query(
      `
      SELECT link_id, mode
      FROM link_notification_modes
      WHERE user_id=$1 AND chat_id=$2 AND link_id = ANY($3::int[])
      `,
      [sessionUserId, primaryChatId, linkIds]
    );
    for (const r of mQ.rows || []) {
      modeMap.set(Number(r.link_id), String(r.mode));
    }
  }

  const enabledCount = rows.filter((r: any) => !!r.active).length;
  const limitTotal = Number(ent?.links_limit_total ?? 0);

  return (
    <main className="p-6 space-y-6 bg-white dark:bg-zinc-950 min-h-screen">
      <h1 className="text-2xl font-semibold text-black dark:text-white">{t(lang,"links_title")}</h1>


      <section className="border dark:border-zinc-700 rounded p-4 space-y-2 bg-white dark:bg-zinc-900">
        <h2 className="font-semibold text-black dark:text-white">{t(lang,"tg_commands_title")}</h2>
        <div className="text-sm opacity-80 text-black dark:text-white">
          {L.tg_commands_desc}
        </div>
        <ul className="text-sm list-disc pl-5 space-y-1 text-black dark:text-white">
          <li>{L.tg_cmd_status}</li>
          <li>{L.tg_cmd_add}</li>
          <li>{L.tg_cmd_list}</li>
          <li>{L.tg_cmd_remove}</li>
          <li>{L.tg_cmd_onoff}</li>
          <li>{L.tg_cmd_mode}</li>
          <li>{L.tg_cmd_mode_id}</li>
        </ul>

        <div className="text-xs opacity-70 pt-2 text-black dark:text-white">
          {L.chat_status_prefix}{" "}
          {primaryChatId ? (
            <>
              <b>{chatEnabled ? t(lang,"notif_on") : t(lang,"notif_off")}</b>{" "}
              · {L.chat_mode_prefix} <b>{modeLabel(lang, chatMode)}</b>
              {!chatEnabled ? (
                <> · {L.notif_hint_off}</>
              ) : null}
            </>
          ) : (
            <>
              <b>{L.chat_no_connection}</b> ({L.chat_connect_hint})
            </>
          )}
        </div>
      </section>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <p className="text-sm opacity-70 text-black dark:text-white">
          {L.links_list_desc}
        </p>

        <form method="get" className="flex gap-2 flex-wrap items-end">
          <div className="flex flex-col">
            <label className="text-xs opacity-70 text-black dark:text-white">{t(lang,"search_label")}</label>
            <input name="q" defaultValue={q} className="border dark:border-zinc-700 rounded px-3 py-2 w-72 bg-white dark:bg-zinc-800 text-black dark:text-white" />
          </div>

          <label className="flex items-center gap-2 text-sm mb-2 text-black dark:text-white">
            <input type="checkbox" name="active" value="1" defaultChecked={onlyActive} />
            {L.only_enabled}
          </label>

          <button className="border dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700">{t(lang,"filter_btn")}</button>
          <a className="border dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700" href="/links">
            {L.clear_btn}
          </a>
        </form>
      </div>

      <div className="overflow-auto border dark:border-zinc-700 rounded bg-white dark:bg-zinc-900">
        <table className="min-w-[1320px] w-full text-sm text-black dark:text-white">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr className="text-left">
              <th className="p-3">{L.col_id}</th>
              <th className="p-3">{L.col_status}</th>
              <th className="p-3">{L.col_notifications}</th>
              <th className="p-3">{L.col_name}</th>
              <th className="p-3">{L.col_source}</th>
              <th className="p-3">{L.col_offers} (24h)</th>
              <th className="p-3">{L.col_link}</th>
              <th className="p-3">
                {lang === "pl"
                  ? "Ostatnia nowa oferta"
                  : lang === "de"
                  ? "Letztes neues Angebot"
                  : lang === "fr"
                  ? "Dernière nouvelle offre"
                  : lang === "es"
                  ? "Última nueva oferta"
                  : lang === "it"
                  ? "Ultima nuova offerta"
                  : lang === "pt"
                  ? "Última nova oferta"
                  : lang === "nl"
                  ? "Laatste nieuwe aanbieding"
                  : lang === "cs"
                  ? "Poslední nová nabídka"
                  : lang === "ro"
                  ? "Ultima ofertă nouă"
                  : lang === "sk"
                  ? "Posledná nová ponuka"
                  : "Last new offer"}
              </th>
              <th className="p-3">{L.col_actions}</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r: any) => {
              const perLink = modeMap.get(Number(r.id)) || null; // single|batch|off|null
              const effective = perLink || chatMode || "single";
              const hasTg = !!primaryChatId;

              const btnClass = (want: "single" | "batch" | "off") => {
                const isOn = String(effective) === want;
                return `border rounded px-2 py-1 ${isOn ? "" : "opacity-60"}`;
              };

              const inheritClass = `border rounded px-2 py-1 ${perLink ? "opacity-60" : ""}`;

              return (
                <tr key={r.id} className="border-t dark:border-zinc-700 align-top hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="p-3 font-mono">{r.id}</td>

                  <td className="p-3">
                    <form action={toggleLinkActive}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="active" value={String(r.active)} />
                      <button className={`px-2 py-1 rounded border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 ${r.active ? "" : "opacity-60"}`}>
                        {r.active ? t(lang, "status_on_short") : t(lang, "status_off_short")}
                      </button>
                    </form>
                  </td>

                  <td className="p-3">
                    {hasTg ? (
                      <div className="space-y-2">
                        <div className="text-xs opacity-70">
                          {L.notif_mode_label} <b>{modeLabel(lang, effective)}</b>{" "}
                          {perLink ? <> {L.notif_set_for_link}</> : <> {L.notif_inherit_from_chat}</>}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <form action={setLinkNotificationMode}>
                            <input type="hidden" name="link_id" value={r.id} />
                            <input type="hidden" name="mode" value="off" />
                            <button className={btnClass("off")}>{L.mode_off}</button>
                          </form>

                          <form action={setLinkNotificationMode}>
                            <input type="hidden" name="link_id" value={r.id} />
                            <input type="hidden" name="mode" value="single" />
                            <button className={btnClass("single")}>{t(lang,"mode_single")}</button>
                          </form>

                          <form action={setLinkNotificationMode}>
                            <input type="hidden" name="link_id" value={r.id} />
                            <input type="hidden" name="mode" value="batch" />
                            <button className={btnClass("batch")}>{t(lang,"mode_batch")}</button>
                          </form>

                          <form action={clearLinkNotificationMode}>
                            <input type="hidden" name="link_id" value={r.id} />
                            <button className={inheritClass}>{L.mode_inherit}</button>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs opacity-70">
                        Brak Telegrama (użyj <code>/start</code>).
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs opacity-70">
                      Telegram:{" "}
                      <code>/off_{r.id}</code>{" "}
                      <code>/on_{r.id}</code>{" "}
                      <code>/pojedyncze_{r.id}</code>{" "}
                      <code>/zbiorcze_{r.id}</code>
                    </div>
                  </td>

                  <td className="p-3 font-mono">
                    {String(r.source || "").toUpperCase() === "OLX"
                      ? "OLX"
                      : String(r.source || "").toLowerCase() === "vinted"
                      ? "Vinted"
                      : r.source}
                  </td>

                  <td className="p-3">
                    <div className="font-mono">{r.items_cnt}</div>
                    {r.max_seen_at ? (
                      <div className="text-xs opacity-70">
                        ostatnio:{" "}
                        {new Intl.DateTimeFormat("pl-PL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(r.max_seen_at))}
                      </div>
                    ) : (
                      <div className="text-xs opacity-60">brak</div>
                    )}
                  </td>

                  <td className="p-3">
                    <a className="underline" href={r.url} target="_blank" rel="noreferrer">{L.open_btn}</a>
                  </td>

                  <td className="p-3">
                    <div className="text-xs break-all font-mono max-w-[360px]">
                      {r.max_seen_at ? (
                        <div className="whitespace-nowrap">
                          {new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(r.max_seen_at))}
                        </div>
                      ) : (
                        <span className="opacity-60">{t(lang,"none")}</span>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <form action={resetBaseline}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="border dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700">{t(lang,"reset_btn")}</button>
                    </form>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td className="p-6 opacity-70" colSpan={9}>
                  Brak wyników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}