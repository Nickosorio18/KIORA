import { useState, useEffect } from "react";
import { localDateISO } from "@utils/date";

// Returns today's ISO date string ("YYYY-MM-DD") as reactive state.
// Schedules a timeout that fires exactly at local midnight to update the state,
// which cascades re-renders to all consumers — fixing stale "yesterday" views.
export function useMidnightRefresh() {
  const [dateStr, setDateStr] = useState(() => localDateISO());

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const msUntilMidnight = tomorrow - now;

    const timer = setTimeout(() => {
      setDateStr(localDateISO());
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [dateStr]); // re-runs after each midnight tick to schedule the next one

  return dateStr;
}
