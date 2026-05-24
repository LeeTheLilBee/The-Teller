import { densityOptions } from "../lib/uiPreferences.js";

export default function UiControlPanel({ density, setDensity, focusMode, setFocusMode }) {
  return (
    <section className="ui-control-panel">
      <div>
        <p className="eyebrow">View Controls</p>
        <h2>Keep the screen calm.</h2>
      </div>

      <div className="density-buttons">
        {densityOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            className={density === option.key ? "density-button active" : "density-button"}
            onClick={() => setDensity(option.key)}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={focusMode ? "focus-toggle active" : "focus-toggle"}
        onClick={() => setFocusMode(!focusMode)}
      >
        {focusMode ? "Focus On" : "Focus Off"}
      </button>
    </section>
  );
}
