import { IInfoRtuPlaces } from './infoRtuPlaces';

export interface IInfoRtuContactProject {
  id?: string;
  officeId?: string;
  num?: string;
  phone?: string;
  cell?: string;
  phoneExtensionNumber?: string;
  fax?: string;
  email?: string;
  prefix?: string;
  name?: string;
  title?: string;
  typeNotfc?: string;
  paget?: string;
  profile?: string;
  globalRole?: string;
  idInterim?: string;
  inAutoNotification?: string;
  inDiffusion?: string;
  areaName?: string;
  role?: string;
  partnerType?: string;
  partnerId?: string;
}
export interface IInfoRtuProject {
  id?: string;
  name?: string;
  description?: string;
  productionPb?: string;
  conflict?: string;
  duration?: string;
  district?: string;
  idOrganization?: string;
  nomOrganization?: string;
  noReference?: string;
  coordinate?: {
    x: number;
    y: number;
  };
  contact?: IInfoRtuContactProject;
  status?: {
    name?: string;
    description?: string;
  };
  type?: {
    value?: string;
    partnerId?: string;
    definition?: string;
  };
  phase?: {
    value?: string;
    definition?: string;
  };
  dateStart?: number;
  dateEnd?: number;
  dateEntry?: number;
  dateModification?: number;
  places?: IInfoRtuPlaces[];
  cancellationReason?: string;
  localization?: string;
  rueSur?: string;
  rueDe?: string;
  rueA?: string;
  hasEditPermission?: boolean;
}
