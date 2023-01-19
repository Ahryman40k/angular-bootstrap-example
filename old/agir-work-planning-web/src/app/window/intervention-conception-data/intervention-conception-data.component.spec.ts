import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InterventionConceptionDataComponent } from './intervention-conception-data.component';

describe('InterventionConceptionDataComponent', () => {
  let component: InterventionConceptionDataComponent;
  let fixture: ComponentFixture<InterventionConceptionDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InterventionConceptionDataComponent]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterventionConceptionDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
