export const drawerGroupLabels = {
  rollup: "Overview",
  debt: "Money",
  giving: "Giving",
  calendar: "Timeline",
  workerLanes: "Workers",
  onboarding: "Workers",
  docs: "Records",
  issues: "Support",
  payRun: "Payroll",
  exceptions: "Payroll",
  approvals: "Approvals",
  cashFlow: "Money",
  restricted: "Protected",
  proof: "Proof",
  foundationDocs: "Foundation",
  doors: "Security",
  stepUp: "Security",
  redaction: "Security",
  audit: "Audit",
};

export function getDrawerContext(drawerKey, profile) {
  const drawer = profile.drawers.find(([key]) => key === drawerKey);
  const label = drawer?.[1] || "Current Drawer";
  const group = drawerGroupLabels[drawerKey] || "Workspace";

  return {
    key: drawerKey,
    label,
    group,
    headline: `${group}: ${label}`,
  };
}

export function groupDrawerTabs(drawers) {
  return drawers.reduce((groups, [key, label]) => {
    const group = drawerGroupLabels[key] || "Workspace";
    const found = groups.find((item) => item.group === group);
    const tab = { key, label };

    if (found) {
      found.tabs.push(tab);
    } else {
      groups.push({ group, tabs: [tab] });
    }

    return groups;
  }, []);
}
