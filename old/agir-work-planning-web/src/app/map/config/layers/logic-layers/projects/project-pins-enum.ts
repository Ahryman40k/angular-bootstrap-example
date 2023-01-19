export enum ProjectPins {
  PRELIMINARY_ORDERED_PROJECT_PINS = 'preliminary-ordered-project-pins',
  REPLANNED_PROJECT_PINS = 'replanned-project-pins',
  PAST_PROJECT_PINS = 'past-project-pins',
  PRESENT_PROJECT_PINS = 'present-project-pins',
  CANCELED_PROJECT_PINS = 'canceled-project-pins',
  PLANNED_PROJECT_PINS = 'planned-project-pins',
  POSTPONED_PROJECT_PINS = 'postponed-project-pins',
  FINAL_ORDERED_PROJECT_PINS = 'final-ordered-project-pins',
  PROGRAMMED_PROJECT_PINS = 'programmed-project-pins',
  FUTURE_PROJECT_PINS = 'future-project-pins'
}

export enum RtuProjectPins {
  PAST_RTU_PROJECT_PINS = 'past-rtu-project-pins',
  PRESENT_RTU_PROJECT_PINS = 'present-rtu-project-pins',
  FUTURE_RTU_PROJECT_PINS = 'future-rtu-project-pins'
}

export const mapProjectPinLayerIds = Object.values(ProjectPins);
