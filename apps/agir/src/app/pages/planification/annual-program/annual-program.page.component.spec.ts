import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualProgramPageComponent } from './annual-program.page.component';

describe('AnnualProgramPageComponent', () => {
  let component: AnnualProgramPageComponent;
  let fixture: ComponentFixture<AnnualProgramPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnualProgramPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnualProgramPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
