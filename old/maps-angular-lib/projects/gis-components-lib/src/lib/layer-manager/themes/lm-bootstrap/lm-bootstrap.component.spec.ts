import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LmBootstrapComponent } from './lm-bootstrap.component';

describe('BootstrapThemeComponent', () => {
  let component: LmBootstrapComponent;
  let fixture: ComponentFixture<LmBootstrapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LmBootstrapComponent]
    })
      .compileComponents()
      .catch();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LmBootstrapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
