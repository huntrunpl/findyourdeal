"use strict";

export function createPlanHandlers({
  tgSend,
  escapeHtml,
  createPlanCheckoutSession,
  createAddon10CheckoutSession,
  STRIPE_SECRET_KEY,
  PRICE_ADDON10,
  BOT_USERNAME,
}) {
  async function handlePlans(msg, user) {
    // Zostawiamy logikę 1:1 — tutaj tylko przeniesienie.
    // Jeśli masz w telegram-bot.js dodatkowy tekst/flow dla /plans,
    // to będzie wklejone dokładnie po podmianie (patrz krok 3).
    // Ten placeholder jest celowy: w kolejnym kroku wkleimy pełny blok.
      const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const L = normLang(lang);

  const PLANS_TXT = {
    pl: "💳 Wybierz plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nPo opłaceniu wrócisz do bota i aktywacja zrobi się automatycznie.",
    en: "💳 Choose a plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nAfter checkout you'll return to the bot and activation will be automatic.",
    de: "💳 Wähle einen Plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nNach dem Checkout kehrst du zum Bot zurück und die Aktivierung passiert automatisch.",
    fr: "💳 Choisissez un abonnement :\n\n• Starter : /starter\n• Growth : /growth\n• Platinum : /platinum\n\nAprès le paiement, vous reviendrez au bot et l’activation sera automatique.",
    es: "💳 Elige un plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nTras el pago volverás al bot y la activación será automática.",
    it: "💳 Scegli un piano:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nDopo il pagamento tornerai al bot e l’attivazione sarà automatica.",
    pt: "💳 Escolha um plano:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nApós o pagamento você volta ao bot e a ativação será automática.",
    ro: "💳 Alege un plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nDupă plată revii în bot și activarea va fi automată.",
    nl: "💳 Kies een plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nNa betaling ga je terug naar de bot en wordt activatie automatisch gedaan.",
    cs: "💳 Vyberte plán:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nPo platbě se vrátíte do bota a aktivace proběhne automaticky.",
    sk: "💳 Vyberte plán:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nPo platbe sa vrátite do bota a aktivácia prebehne automaticky.",
  };

  const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
  const code = String(ent?.plan_code || "").toLowerCase();

  if (code === "platinum") {
    // show addon10 checkout
    const intro = {
      pl: "➕ Addon +10: +10 linków oraz +100 limitu historii.\nOtwórz płatność poniżej:",
      en: "➕ Addon +10: +10 links and +100 history limit.\nOpen checkout link below:",
      de: "➕ Add-on +10: +10 Links und +100 Verlaufslimit.\nÖffne den Checkout-Link unten:",
      fr: "➕ Add-on +10 : +10 liens et +100 limite d’historique.\nOuvrez le lien de paiement ci-dessous :",
      es: "➕ Addon +10: +10 enlaces y +100 de límite de historial.\nAbre el enlace de pago abajo:",
      it: "➕ Addon +10: +10 link e +100 di limite storico.\nApri il link di pagamento qui sotto:",
      pt: "➕ Addon +10: +10 links e +100 de limite de histórico.\nAbra o link de pagamento abaixo:",
      ro: "➕ Addon +10: +10 linkuri și +100 la limita istoricului.\nDeschide linkul de plată de mai jos:",
      nl: "➕ Addon +10: +10 links en +100 geschiedenislimiet.\nOpen de betaallink hieronder:",
      cs: "➕ Addon +10: +10 odkazů a +100 limit historie.\nOtevřete platební odkaz níže:",
      sk: "➕ Addon +10: +10 odkazov a +100 limit histórie.\nOtvorte platobný odkaz nižšie:",
    };

    try {
      const resp = await createAddon10CheckoutSession({ user, chatId });
      await tgSend(chatId, `✅ ${planLabel("platinum")}\n\n${intro[L] || intro.en}\n\n${escapeHtml(resp.url)}`);
      return;
    } catch (e) {
      await tgSend(chatId, L === "pl" ? "❌ Nie udało się wygenerować linku płatności." : "❌ Couldn't generate payment link.");
      return;
    }
  }

  await tgSend(chatId, PLANS_TXT[L] || PLANS_TXT.en);
  }

  async function handleBuyPlan(msg, user, code) {
      const chatId = String(msg.chat.id);
  const priceId =
    code === "starter" ? PRICE_STARTER :
    code === "growth" ? PRICE_GROWTH :
    code === "platinum" ? PRICE_PLATINUM :
    "";

  if (!STRIPE_SECRET_KEY || !priceId || !BOT_USERNAME) {
    await tgSend(chatId, "❌ Sales config missing.");
    return;
  }

  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  try {
    const { url } = await createPlanCheckoutSession({ user, planCode: code, priceId, chatId });
    await tgSend(chatId, `${t(lang, "language_current", { language: escapeHtml(langLabel(lang)) })}\n\n${escapeHtml(url)}`);
  } catch (e) {
    await tgSend(chatId, `❌ ${escapeHtml(e?.message || e)}`);
  }
  }

  async function handleAddon10(msg, user) {
    const chatId = String(msg.chat.id);
    if (!STRIPE_SECRET_KEY || !PRICE_ADDON10 || !BOT_USERNAME) {
      await tgSend(chatId, "❌ Addon config missing.");
      return;
    }
    try {
      const { url } = await createAddon10CheckoutSession({ user, chatId });
      await tgSend(chatId, escapeHtml(url));
    } catch (e) {
      const m = String(e?.message || e);
      if (m === "ADDON_ONLY_PLATINUM") {
        await tgSend(chatId, "⛔ Addon +10 is Platinum only.");
        return;
      }
      await tgSend(chatId, `❌ ${escapeHtml(m)}`);
    }
  }

  return { handlePlans, handleBuyPlan, handleAddon10 };
}
