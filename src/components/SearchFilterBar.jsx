import { quickFilters } from "../lib/searchFilters.js";

export default function SearchFilterBar({ searchQuery, setSearchQuery, quickFilter, setQuickFilter }) {
  return (
    <section className="search-filter-bar">
      <div>
        <p className="eyebrow">Quick Filter</p>
        <h2>Find what matters faster.</h2>
      </div>

      <input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search current workspace..."
      />

      <div className="quick-filter-chips">
        {quickFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={quickFilter === filter.key ? "quick-filter-chip active" : "quick-filter-chip"}
            onClick={() => setQuickFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </section>
  );
}
