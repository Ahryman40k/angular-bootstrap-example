import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionRequirementsModalComponent } from './submission-requirements-modal.component';

describe('SubmissionRequirementsCreatModalComponent', () => {
  let component: SubmissionRequirementsModalComponent;
  let fixture: ComponentFixture<SubmissionRequirementsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubmissionRequirementsModalComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionRequirementsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
