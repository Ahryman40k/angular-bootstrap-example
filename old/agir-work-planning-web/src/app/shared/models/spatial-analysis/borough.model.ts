/**
 * The result item from a terestrialborough request
 * TODO : This probably exist in another VDM lib. Will need to confirm.
 * example :
 * https://api.dev.interne.montreal.ca/api/it-platforms/geomatic/spatialanalysis/v1/intersect?datasourceId=terrestrialboroughs&long=-73.683437&lat=45.435979
 */
export interface IBorough {
  id: string;
  name: string;
}
