import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectivePreviewComponent } from './objective-preview.component';

describe('ObjectivePreviewComponent', () => {
  let component: ObjectivePreviewComponent;
  let fixture: ComponentFixture<ObjectivePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ObjectivePreviewComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectivePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
