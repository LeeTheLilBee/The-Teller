export const quickFilters = [
  { key: "all", label: "All" },
  { key: "blocked", label: "Blocked" },
  { key: "watch", label: "Watch" },
  { key: "guarded", label: "Guarded" },
  { key: "ready", label: "Ready" },
  { key: "open", label: "Open" },
];

export function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

export function cardMatchesSearch(card, query) {
  const cleanQuery = normalizeSearch(query);
  if (!cleanQuery) return true;

  const haystack = [
    card.title,
    card.detail,
    card.meta,
    card.tone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(cleanQuery);
}

export function cardMatchesQuickFilter(card, filterKey) {
  if (!filterKey || filterKey === "all") return true;

  const haystack = [
    card.title,
    card.detail,
    card.meta,
    card.tone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (filterKey === "blocked") return haystack.includes("blocked");
  if (filterKey === "watch") return haystack.includes("watch") || haystack.includes("review");
  if (filterKey === "guarded") return haystack.includes("guarded") || haystack.includes("protected") || haystack.includes("sensitive");
  if (filterKey === "ready") return haystack.includes("ready") || haystack.includes("cleared");
  if (filterKey === "open") return haystack.includes("open") || haystack.includes("pending");

  return true;
}

export function filterCards(cards, query, filterKey) {
  const list = Array.isArray(cards) ? cards : [];
  return list.filter((card) => cardMatchesSearch(card, query) && cardMatchesQuickFilter(card, filterKey));
}
