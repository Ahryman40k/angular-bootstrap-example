import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramDetailsSubmittedInterventionsComponent } from './annual-program-details-submitted-interventions.component';

describe('AnnualProgramDetailsSubmittedInterventionsComponent', () => {
  let component: AnnualProgramDetailsSubmittedInterventionsComponent;
  let fixture: ComponentFixture<AnnualProgramDetailsSubmittedInterventionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramDetailsSubmittedInterventionsComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramDetailsSubmittedInterventionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
