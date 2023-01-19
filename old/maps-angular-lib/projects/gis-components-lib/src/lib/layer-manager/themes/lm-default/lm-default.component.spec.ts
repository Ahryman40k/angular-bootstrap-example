import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LmDefaultComponent } from './lm-default.component';

describe('LmDefaultComponent', () => {
  let component: LmDefaultComponent;
  let fixture: ComponentFixture<LmDefaultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LmDefaultComponent]
    })
      .compileComponents()
      .catch();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LmDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
