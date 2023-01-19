import { ILayerGroup } from '@villemontreal/maps-angular-lib';

import { assetLogicLayerGroups } from './layers/asset-logic-layer-groups';
import { addresses } from './layers/logic-layers/addresses';
import { boroughs } from './layers/logic-layers/boroughs/boroughs-layer';
import { countByBorough } from './layers/logic-layers/boroughs/count-by-borough';
import { circleComparison } from './layers/logic-layers/circle-comparison';
import { countByCity } from './layers/logic-layers/cities/count-by-city';
import { interventionCreation } from './layers/logic-layers/interventions/interventions-creation-layer';
import { interventions } from './layers/logic-layers/interventions/interventions-layer';
import { projectCreation } from './layers/logic-layers/projects/project-creation-layer';
import { ProjectPin, RtuProjectPin } from './layers/logic-layers/projects/project-pin-enum';
import { ProjectPins, RtuProjectPins } from './layers/logic-layers/projects/project-pins-enum';
import {
  PlannedProjectTimePosition,
  PostponedProjectTimePosition,
  ProjectTimePosition,
  ReplannedProjectTimePosition,
  RtuProjectTimePosition
} from './layers/logic-layers/projects/project-time-position';
import {
  createProjectAreaLayers,
  createProjectPinLayer,
  createRtuProjectPinLayer
} from './layers/logic-layers/projects/utils';
import { roadSectionsSelection } from './layers/logic-layers/road-sections/road-sections';
import { selectionRadius } from './layers/logic-layers/selection-radius';
import { ObjectPinType } from './layers/map-enums';
import { assetsPins } from './layers/pins/assets-pins';
import { mapStyleConfig, patternStyle } from './layers/styles';

