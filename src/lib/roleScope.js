export function roleCanSeeEntity(role, entityKey) {
  if (!role || !Array.isArray(role.entityKeys)) return false;
  return role.entityKeys.includes(entityKey);
}

export function filterEntitiesForRole(entities, role) {
  if (!role || !Array.isArray(role.entityKeys)) return [];
  return entities.filter((entity) => role.entityKeys.includes(entity.key));
}

export function getRoleScopeSummary(role) {
  if (!role) {
    return {
      label: "No role selected",
      companyCount: 0,
      canApprove: false,
      requiresStepUp: false,
    };
  }

  return {
    label: role.label,
    companyCount: role.entityKeys.length,
    canApprove: ["owner", "manager", "program"].includes(role.key),
    requiresStepUp: role.key === "owner",
  };
}
