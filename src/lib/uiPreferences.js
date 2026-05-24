export const UI_PREFERENCES_KEY = "the-teller-ui-preferences";

export const densityOptions = [
  {
    key: "comfortable",
    label: "Comfort",
    description: "More breathing room.",
  },
  {
    key: "balanced",
    label: "Balanced",
    description: "Default working layout.",
  },
  {
    key: "compact",
    label: "Compact",
    description: "Less vertical space.",
  },
];

export const defaultUiPreferences = {
  density: "balanced",
  focusMode: false,
  utilitiesOpen: true,
  quickFilter: "all",
};

export function getDensityClass(density) {
  if (density === "compact") return "density-compact";
  if (density === "comfortable") return "density-comfortable";
  return "density-balanced";
}

export function getFocusClass(enabled) {
  return enabled ? "focus-mode-on" : "focus-mode-off";
}

export function normalizeUiPreferences(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    density: densityOptions.some((option) => option.key === source.density)
      ? source.density
      : defaultUiPreferences.density,
    focusMode: typeof source.focusMode === "boolean" ? source.focusMode : defaultUiPreferences.focusMode,
    utilitiesOpen: typeof source.utilitiesOpen === "boolean" ? source.utilitiesOpen : defaultUiPreferences.utilitiesOpen,
    quickFilter: typeof source.quickFilter === "string" ? source.quickFilter : defaultUiPreferences.quickFilter,
  };
}

export function loadUiPreferences() {
  try {
    if (typeof window === "undefined") return defaultUiPreferences;
    const raw = window.localStorage.getItem(UI_PREFERENCES_KEY);
    if (!raw) return defaultUiPreferences;
    return normalizeUiPreferences(JSON.parse(raw));
  } catch {
    return defaultUiPreferences;
  }
}

export function saveUiPreferences(preferences) {
  try {
    if (typeof window === "undefined") return false;
    const normalized = normalizeUiPreferences(preferences);
    window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function clearUiPreferences() {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.removeItem(UI_PREFERENCES_KEY);
    return true;
  } catch {
    return false;
  }
}
