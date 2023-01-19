import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramExecutorDetailsComponent } from './annual-program-executor-details.component';

describe('AnnualProgramExecutorDetailsComponent', () => {
  let component: AnnualProgramExecutorDetailsComponent;
  let fixture: ComponentFixture<AnnualProgramExecutorDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramExecutorDetailsComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramExecutorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