export const customMapLayers: ILayerGroup = {
  addresses,
  assetsPins,
  pastProjectPins: [
    createProjectPinLayer(ProjectPins.PAST_PROJECT_PINS, ProjectPin.PAST_PROJECT_PIN, ObjectPinType.pastProject)
  ],
  pastRtuProjectPins: [
    createRtuProjectPinLayer(
      RtuProjectPins.PAST_RTU_PROJECT_PINS,
      RtuProjectPin.PAST_RTU_PROJECT_PIN,
      ObjectPinType.pastRtuProject
    )
  ],
  replannedProjectPins: [
    createProjectPinLayer(
      ProjectPins.REPLANNED_PROJECT_PINS,
      ProjectPin.REPLANNED_PROJECT_PIN,
      ObjectPinType.replannedProject
    )
  ],
  preliminaryOrderedProjectPins: [
    createProjectPinLayer(
      ProjectPins.PRELIMINARY_ORDERED_PROJECT_PINS,
      ProjectPin.PRELIMINARY_ORDERED_PROJECT_PIN,
      ObjectPinType.preliminaryOrderedProject
    )
  ],
  presentProjectPins: [
    createProjectPinLayer(
      ProjectPins.PRESENT_PROJECT_PINS,
      ProjectPin.PRESENT_PROJECT_PIN,
      ObjectPinType.presentProject
    )
  ],
  plannedProjectPins: [
    createProjectPinLayer(
      ProjectPins.PLANNED_PROJECT_PINS,
      ProjectPin.PLANNED_PROJECT_PIN,
      ObjectPinType.plannedProject
    )
  ],
  postponedProjectPins: [
    createProjectPinLayer(
      ProjectPins.POSTPONED_PROJECT_PINS,
      ProjectPin.POSTPONED_PROJECT_PIN,
      ObjectPinType.postponedProject
    )
  ],
  programmedProjectPins: [
    createProjectPinLayer(
      ProjectPins.PROGRAMMED_PROJECT_PINS,
      ProjectPin.PROGRAMMED_PROJECT_PIN,
      ObjectPinType.programmedProject
    )
  ],
  canceledProjectPins: [
    createProjectPinLayer(
      ProjectPins.CANCELED_PROJECT_PINS,
      ProjectPin.CANCELED_PROJECT_PIN,
      ObjectPinType.canceledProject
    )
  ],
  finalOrderedProjectPins: [
    createProjectPinLayer(
      ProjectPins.FINAL_ORDERED_PROJECT_PINS,
      ProjectPin.FINAL_ORDERED_PROJECT_PIN,
      ObjectPinType.finalOrderedProject
    )
  ],
  presentRtuProjectPins: [
    createRtuProjectPinLayer(
      RtuProjectPins.PRESENT_RTU_PROJECT_PINS,
      RtuProjectPin.PRESENT_RTU_PROJECT_PIN,
      ObjectPinType.presentRtuProject
    )
  ],
  futureProjectPins: [
    createProjectPinLayer(ProjectPins.FUTURE_PROJECT_PINS, ProjectPin.FUTURE_PROJECT_PIN, ObjectPinType.futureProject)
  ],
  futureRtuProjectPins: [
    createRtuProjectPinLayer(
      RtuProjectPins.FUTURE_RTU_PROJECT_PINS,
      RtuProjectPin.FUTURE_RTU_PROJECT_PIN,
      ObjectPinType.futureRtuProject
    )
  ],
  pastProjectAreas: [...createProjectAreaLayers(ProjectTimePosition.PAST_PROJECT, mapStyleConfig.colors.purple)],
  presentProjectAreas: [...createProjectAreaLayers(ProjectTimePosition.PRESENT_PROJECT, mapStyleConfig.colors.green)],
  plannedProjectAreas: [
    ...createProjectAreaLayers(PlannedProjectTimePosition.PRESENT_PLANNED_PROJECT, mapStyleConfig.colors.fuchsia)
  ],
  replannedProjectAreas: [
    ...createProjectAreaLayers(ReplannedProjectTimePosition.PRESENT_REPLANNED_PROJECT, mapStyleConfig.colors.fuchsia)
  ],
  postponedProjectAreas: [
    ...createProjectAreaLayers(PostponedProjectTimePosition.PRESENT_POSTPONED_PROJECT, mapStyleConfig.colors.fuchsia)
  ],
  futureProjectAreas: [...createProjectAreaLayers(ProjectTimePosition.FUTURE_PROJECT, mapStyleConfig.colors.sky)],
  pastRtuProjectAreas: [
    ...createProjectAreaLayers(RtuProjectTimePosition.PAST_RTU_PROJECT, mapStyleConfig.colors.purple)
  ],
  presentRtuProjectAreas: [
    ...createProjectAreaLayers(RtuProjectTimePosition.PRESENT_RTU_PROJECT, mapStyleConfig.colors.green)
  ],
  futureRtuProjectAreas: [
    ...createProjectAreaLayers(RtuProjectTimePosition.FUTURE_RTU_PROJECT, mapStyleConfig.colors.sky)
  ],
  multipleYearsProjectAreas: [
    ...createProjectAreaLayers(
      ProjectTimePosition.MULTIPLE_YEARS_PROJECT,
      mapStyleConfig.colors.green,
      patternStyle.pattern
    )
  ],
  multipleYearsPlannedProjectAreas: [
    ...createProjectAreaLayers(
      PlannedProjectTimePosition.MULTIPLE_YEARS_PLANNED_PROJECT,
      mapStyleConfig.colors.fuchsia,
      patternStyle.fuchsiaPattern
    )
  ],
  multipleYearsReplannedProjectAreas: [
    ...createProjectAreaLayers(
      ReplannedProjectTimePosition.MULTIPLE_YEARS_REPLANNED_PROJECT,
      mapStyleConfig.colors.fuchsia,
      patternStyle.fuchsiaPattern
    )
  ],
  multipleYearsPostponedProjectAreas: [
    ...createProjectAreaLayers(
      PostponedProjectTimePosition.MULTIPLE_YEARS_POSTPONED_PROJECT,
      mapStyleConfig.colors.fuchsia,
      patternStyle.fuchsiaPattern
    )
  ],
  circleComparison,
  interventions,
  interventionCreation,
  projectCreation,
  boroughs,
  countByBorough,
  countByCity,
  selectionRadius,
  roadSectionsSelection,
  ...assetLogicLayerGroups
};
