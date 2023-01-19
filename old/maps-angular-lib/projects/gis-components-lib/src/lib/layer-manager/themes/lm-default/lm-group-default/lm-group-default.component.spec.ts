import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LmGroupDefaultComponent } from './lm-group-default.component';

describe('LmGroupDefaultComponent', () => {
  let component: LmGroupDefaultComponent;
  let fixture: ComponentFixture<LmGroupDefaultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LmGroupDefaultComponent]
    })
      .compileComponents()
      .catch();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LmGroupDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
