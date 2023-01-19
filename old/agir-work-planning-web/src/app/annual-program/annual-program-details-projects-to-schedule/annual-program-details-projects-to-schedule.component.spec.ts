import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramDetailsProjectsToScheduleComponent } from './annual-program-details-projects-to-schedule.component';

describe('AnnualProgramDetailsProjectsToScheduleComponent', () => {
  let component: AnnualProgramDetailsProjectsToScheduleComponent;
  let fixture: ComponentFixture<AnnualProgramDetailsProjectsToScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramDetailsProjectsToScheduleComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramDetailsProjectsToScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
