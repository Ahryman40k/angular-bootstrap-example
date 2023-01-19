import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LgnlatViewerToolComponent } from './lgnlat-viewer-tool.component';

describe('LgnlatViewerToolComponent', () => {
  let component: LgnlatViewerToolComponent;
  let fixture: ComponentFixture<LgnlatViewerToolComponent>;

  beforeEach(async(() => {
    // tslint:disable-next-line: no-floating-promises
    TestBed.configureTestingModule({
      declarations: [LgnlatViewerToolComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LgnlatViewerToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // tslint:disable-next-line: no-floating-promises
    expect(component).toBeTruthy();
  });
});
