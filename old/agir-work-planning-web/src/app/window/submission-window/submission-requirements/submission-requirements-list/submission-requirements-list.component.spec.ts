import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionRequirementsListComponent } from './submission-requirements-list.component';

describe('SubmissionRequirementsListComponent', () => {
  let component: SubmissionRequirementsListComponent;
  let fixture: ComponentFixture<SubmissionRequirementsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubmissionRequirementsListComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionRequirementsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
