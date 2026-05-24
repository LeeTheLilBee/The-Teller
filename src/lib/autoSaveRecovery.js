import { UI_PREFERENCES_KEY, normalizeUiPreferences } from "./uiPreferences.js";

export function readJsonStorage(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { found: false, data: null, error: null };
    return { found: true, data: JSON.parse(raw), error: null };
  } catch (error) {
    return { found: true, data: null, error };
  }
}

export function readRecoverySnapshot(storageKey = "the-teller-ui-state") {
  const uiState = readJsonStorage(storageKey);
  const uiPrefs = readJsonStorage(UI_PREFERENCES_KEY);

  if (!uiState.found && !uiPrefs.found) {
    return {
      found: false,
      status: "No saved UI state found",
      detail: "Autosave will create local recovery snapshots after the app has been open briefly.",
      data: null,
      preferences: normalizeUiPreferences(null),
    };
  }

  if (uiState.error || uiPrefs.error) {
    return {
      found: true,
      status: "Recovery snapshot partially unreadable",
      detail: "One saved local record could not be parsed safely. Reset View can clear preference storage.",
      data: uiState.data,
      preferences: normalizeUiPreferences(uiPrefs.data),
    };
  }

  return {
    found: true,
    status: "Saved UI state found",
    detail: "This recovery snapshot is local to this browser session.",
    data: uiState.data,
    preferences: normalizeUiPreferences(uiPrefs.data),
  };
}

export function summarizeRecoverySnapshot(snapshot) {
  const data = snapshot?.data || {};
  const preferences = snapshot?.preferences || {};

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
      value: preferences.density || data.density || "Not saved yet",
    },
    {
      label: "Focus",
      value: preferences.focusMode || data.focusMode ? "On" : "Off",
    },
    {
      label: "Utilities",
      value: preferences.utilitiesOpen ? "Open" : "Hidden",
    },
    {
      label: "Quick Filter",
      value: preferences.quickFilter || "all",
    },
  ];
}
