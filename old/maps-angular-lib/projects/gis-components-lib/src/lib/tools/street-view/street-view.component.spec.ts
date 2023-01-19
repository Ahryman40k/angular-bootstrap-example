import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StreetViewComponent } from './street-view.component';

describe('StreetViewComponent', () => {
  let component: StreetViewComponent;
  let fixture: ComponentFixture<StreetViewComponent>;

  beforeEach(async(() => {
    // tslint:disable-next-line: no-floating-promises
    TestBed.configureTestingModule({
      declarations: [StreetViewComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StreetViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // tslint:disable-next-line: no-floating-promises
    expect(component).toBeTruthy();
  });
});
