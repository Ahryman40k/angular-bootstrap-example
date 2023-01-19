import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionProjectsComponent } from './submission-projects.component';

describe('SubmissionProjectsComponent', () => {
  let component: SubmissionProjectsComponent;
  let fixture: ComponentFixture<SubmissionProjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubmissionProjectsComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
