export enum SubmissionProgressStatus {
  PRELIMINARY_DRAFT = 'preliminaryDraft',
  DESIGN = 'design',
  CALL_FOR_TENDER = 'callForTender',
  GRANTED = 'granted',
  REALIZATION = 'realization',
  CLOSING = 'closing'
}

const submissionProgressStatusesStateMachine: { [key: string]: SubmissionProgressStatus[] } = {
  [SubmissionProgressStatus.PRELIMINARY_DRAFT]: [SubmissionProgressStatus.DESIGN],
  [SubmissionProgressStatus.DESIGN]: [SubmissionProgressStatus.CALL_FOR_TENDER],
  [SubmissionProgressStatus.CALL_FOR_TENDER]: [SubmissionProgressStatus.GRANTED],
  [SubmissionProgressStatus.GRANTED]: [SubmissionProgressStatus.REALIZATION],
  [SubmissionProgressStatus.REALIZATION]: [SubmissionProgressStatus.CLOSING],
  [SubmissionProgressStatus.CLOSING]: []
};

export function nextAuthorizedSubmissionProgressStatuses(
  current: SubmissionProgressStatus
): SubmissionProgressStatus[] {
  if (submissionProgressStatusesStateMachine[current]) {
    return submissionProgressStatusesStateMachine[current];
  }
  return [];
}
