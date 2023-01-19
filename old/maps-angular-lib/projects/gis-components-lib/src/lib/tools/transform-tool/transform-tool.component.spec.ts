import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransformToolComponent } from './transform-tool.component';

describe('TransformToolComponent', () => {
  let component: TransformToolComponent;
  let fixture: ComponentFixture<TransformToolComponent>;

  beforeEach(async(() => {
    // tslint:disable-next-line: no-floating-promises
    TestBed.configureTestingModule({
      declarations: [TransformToolComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransformToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // tslint:disable-next-line: no-floating-promises
    expect(component).toBeTruthy();
  });
});
