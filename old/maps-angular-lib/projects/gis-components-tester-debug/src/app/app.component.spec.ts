import { async, TestBed } from '@angular/core/testing';
import { GisComponentsLibModule } from '../../../gis-components-lib/src/public-api';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    void TestBed.configureTestingModule({
      imports: [GisComponentsLibModule],
      declarations: [AppComponent]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    void expect(app).toBeTruthy();
  });

  it(`should have as title 'gis-components-tester'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    void expect(app.title).toEqual('gis-components-tester');
  });
});
