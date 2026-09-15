export const TELLER_RECORD_REPOSITORY_STATUS =
  Object.freeze({
    NOT_CONNECTED:
      "not_connected",

    READY:
      "ready",

    ERROR:
      "error",
  });


export function createUnconfiguredTellerRecordRepository() {
  return Object.freeze({
    repository_id:
      "unconfigured",

    status:
      TELLER_RECORD_REPOSITORY_STATUS.NOT_CONNECTED,

    configured:
      false,

    persistent:
      false,

    async saveRecord() {
      return {
        status:
          TELLER_RECORD_REPOSITORY_STATUS.NOT_CONNECTED,

        persisted:
          false,

        record:
          null,
      };
    },

    async getRecord() {
      return {
        status:
          TELLER_RECORD_REPOSITORY_STATUS.NOT_CONNECTED,

        record:
          null,
      };
    },

    async searchRecords() {
      return {
        status:
          TELLER_RECORD_REPOSITORY_STATUS.NOT_CONNECTED,

        records:
          [],
      };
    },

    async updateRecord() {
      return {
        status:
          TELLER_RECORD_REPOSITORY_STATUS.NOT_CONNECTED,

        persisted:
          false,

        record:
          null,
      };
    },
  });
}


export function tellerRecordRepositoryTruth(
  repository
) {
  return {
    configured:
      Boolean(
        repository?.configured
      ),

    persistent:
      Boolean(
        repository?.persistent
      ),

    status:
      repository?.status ||
      TELLER_RECORD_REPOSITORY_STATUS.NOT_CONNECTED,
  };
}
