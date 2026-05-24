import { snapshots } from "../data/tellerSeed.js";

export function getSnapshot(entityKey) {
  return snapshots[entityKey] || snapshots.world;
}

export function buildMetricRows(profile, snapshot) {
  const labels = {
    balance: "Available",
    payrollDue: "Payroll",
    reserve: "Reserve",
    debt: "Debt",
  };

  return profile.metrics.map((metric) => {
    if (Array.isArray(metric)) {
      const [label, value] = metric;
      return [label, snapshot[value] || value];
    }

    return [labels[metric] || metric, snapshot[metric] || "—"];
  });
}

export function buildPriorities(profile, snapshot, role) {
  return profile.priorities.map((item) => {
    if (item === "nextAction") return snapshot.nextAction;
    if (item === "nextDebtAction") return snapshot.nextDebtAction;
    if (item === "roleNote") return role.note;
    return item;
  });
}
