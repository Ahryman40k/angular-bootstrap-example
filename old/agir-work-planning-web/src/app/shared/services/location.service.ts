import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import { sortBy, uniqBy } from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { buildHttpParams } from '../http/params-builder';
import { IAddressFull } from '../models/location/address-full';
import { IAddressSearchRequest } from '../models/location/address-search-request';
import { IPaginatedResults } from '../models/paginated-results';

export type UniqueKeyBuilder = (address: IAddressFull) => string;

export interface ISearchLocationsOptions {
  uniqueKeyBuilder?: UniqueKeyBuilder;
  sortBy?: (address: IAddressFull) => any;
}

interface IAddressFullKey extends IAddressFull {
  _uniqKey?: string;
}

export const uniqueKeyBuilders = {
  default: (address: IAddressFull) => address.humanReadableCode.valueFr.toLowerCase()
};

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly baseUrlAddresses = environment.apis.location.addresses;

  constructor(private readonly http: HttpClient) {}

  public getAddress(addressId: string): Observable<IAddressFull> {
    return this.http.get<IAddressFull>(`${this.baseUrlAddresses}/${addressId}`);
  }

  public searchAddresses(
    searchRequest: IAddressSearchRequest,
    options?: ISearchLocationsOptions
  ): Observable<IPaginatedResults<IAddressFull>> {
    const params = buildHttpParams(searchRequest);
    return this.http
      .get<IPaginatedResults<IAddressFull>>(this.baseUrlAddresses, { params })
      .pipe(
        map(x => this.mapSearchResults(x, searchRequest, options)),
        catchError(err => this.handleSearchError(err))
      );
  }

  public getAddressFeatures(addresses: IAddressFull[]): turf.Feature<turf.Point>[] {
    return addresses?.map(a => turf.point([a.coordinates.lon, a.coordinates.lat], { id: a.id })) || [];
  }

  public getAddressFeature(address: IAddressFull): turf.Feature<turf.Point> {
    return this.getAddressFeatures([address])[0];
  }

  private mapSearchResults(
    paginatedAddresses: IPaginatedResults<IAddressFull>,
    searchRequest: IAddressSearchRequest,
    options?: ISearchLocationsOptions
  ): IPaginatedResults<IAddressFull> {
    let addresses = paginatedAddresses.items as IAddressFullKey[];
    if (options?.uniqueKeyBuilder) {
      addresses = addresses.map((x: IAddressFullKey) => {
        x._uniqKey = options.uniqueKeyBuilder(x);
        return x;
      });
      addresses = uniqBy(addresses, x => x._uniqKey);
    }
    if (searchRequest?.q) {
      addresses = addresses.filter(x => x._uniqKey.includes(searchRequest?.q.toLowerCase()));
    }
    if (options?.sortBy) {
      addresses = sortBy(addresses, a => options.sortBy(a));
    }
    paginatedAddresses.items = addresses;
    return paginatedAddresses;
  }

  private handleSearchError(err: any): Observable<never> | Observable<IPaginatedResults<IAddressFull>> {
    if (err.status === 404) {
      return of({ items: [] } as IPaginatedResults<IAddressFull>);
    }
    return throwError(err);
  }
}
