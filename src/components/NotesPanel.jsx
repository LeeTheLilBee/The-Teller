import { formatIntentTime } from "../lib/workflowIntents.js";

export default function NotesPanel({ notes, noteDraft, setNoteDraft, onAddNote, entity }) {
  return (
    <section className="notes-panel">
      <div className="notes-header">
        <div>
          <p className="eyebrow">Local Notes</p>
          <h2>{entity.label} working notes</h2>
        </div>
      </div>

      <div className="note-entry">
        <input
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="Type a quick internal note..."
        />
        <button type="button" onClick={onAddNote}>Add Note</button>
      </div>

      <div className="note-list">
        {notes.length > 0 ? (
          notes.map((note) => (
            <article key={note.id}>
              <strong>{note.entityLabel}</strong>
              <span>{note.drawer} • {formatIntentTime(note.createdAt)}</span>
              <p>{note.text}</p>
            </article>
          ))
        ) : (
          <article>
            <strong>No notes yet</strong>
            <span>{entity.label}</span>
            <p>Notes are local mock notes for now. Backend persistence comes later.</p>
          </article>
        )}
      </div>
    </section>
  );
}
