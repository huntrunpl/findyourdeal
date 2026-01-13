// timeUtils.js
// Zwraca aktualną godzinę w strefie Europe/Warsaw (0–23)
export function getCurrentHourInWarsaw() {
  const now = new Date();

  try {
    const formatter = new Intl.DateTimeFormat("pl-PL", {
      timeZone: "Europe/Warsaw",
      hour: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    const hour = hourPart ? parseInt(hourPart.value, 10) : now.getHours();

    return hour;
  } catch (e) {
    // Awaryjnie – gdyby cokolwiek poszło nie tak, użyj czasu z kontenera
    return now.getHours();
  }
}
