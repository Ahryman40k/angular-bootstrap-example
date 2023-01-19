export enum AnnualProgramStatus {
  new = 'new',
  programming = 'programming',
  submittedFinal = 'submittedFinal'
}

export const ANNUAL_PROGRAM_STATUSES_CAN_CHANGE_PROGRAM_BOOKS: AnnualProgramStatus[] = [
  AnnualProgramStatus.new,
  AnnualProgramStatus.programming
];
