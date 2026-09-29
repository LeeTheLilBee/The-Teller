import {
  TELLER_FORM_STATUSES,
  getTellerFormFields,
} from "./tellerFormSchema.js";

import {
  getTellerFormDefinition,
} from "./tellerFormRegistry.js";

import {
  validateTellerFormValues,
  getTellerFormCompletion,
} from "./tellerFormValidation.js";


function nowIso() {
  return new Date().toISOString();
}


function createId(prefix) {
  const random =
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID().slice(0, 10)
      : Math.random().toString(36).slice(2, 12);

  return `${prefix}_${Date.now()}_${random}`;
}


function clean(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}


export function createTellerFormDraft({
  form_id,
  role,
  actor = {},
  business = {},
  values = {},
}) {
  const form =
    getTellerFormDefinition(form_id);

  if (!form) {
    throw new Error(
      `Unknown Teller form: ${form_id}`
    );
  }

  if (
    !form.allowed_roles.includes(
      clean(role).toLowerCase()
    )
  ) {
    throw new Error(
      `Role ${role} cannot use form ${form_id}.`
    );
  }

  const created_at = nowIso();

  return {
    draft_id: createId("teller_form_draft"),
    form_id: form.form_id,
    form_version: form.version,

    role: clean(role).toLowerCase(),

    actor_context: {
      actor_id:
        clean(
          actor.id ||
          actor.actor_id ||
          actor.actorId
        ),

      display_name:
        clean(
          actor.display_name ||
          actor.displayName ||
          actor.name
        ),
    },

    business_context: {
      business_key:
        clean(
          business.key ||
          business.business_key ||
          business.businessKey
        ),

      business_label:
        clean(
          business.label ||
          business.name
        ),
    },

    values: {
      ...values,
    },

    status: TELLER_FORM_STATUSES.DRAFT,

    created_at,
    updated_at: created_at,

    persistence: {
      mode: "session_memory_only",
      stored_server_side: false,
      stored_in_local_storage: false,
    },
  };
}


export function evaluateTellerDraftStatus(
  form,
  values = {}
) {
  const validation =
    validateTellerFormValues(
      form,
      values
    );

  const completion =
    getTellerFormCompletion(
      form,
      values
    );

  const anyValue = getTellerFormFields(form)
    .some((field) => {
      const value = values[field.field_id];

      return !(
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      );
    });

  if (!anyValue) {
    return TELLER_FORM_STATUSES.DRAFT;
  }

  if (
    !completion.complete ||
    !validation.valid
  ) {
    return TELLER_FORM_STATUSES.INCOMPLETE;
  }

  return TELLER_FORM_STATUSES.READY;
}


export function updateTellerDraft(
  draft,
  field_id,
  value
) {
  const form =
    getTellerFormDefinition(
      draft.form_id
    );

  if (!form) {
    throw new Error(
      `Unknown Teller form: ${draft.form_id}`
    );
  }

  const values = {
    ...draft.values,
    [field_id]: value,
  };

  return {
    ...draft,
    values,
    status: evaluateTellerDraftStatus(
      form,
      values
    ),
    updated_at: nowIso(),
  };
}


export function createTellerFormSubmissionPacket(
  draft
) {
  const form =
    getTellerFormDefinition(
      draft.form_id
    );

  if (!form) {
    throw new Error(
      `Unknown Teller form: ${draft.form_id}`
    );
  }

  const validation =
    validateTellerFormValues(
      form,
      draft.values
    );

  if (!validation.valid) {
    throw new Error(
      "Form is incomplete or invalid."
    );
  }

  const field_provenance = {};

  getTellerFormFields(form)
    .forEach((field) => {
      if (
        draft.values[field.field_id] === null ||
        draft.values[field.field_id] === undefined ||
        String(
          draft.values[field.field_id]
        ).trim() === ""
      ) {
        return;
      }

      field_provenance[field.field_id] = {
        source: "manual_entry",
        extraction_confidence: null,
        verified: false,
        sensitivity:
          field.sensitivity ||
          "normal",
      };
    });

  return Object.freeze({
    submission_id:
      createId("teller_form_submission"),

    draft_id: draft.draft_id,

    form_id: form.form_id,
    form_version: form.version,

    workflow_type:
      form.workflow_type,

    category:
      form.category,

    requester_role:
      draft.role,

    actor_context:
      draft.actor_context,

    business_context:
      draft.business_context,

    values: {
      ...draft.values,
    },

    field_provenance,

    approval: {
      owner_approval_required:
        Boolean(
          form.owner_approval_required
        ),

      tower_approval_required:
        Boolean(
          form.tower_approval_required
        ),
    },

    document_slots:
      (form.document_slots || [])
        .map((slot) => ({
          ...slot,
          attached: false,
        })),

    submission_status:
      TELLER_FORM_STATUSES
        .READY_FOR_TRANSPORT,

    workflow_transport_connected:
      false,

    vault_direct_access_allowed:
      false,

    created_at:
      nowIso(),
  });
}


export function buildTellerSubmissionSummary(
  packet
) {
  return {
    submission_id:
      packet.submission_id,

    form_id:
      packet.form_id,

    workflow_type:
      packet.workflow_type,

    requester_role:
      packet.requester_role,

    owner_approval_required:
      packet.approval
        .owner_approval_required,

    tower_approval_required:
      packet.approval
        .tower_approval_required,

    submission_status:
      packet.submission_status,

    workflow_transport_connected:
      packet.workflow_transport_connected,
  };
}
