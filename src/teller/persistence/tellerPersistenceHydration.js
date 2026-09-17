export const TELLER_HYDRATION_STATUS =
  Object.freeze({
    NOT_CONNECTED:
      "not_connected",

    BLOCKED:
      "blocked",

    LOADING:
      "loading",

    READY:
      "ready",

    ERROR:
      "error",
  });


export async function hydrateTellerRecords({
  repository,
  scope,
  query = {},
} = {}) {
  if (
    !repository ||
    repository.configured !== true ||
    repository.persistent !== true
  ) {
    return {
      status:
        TELLER_HYDRATION_STATUS.NOT_CONNECTED,

      hydrated:
        false,

      records:
        [],

      reason:
        "Production persistence repository is not connected.",
    };
  }


  if (
    !scope?.businessKey ||
    !scope?.towerSessionId
  ) {
    return {
      status:
        TELLER_HYDRATION_STATUS.BLOCKED,

      hydrated:
        false,

      records:
        [],

      reason:
        "Tower-authorized persistence scope is required.",
    };
  }


  try {
    const result =
      await repository.searchRecords({
        scope,
        query,
      });


    if (
      result?.status !==
      "ready"
    ) {
      return {
        status:
          TELLER_HYDRATION_STATUS.ERROR,

        hydrated:
          false,

        records:
          [],

        reason:
          "Production repository did not return a ready result.",
      };
    }


    return {
      status:
        TELLER_HYDRATION_STATUS.READY,

      hydrated:
        true,

      records:
        Array.isArray(
          result.records
        )
          ? result.records
          : [],
    };

  } catch (error) {

    return {
      status:
        TELLER_HYDRATION_STATUS.ERROR,

      hydrated:
        false,

      records:
        [],

      reason:
        String(
          error?.message ||
          error ||
          "Unknown Teller hydration error"
        ),
    };
  }
}
