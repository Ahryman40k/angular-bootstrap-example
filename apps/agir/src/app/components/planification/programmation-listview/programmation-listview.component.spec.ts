import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgrammationListviewComponent } from './programmation-listview.component';

describe('ProgrammationListviewComponent', () => {
  let component: ProgrammationListviewComponent;
  let fixture: ComponentFixture<ProgrammationListviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgrammationListviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgrammationListviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
