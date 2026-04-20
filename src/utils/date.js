// Returns "YYYY-MM-DD" using LOCAL date — avoids the toISOString() UTC shift
// that causes off-by-one-day bugs for late-night users in UTC-5/-6 timezones.
export function localDateISO(d = new Date()) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
