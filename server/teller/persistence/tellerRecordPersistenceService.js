export function createTellerRecordPersistenceService({
  repository,
} = {}) {
  if (
    !repository ||
    repository.configured !== true ||
    repository.persistent !== true
  ) {
    throw new Error(
      "Teller persistence service requires a configured persistent repository."
    );
  }


  return Object.freeze({
    repository_id:
      repository.repository_id,


    savePreparedRecord(
      input
    ) {
      return repository.saveRecord(
        input
      );
    },


    getRecord(
      input
    ) {
      return repository.getRecord(
        input
      );
    },


    searchRecords(
      input
    ) {
      return repository.searchRecords(
        input
      );
    },


    updateRecord(
      input
    ) {
      return repository.updateRecord(
        input
      );
    },


    appendHistoryEvent(
      input
    ) {
      return repository.appendHistoryEvent(
        input
      );
    },
  });
}
