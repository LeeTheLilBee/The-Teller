import { roles } from "../data/tellerSeed.js";
import { getRoleScopeSummary } from "./roleScope.js";

function card(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getRoleSafetySummary(role, activeEntityKey) {
  const scope = getRoleScopeSummary(role);
  const canSeeActiveCompany = role?.entityKeys?.includes(activeEntityKey) || false;

  const cards = [
    card(
      "Role scope",
      `${scope.companyCount} assigned company lane(s)`,
      role?.scope || "No role scope selected.",
      "steady"
    ),
    card(
      "Approval authority",
      scope.canApprove ? "Approval-capable role" : "View/review role",
      scope.canApprove ? "This role can participate in approval workflows." : "This role should not approve sensitive records.",
      scope.canApprove ? "steady" : "watch"
    ),
    card(
      "Step-up behavior",
      scope.requiresStepUp ? "Step-up expected" : "Step-up only when required",
      scope.requiresStepUp ? "Owner-level actions should require stronger confirmation." : "Sensitive actions may still require a reason or escalation.",
      scope.requiresStepUp ? "guarded" : "steady"
    ),
    card(
      "Current company access",
      canSeeActiveCompany ? "Allowed" : "Role-limited",
      canSeeActiveCompany ? "This PayRole can operate inside the selected company lane." : "This PayRole should be redirected to an assigned company lane.",
      canSeeActiveCompany ? "steady" : "blocked"
    ),
  ];

  return {
    role,
    scope,
    canSeeActiveCompany,
    cards,
  };
}

export function getAllRoleCards() {
  return roles.map((role) =>
    card(
      role.label,
      `${role.entityKeys.length} company lane(s) • Dashboard: ${role.dashboardRoom}`,
      `${role.scope}. ${role.note}`,
      role.key === "owner" ? "guarded" : "steady"
    )
  );
}
