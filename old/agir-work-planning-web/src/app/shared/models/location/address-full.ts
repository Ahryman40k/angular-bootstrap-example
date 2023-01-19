export interface IStreetType {
  nameFr: string;
  nameEn: string;
}
export interface IDirection {
  nameFr: string;
  nameEn: string;
}
export interface ICity {
  id: string;
  nameFr: string;
  nameEn: string;
}
export interface IFullStreetName {
  nameFr: string;
  nameEn: string;
}
export interface IStreet {
  streetType: IStreetType;
  streetLink: string;
  name: string;
  direction: IDirection;
  city: ICity;
  fullStreetName: IFullStreetName;
}
export interface IBorough {
  id: string;
  name: string;
}
export interface ICoordinate {
  lat: number;
  lon: number;
}
export interface IHumanReadableCode {
  valueFr: string;
  valueEn: string;
}
export interface IAddressFull {
  score: number;
  id: string;
  houseNumber: string;
  local: string;
  street: IStreet;
  road: IRoad;
  postalCode: string;
  borough: IBorough;
  coordinates: ICoordinate;
  humanReadableCode: IHumanReadableCode;
  isActive: boolean;
  isCertified: boolean;
}
export interface IRoad {
  id: number;
  sectionId: number;
}
