import AutoSaveRecoveryPanel from "./AutoSaveRecoveryPanel.jsx";
import DevHealthInspector from "./DevHealthInspector.jsx";
import ResponsiveHint from "./ResponsiveHint.jsx";
import SystemStatusStrip from "./SystemStatusStrip.jsx";
import UiControlPanel from "./UiControlPanel.jsx";
import UiPreferenceStatus from "./UiPreferenceStatus.jsx";

export default function SettingsPanel({
  density = "balanced",
  setDensity = () => {},
  focusMode = false,
  setFocusMode = () => {},
  utilitiesOpen = true,
  quickFilter = "all",
  resetUiPreferences = () => {},
  systemStatus = null,
  saveStatus = null,
  devHealth = null,
  settingsOpen = false,
}) {
  if (!settingsOpen) return null;

  return (
    <section className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Workspace controls, system status, and recovery.</h2>
        </div>
        <span>Local browser settings</span>
      </div>

      <UiControlPanel
        density={density}
        setDensity={setDensity}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
      />

      <UiPreferenceStatus
        density={density}
        focusMode={focusMode}
        utilitiesOpen={utilitiesOpen}
        quickFilter={quickFilter}
        onResetPreferences={resetUiPreferences}
      />

      {systemStatus && <SystemStatusStrip status={systemStatus} />}
      <ResponsiveHint />
      <AutoSaveRecoveryPanel saveStatus={saveStatus || { status: "ready" }} />
      {devHealth && <DevHealthInspector health={devHealth} />}
    </section>
  );
}
