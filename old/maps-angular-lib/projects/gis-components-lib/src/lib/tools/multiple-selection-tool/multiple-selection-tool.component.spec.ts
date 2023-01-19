import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoadSelectorToolComponent } from './multiple-selection-tool.component';

describe('RoadSelectorToolComponent', () => {
  let component: RoadSelectorToolComponent;
  let fixture: ComponentFixture<RoadSelectorToolComponent>;

  beforeEach(async(() => {
    // tslint:disable-next-line: no-floating-promises
    TestBed.configureTestingModule({
      declarations: [RoadSelectorToolComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoadSelectorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // tslint:disable-next-line: no-floating-promises
    expect(component).toBeTruthy();
  });
});
