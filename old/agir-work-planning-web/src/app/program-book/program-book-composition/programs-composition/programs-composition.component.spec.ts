import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramsCompositionComponent } from './programs-composition.component';

describe('ProgrammesCompositionComponent', () => {
  let component: ProgramsCompositionComponent;
  let fixture: ComponentFixture<ProgramsCompositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramsCompositionComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramsCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
