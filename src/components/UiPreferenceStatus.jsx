import { clearUiPreferences } from "../lib/uiPreferences.js";

export default function UiPreferenceStatus({ density, focusMode, utilitiesOpen, quickFilter, onResetPreferences }) {
  function handleReset() {
    clearUiPreferences();
    onResetPreferences();
  }

  return (
    <section className="ui-preference-status">
      <div>
        <p className="eyebrow">Saved View Preferences</p>
        <h2>Your workspace view is remembered locally.</h2>
      </div>

      <div className="ui-pref-pills">
        <span>Density: {density}</span>
        <span>Focus: {focusMode ? "on" : "off"}</span>
        <span>Utilities: {utilitiesOpen ? "open" : "hidden"}</span>
        <span>Filter: {quickFilter}</span>
      </div>

      <button type="button" onClick={handleReset}>
        Reset View
      </button>
    </section>
  );
}
