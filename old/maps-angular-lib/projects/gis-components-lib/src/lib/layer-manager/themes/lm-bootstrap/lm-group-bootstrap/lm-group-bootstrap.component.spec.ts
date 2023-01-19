import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LmGroupBootstrapComponent } from './lm-group-bootstrap.component';

describe('LmGroupBootstrapComponent', () => {
  let component: LmGroupBootstrapComponent;
  let fixture: ComponentFixture<LmGroupBootstrapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LmGroupBootstrapComponent]
    })
      .compileComponents()
      .catch();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LmGroupBootstrapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
