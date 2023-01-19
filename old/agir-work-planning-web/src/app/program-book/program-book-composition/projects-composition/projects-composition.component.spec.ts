import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsCompositionComponent } from './projects-composition.component';

describe('ProjectsCompositionComponent', () => {
  let component: ProjectsCompositionComponent;
  let fixture: ComponentFixture<ProjectsCompositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectsCompositionComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
