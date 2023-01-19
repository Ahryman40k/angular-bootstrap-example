import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestorsCompositionComponent } from './requestors-composition.component';

describe('RequestorsCompositionComponent', () => {
  let component: RequestorsCompositionComponent;
  let fixture: ComponentFixture<RequestorsCompositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RequestorsCompositionComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestorsCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
