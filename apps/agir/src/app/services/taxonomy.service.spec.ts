import { TestBed } from '@angular/core/testing';

import { TaxonomyService } from './taxonomy.service';

describe('TaxonomyService', () => {
  let service: TaxonomyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaxonomyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
