import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleSelectionComponent } from './simple-selection.component';

describe('SimpleSelectionComponent', () => {
  let component: SimpleSelectionComponent;
  let fixture: ComponentFixture<SimpleSelectionComponent>;

  beforeEach(async(() => {
    // tslint:disable-next-line: no-floating-promises
    TestBed.configureTestingModule({
      declarations: [SimpleSelectionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // tslint:disable-next-line: no-floating-promises
    expect(component).toBeTruthy();
  });
});
