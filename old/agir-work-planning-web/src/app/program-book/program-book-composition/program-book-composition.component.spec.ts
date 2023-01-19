import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramBookCompositionComponent } from './program-book-composition.component';

describe('ProgramBookCompositionComponent', () => {
  let component: ProgramBookCompositionComponent;
  let fixture: ComponentFixture<ProgramBookCompositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramBookCompositionComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramBookCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
