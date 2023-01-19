import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionRequirementsComponent } from './submission-requirements.component';

describe('SubmissionRequirementsComponent', () => {
  let component: SubmissionRequirementsComponent;
  let fixture: ComponentFixture<SubmissionRequirementsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubmissionRequirementsComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionRequirementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
