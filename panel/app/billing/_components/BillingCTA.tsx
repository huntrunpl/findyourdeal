"use client";

import { useState } from "react";
import { planLabel } from "@/lib/plans";
import { t } from "@/app/_lib/i18n";

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
  const L = new Proxy({}, { get: (_t, k) => t(lang as any, String(k)) }) as any;

  const handleCheckout = async (type: "plan" | "addon", planOrAddon: string) => {
    setLoading(true);
    
    const body = type === "plan" 
      ? { type: "plan", plan: planOrAddon }
      : { type: "addon", addon: planOrAddon };

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data: CheckoutResponse = await res.json();

      if (!res.ok || data.error) {
        showToast(`❌ ${L.billing_error} ${data.message || data.error || "Unknown error"}`, data.requestId);
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(`❌ ${L.billing_no_url}`, data.requestId);
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
      <section className="border rounded p-4">
        <h2 className="font-semibold text-lg mb-3">{L.billing_addon_pack_title}</h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Left: Description + Bullet List */}
          <div className="flex-1 space-y-2">
            <p className="text-sm opacity-80">
              {L.billing_addon_pack_desc}
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>{L.billing_addon_pack_b1}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>{L.billing_addon_pack_b2}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>{L.billing_addon_pack_b3}</span>
              </li>
            </ul>
            <p className="text-xs opacity-60 mt-2">
              {L.billing_addon_pack_note}
            </p>
          </div>

          {/* Right: Button */}
          <div className="md:w-auto w-full">
            <button
              onClick={() => handleCheckout("addon", "links_10")}
              disabled={loading}
              className="border border-blue-600 rounded px-6 py-2.5 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition w-full md:w-auto whitespace-nowrap"
            >
              {loading ? L.billing_loading : L.billing_buy_addon}
            </button>
          </div>
        </div>
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
        <div className="text-sm opacity-70">{L.billing_no_changes}</div>
      </section>
    );
  }

  return (
    <section className="border rounded p-4 space-y-3">
      <h2 className="font-semibold">
        {currentPlan === "trial" ? L.billing_upgrade_title : L.billing_upgrade_label}
      </h2>
      
      <div className="text-sm opacity-80">
        {L.billing_current_plan_label} <b>{planLabel(currentPlan)}</b>
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
        {L.billing_after_click}
      </div>
    </section>
  );
}
