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

export function getDensityClass(density) {
  if (density === "compact") return "density-compact";
  if (density === "comfortable") return "density-comfortable";
  return "density-balanced";
}

export function getFocusClass(enabled) {
  return enabled ? "focus-mode-on" : "focus-mode-off";
}
