import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SpatialAnalysisService } from './spatial-analysis.service';

describe('SpatialAnalysisService', () => {
  let service: SpatialAnalysisService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SpatialAnalysisService]
    });
    service = TestBed.get(SpatialAnalysisService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    void expect(service).toBeTruthy();
  });
});
