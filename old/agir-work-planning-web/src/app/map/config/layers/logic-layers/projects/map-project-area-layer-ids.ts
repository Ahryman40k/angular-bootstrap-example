import { ObjectPinType } from '../../map-enums';

const areaHalo = '-area-halo';

export const mapProjectAreaLayerIds = [
  'past-project',
  'past-project-area-halo',
  'present-project',
  'present-project-area-halo',
  'future-project',
  'future-project-area-halo',
  'multiple-years-project',
  'multiple-years-project-area-halo'
];

export const mapRtuProjectAreaLayerIds = [
  ObjectPinType.presentRtuProject,
  `${ObjectPinType.presentRtuProject}${areaHalo}`,
  ObjectPinType.pastRtuProject,
  `${ObjectPinType.pastRtuProject}${areaHalo}`,
  ObjectPinType.futureRtuProject,
  `${ObjectPinType.futureRtuProject}${areaHalo}`
];
