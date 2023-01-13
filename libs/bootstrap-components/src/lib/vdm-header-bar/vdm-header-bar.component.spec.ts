import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VdmHeaderBarComponent } from './vdm-header-bar.component';

describe('VdmHeaderBarComponent', () => {
  let component: VdmHeaderBarComponent;
  let fixture: ComponentFixture<VdmHeaderBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VdmHeaderBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VdmHeaderBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
