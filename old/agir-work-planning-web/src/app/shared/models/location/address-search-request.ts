export interface IAddressSearchRequest {
  /**
   * 	full text search
   */
  q?: string;

  /**
   * 	Finds a list of addresses having the housenumber. Must be use with a postalCode or street parameter.
   */
  houseNumber?: string;

  /**
   * 	Use to filter adresses by street name, in combination with housnumber.
   */
  street?: string;

  /**
   * 	Use to filter by potalCode, in combination with housnumber.
   */
  postalCode?: string;

  /**
   * 	Use to filter by city, can be use also with houseNumber and the (q=) full text search parameter
   */
  city?: string;

  /**
   * 	Find a list of addresses within a range of the latitude/longitude point. > Default radius is 50m, min is 10m, max radius is 500m, use r= to specify a different look-up radius
   */
  latlng?: string;

  /**
   * 	Allowed values: score, borough, boroughLegacy
   */
  expand?: string;

  offset?: number;
  limit?: number;
}
