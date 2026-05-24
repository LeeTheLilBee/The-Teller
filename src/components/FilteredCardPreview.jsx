import { filterCards } from "../lib/searchFilters.js";

export default function FilteredCardPreview({ title, cards, searchQuery, quickFilter }) {
  const filteredCards = filterCards(cards, searchQuery, quickFilter);

  return (
    <section className="filtered-card-preview">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Filtered View</p>
          <h2>{title}</h2>
        </div>

        <div className="workflow-stats">
          <span>{filteredCards.length} showing</span>
          <span>{cards.length} total</span>
        </div>
      </div>

      <div className="detail-preview-grid">
        {filteredCards.length > 0 ? (
          filteredCards.map((item) => (
            <article className={`detail-preview-card ${item.tone || ""}`} key={`${item.title}-${item.detail}`}>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
              {item.meta && <p>{item.meta}</p>}
            </article>
          ))
        ) : (
          <article className="detail-preview-card">
            <strong>No matching records</strong>
            <small>Try All or clear the search box.</small>
            <p>The filter is local and only scans the current drawer preview cards.</p>
          </article>
        )}
      </div>
    </section>
  );
}
