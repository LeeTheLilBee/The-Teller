import { assignedEntityKeys, assignedRoleKeys, entities, roles } from "../data/tellerSeed.js";

export function getVisibleEntities() {
  return entities.filter((entity) => assignedEntityKeys.includes(entity.key));
}

export function getVisibleRoles() {
  return roles.filter((role) => assignedRoleKeys.includes(role.key));
}

export function resolveRole(visibleRoles, roleKey) {
  return visibleRoles.find((role) => role.key === roleKey) || visibleRoles[0];
}

export function resolveEntity(visibleEntities, entityKey) {
  return visibleEntities.find((entity) => entity.key === entityKey) || visibleEntities[0];
}

export function getNextAllowedEntityKey(role, currentEntityKey, visibleEntities) {
  if (role.entityKeys.includes(currentEntityKey)) return currentEntityKey;
  return role.entityKeys.find((key) => visibleEntities.some((entity) => entity.key === key)) || visibleEntities[0]?.key || "world";
}
