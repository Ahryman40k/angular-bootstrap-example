import { HttpClient } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';

import { taxonomyMocks } from '../testing/mocks';
import { delay } from '../testing/testing.utils';
import { TaxonomiesService } from './taxonomies.service';

describe('Taxonomies Service', () => {
  let httpClient: jasmine.SpyObj<HttpClient>;
  let service: TaxonomiesService;

  beforeEach(async(() => {
    httpClient = jasmine.createSpyObj('HttpClient', ['get']);
    httpClient.get.and.returnValue(of({ items: taxonomyMocks.all }));
    TestBed.configureTestingModule({
      declarations: [],
      providers: [MtlAuthenticationService, { provide: HttpClient, useValue: httpClient }]
    });
  }));
  beforeEach(() => {
    service = TestBed.get(TaxonomiesService);
  });

  it('Positive - should cache taxonomies', async () => {
    let results = await service.taxonomies.pipe(take(1)).toPromise();
    results = await service.taxonomies.pipe(take(1)).toPromise();
    results = await service.taxonomies.pipe(take(1)).toPromise();
    void expect(httpClient.get).toHaveBeenCalledTimes(1);
  });

  it('Positive - should get new taxonomies after expiration', async () => {
    service['REFRESH_INTERVAL' as any] = 5; // 5 ms

    await service.taxonomies.pipe(take(1)).toPromise();
    await delay(7);
    await service.taxonomies.pipe(take(1)).toPromise();

    void expect(httpClient.get).toHaveBeenCalledTimes(1);
  });

  it('Positive - should get taxonomy group', async () => {
    const taxonomies = await service
      .group(TaxonomyGroup.requestor)
      .pipe(take(1))
      .toPromise();
    void expect(taxonomies.filter(x => x.group !== TaxonomyGroup.requestor).length).toEqual(0);
  });

  it('Positive - should get taxonomy groups', async () => {
    const taxonomies = await service
      .groups(TaxonomyGroup.requestor, TaxonomyGroup.programType)
      .pipe(take(1))
      .toPromise();
    void expect(taxonomies.length).toEqual(2);
    void expect(taxonomies[0].filter(x => x.group !== TaxonomyGroup.requestor).length).toEqual(0);
    void expect(taxonomies[1].filter(x => x.group !== TaxonomyGroup.programType).length).toEqual(0);
  });

  it('Positive - should get taxonomy code', async () => {
    const taxonomy = await service
      .code(TaxonomyGroup.requestor, 'hq')
      .pipe(take(1))
      .toPromise();
    void expect(taxonomy.code).toEqual('hq');
  });
});
