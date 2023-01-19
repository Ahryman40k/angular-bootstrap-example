import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramDetailsProgrambooksComponent } from './annual-program-details-programbooks.component';

describe('AnnualProgramDetailsProgrambooksComponent', () => {
  let component: AnnualProgramDetailsProgrambooksComponent;
  let fixture: ComponentFixture<AnnualProgramDetailsProgrambooksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramDetailsProgrambooksComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramDetailsProgrambooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
