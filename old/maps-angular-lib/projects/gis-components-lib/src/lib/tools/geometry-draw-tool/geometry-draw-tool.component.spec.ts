import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { GeometryDrawToolComponent } from './geometry-draw-tool.component';

describe('AddGeometryToolComponent', () => {
  let component: GeometryDrawToolComponent;
  let fixture: ComponentFixture<GeometryDrawToolComponent>;

  beforeEach(async(() => {
    // tslint:disable-next-line: no-floating-promises
    TestBed.configureTestingModule({
      declarations: [GeometryDrawToolComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeometryDrawToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // tslint:disable-next-line: no-floating-promises
    expect(component).toBeTruthy();
  });
});
