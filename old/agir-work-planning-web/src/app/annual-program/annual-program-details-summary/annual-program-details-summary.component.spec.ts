import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramDetailsSummaryComponent } from './annual-program-details-summary.component';

describe('AnnualProgramDetailsSummaryComponent', () => {
  let component: AnnualProgramDetailsSummaryComponent;
  let fixture: ComponentFixture<AnnualProgramDetailsSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramDetailsSummaryComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramDetailsSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
