"use client";

import { useState } from "react";
import { planLabel } from "@/lib/plans";

type Plan = "free" | "trial" | "starter" | "growth" | "platinum";

interface BillingCTAProps {
  currentPlan: Plan;
  lang: string;
}

interface CheckoutResponse {
  url?: string;
  requestId: string;
  error?: string;
  message?: string;
}

export default function BillingCTA({ currentPlan, lang }: BillingCTAProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (type: "plan" | "addon", planOrAddon: string) => {
    setLoading(true);
    
    const body = type === "plan" 
      ? { type: "plan", plan: planOrAddon }
      : { type: "addon", addon: planOrAddon };

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: CheckoutResponse = await res.json();

      if (!res.ok || data.error) {
        showToast(`❌ Błąd: ${data.message || data.error || "Unknown error"}`, data.requestId);
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("❌ Brak URL do przekierowania", data.requestId);
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      showToast(`❌ ${errorMsg}`, "unknown");
      setLoading(false);
    }
  };

  const showToast = (message: string, requestId: string) => {
    // Simple toast implementation
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md";
    toast.innerHTML = `
      <div class="font-semibold">${message}</div>
      <div class="text-xs mt-1 opacity-80">Request ID: ${requestId}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  };

  // Render based on current plan
  if (currentPlan === "platinum") {
    return (
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Dodatkowe linki</h2>
        <div className="text-sm opacity-80">
          Dokup pakiet +10 dodatkowych linków do swojego planu Platinum
        </div>
        <button
          onClick={() => handleCheckout("addon", "links_10")}
          disabled={loading}
          className="border rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Ładowanie..." : "Dokup +10 linków"}
        </button>
      </section>
    );
  }

  // For trial, starter, growth - show upgrade options
  const availablePlans: Plan[] = 
    currentPlan === "trial" || currentPlan === "free" ? ["starter", "growth", "platinum"] :
    currentPlan === "starter" ? ["growth", "platinum"] :
    currentPlan === "growth" ? ["platinum"] :
    [];

  if (availablePlans.length === 0) {
    return (
      <section className="border rounded p-4 space-y-3">
        <div className="text-sm opacity-70">Brak dostępnych zmian planu</div>
      </section>
    );
  }

  return (
    <section className="border rounded p-4 space-y-3">
      <h2 className="font-semibold">
        {currentPlan === "trial" ? "Wybierz plan" : "Upgrade"}
      </h2>
      
      <div className="text-sm opacity-80">
        Aktualny plan: <b>{planLabel(currentPlan)}</b>
      </div>

      <div className="flex gap-3 flex-wrap">
        {availablePlans.map((plan) => (
          <button
            key={plan}
            onClick={() => handleCheckout("plan", plan)}
            disabled={loading}
            className="border rounded px-4 py-2 hover:bg-blue-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "..." : planLabel(plan)}
          </button>
        ))}
      </div>

      <div className="text-xs opacity-60">
        Po kliknięciu zostaniesz przekierowany do Stripe
      </div>
    </section>
  );
}
