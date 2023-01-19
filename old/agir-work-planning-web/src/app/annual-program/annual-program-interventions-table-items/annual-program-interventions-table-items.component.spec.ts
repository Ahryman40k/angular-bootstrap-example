import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramInterventionsTableItemsComponent } from './annual-program-interventions-table-items.component';

describe('AnnualProgramInterventionsTableItemsComponent', () => {
  let component: AnnualProgramInterventionsTableItemsComponent;
  let fixture: ComponentFixture<AnnualProgramInterventionsTableItemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramInterventionsTableItemsComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramInterventionsTableItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
