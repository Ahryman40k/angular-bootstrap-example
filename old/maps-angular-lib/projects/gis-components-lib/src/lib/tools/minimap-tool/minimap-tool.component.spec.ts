import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MinimapToolComponent } from './minimap-tool.component';

describe('MinimapToolComponent', () => {
  let component: MinimapToolComponent;
  let fixture: ComponentFixture<MinimapToolComponent>;

  beforeEach(async(() => {
    // tslint:disable-next-line: no-floating-promises
    TestBed.configureTestingModule({
      declarations: [MinimapToolComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinimapToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // tslint:disable-next-line: no-floating-promises
    expect(component).toBeTruthy();
  });
});
