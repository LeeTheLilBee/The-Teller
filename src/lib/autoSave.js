import { useEffect, useMemo, useState } from "react";

export function useAutoSave(payload, options = {}) {
  const storageKey = options.storageKey || "the-teller-draft";
  const intervalMs = options.intervalMs || 15000;

  const [status, setStatus] = useState("ready");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [recoveredAt, setRecoveredAt] = useState(null);

  const safePayload = useMemo(() => payload || {}, [payload]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (parsed?.savedAt) {
        setRecoveredAt(parsed.savedAt);
      }
    } catch {
      setRecoveredAt(null);
    }
  }, [storageKey]);

  useEffect(() => {
    const saveNow = () => {
      try {
        setStatus("saving");

        const savedAt = new Date().toISOString();
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            savedAt,
            payload: safePayload,
          })
        );

        setLastSavedAt(savedAt);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    };

    saveNow();

    const timer = window.setInterval(saveNow, intervalMs);
    return () => window.clearInterval(timer);
  }, [safePayload, storageKey, intervalMs]);

  return {
    status,
    lastSavedAt,
    recoveredAt,
  };
}

export function formatSavedTime(value) {
  if (!value) return "Not saved yet";

  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Saved";
  }
}
