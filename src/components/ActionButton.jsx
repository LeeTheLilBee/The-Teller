export default function ActionButton({ action, onClick }) {
  return (
    <button className={`action-button ${action.tone}`} onClick={() => onClick(action)} type="button">
      {action.label}
    </button>
  );
}
