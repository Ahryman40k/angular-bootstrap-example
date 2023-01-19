import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionProjectsTableItemsComponent } from './submission-projects-table-items.component';

describe('SubmissionProjectsTableItemsComponent', () => {
  let component: SubmissionProjectsTableItemsComponent;
  let fixture: ComponentFixture<SubmissionProjectsTableItemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubmissionProjectsTableItemsComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionProjectsTableItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
