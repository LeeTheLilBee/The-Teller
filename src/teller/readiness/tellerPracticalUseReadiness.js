import {
  TELLER_CERTIFICATION_STATE,
  TELLER_PRACTICAL_USE_CRITERIA,
} from "./tellerPracticalUseCriteria.js";


export function getTellerPracticalUseReadiness() {
  const entries =
    Object.entries(
      TELLER_PRACTICAL_USE_CRITERIA
    );


  const certified =
    entries
      .filter(
        ([, value]) =>
          value.state ===
          TELLER_CERTIFICATION_STATE.CERTIFIED
      )
      .map(
        ([key]) =>
          key
      );


  const integrationBlocked =
    entries
      .filter(
        ([, value]) =>
          value.state ===
          TELLER_CERTIFICATION_STATE.BLOCKED_PENDING_INTEGRATION
      )
      .map(
        ([key]) =>
          key
      );


  const notAuthorized =
    entries
      .filter(
        ([, value]) =>
          value.state ===
          TELLER_CERTIFICATION_STATE.NOT_AUTHORIZED
      )
      .map(
        ([key]) =>
          key
      );


  return Object.freeze({
    certification:
      "practical_use_source_lane",

    practical_use_source_certified:
      certified.length >= 7,

    deployment_ready:
      false,

    deployment_authorized:
      false,

    production_integrations_complete:
      false,

    certified_lanes:
      certified,

    blocked_integration_lanes:
      integrationBlocked,

    not_authorized_lanes:
      notAuthorized,

    doctrine: {
      tower:
        "identity_permission_clearance",

      teller:
        "people_payment_payroll_paperwork_workflow",

      vault:
        "sealed_memory_through_tower_only",
    },
  });
}


export function getTellerIntegrationBlockers() {
  const production =
    TELLER_PRACTICAL_USE_CRITERIA
      .production_integrations;


  return [
    ...(
      production.blockers ||
      []
    ),
  ];
}
