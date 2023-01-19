import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramDetailsProjectsTableItemsComponent } from './annual-program-details-projects-table-items.component';

describe('AnnualProgramDetailsProjectsTableItemsComponent', () => {
  let component: AnnualProgramDetailsProjectsTableItemsComponent;
  let fixture: ComponentFixture<AnnualProgramDetailsProjectsTableItemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramDetailsProjectsTableItemsComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramDetailsProjectsTableItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
