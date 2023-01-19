import { BaseProjectAnnualDistributionService } from './baseProjectAnnualDistributionService';

class NonGeolocatedAnnualDistributionService extends BaseProjectAnnualDistributionService {}

export const nonGeolocatedAnnualDistributionService = new NonGeolocatedAnnualDistributionService();
