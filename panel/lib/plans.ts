export function planLabel(code: string): string {
  if (code === "starter") return "Starter";
  if (code === "growth") return "Growth";
  if (code === "platinum") return "Platinum";
  if (code === "trial") return "Trial";
  return "Free";
}
