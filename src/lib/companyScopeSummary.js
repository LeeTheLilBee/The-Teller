import { entities, worldRollup } from "../data/tellerSeed.js";
import { roleCanSeeEntity } from "./roleScope.js";

export function getCompanyScopeSummary({ visibleEntities, activeEntity, role }) {
  const active = visibleEntities.find((entity) => entity.key === activeEntity) || visibleEntities[0];

  const companies = visibleEntities.map((entity) => {
    const rollup = worldRollup.find((item) => item.key === entity.key);
    const allowedByRole = roleCanSeeEntity(role, entity.key);

    return {
      ...entity,
      allowedByRole,
      cash: rollup?.cash || "—",
      pay: rollup?.pay || "—",
      debt: rollup?.debt || "—",
    };
  });

  const hiddenCount = entities.length - visibleEntities.length;
  const roleLimitedCount = companies.filter((company) => !company.allowedByRole).length;

  return {
    active,
    companies,
    hiddenCount,
    roleLimitedCount,
    accessLine:
      hiddenCount > 0
        ? `${hiddenCount} company lane(s) hidden because they are not assigned.`
        : "All assigned company lanes are visible.",
  };
}
