import {
  createTellerRecordEnvelope,
} from "./tellerRecordSchema.js";

import {
  getTellerFormDefinition,
} from "../forms/tellerFormRegistry.js";


function createRecordId(
  submissionId
) {
  return (
    submissionId
      ? `teller_record_${submissionId}`
      : `teller_record_${Date.now()}`
  );
}


export function buildTellerRecordFromPreparedPacket(
  packet,
  {
    actor_role = "",
    business_key = "",
  } = {}
) {
  if (!packet?.form_id) {
    throw new Error(
      "Prepared Teller packet must include form_id."
    );
  }


  const form =
    getTellerFormDefinition(
      packet.form_id
    );


  const submissionId =
    packet.submission_id ||
    packet.request_id ||
    "";


  return createTellerRecordEnvelope({
    record_id:
      createRecordId(
        submissionId
      ),

    source:
      "form",

    source_id:
      submissionId,

    form_id:
      packet.form_id,

    workflow_type:
      form?.workflow_type ||
      packet.workflow_type ||
      packet.form_id,

    category:
      form?.category ||
      "",

    title:
      form?.title ||
      form?.short_title ||
      "",

    business_key:
      business_key,

    actor_role:
      actor_role,

    payload: {
      values:
        packet.values || {},

      submission_status:
        packet.submission_status ||
        "prepared",

      owner_approval_required:
        Boolean(
          packet.owner_approval_required
        ),

      tower_approval_required:
        Boolean(
          packet.tower_approval_required
        ),

      verified_autofill_provenance:
        packet
          .verified_autofill_provenance ||
        {},
    },

    created_at:
      packet.created_at ||
      null,
  });
}
