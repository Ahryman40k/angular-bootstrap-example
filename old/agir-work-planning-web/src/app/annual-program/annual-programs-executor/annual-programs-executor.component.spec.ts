import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramsExecutorComponent } from './annual-programs-executor.component';

describe('AnnualProgramsExecutorComponent', () => {
  let component: AnnualProgramsExecutorComponent;
  let fixture: ComponentFixture<AnnualProgramsExecutorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramsExecutorComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramsExecutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
