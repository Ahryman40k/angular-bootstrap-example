import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VdmButtonComponent } from './vdm-button.component';

describe('VdmButtonComponent', () => {
  let component: VdmButtonComponent;
  let fixture: ComponentFixture<VdmButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VdmButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VdmButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
