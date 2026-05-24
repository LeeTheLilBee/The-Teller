export function readRecoverySnapshot(storageKey = "the-teller-ui-state") {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        found: false,
        status: "No saved UI state found",
        detail: "Autosave will create a local recovery snapshot after the app has been open briefly.",
        data: null,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      found: true,
      status: "Saved UI state found",
      detail: "This recovery snapshot is local to this browser session.",
      data: parsed,
    };
  } catch {
    return {
      found: false,
      status: "Recovery snapshot unreadable",
      detail: "The saved UI state exists but could not be parsed safely.",
      data: null,
    };
  }
}

export function summarizeRecoverySnapshot(snapshot) {
  const data = snapshot?.data || {};

  return [
    {
      label: "Room",
      value: data.activeRoom || "Not saved yet",
    },
    {
      label: "Company",
      value: data.activeEntity || "Not saved yet",
    },
    {
      label: "PayRole",
      value: data.activeRole || "Not saved yet",
    },
    {
      label: "Drawer",
      value: data.activeDrawer || "Not saved yet",
    },
    {
      label: "Density",
      value: data.density || "Not saved yet",
    },
    {
      label: "Focus",
      value: data.focusMode ? "On" : "Off",
    },
  ];
}
