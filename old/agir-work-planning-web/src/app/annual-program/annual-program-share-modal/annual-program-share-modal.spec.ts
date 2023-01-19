import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { AlertComponent } from 'src/app/shared/alerts/alert/alert.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { LayoutModalComponent } from 'src/app/shared/dialogs/form-modal/layout-modal.component';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { AnnualProgramShareModalComponent } from './annual-program-share-modal.component';

describe('AnnualProgramShareModalComponent', () => {
  let component: AnnualProgramShareModalComponent;
  let fixture: ComponentFixture<AnnualProgramShareModalComponent>;
  let annualProgramService: AnnualProgramService;
  let dialogsService: DialogsService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnualProgramShareModalComponent, LayoutModalComponent, AlertComponent],
      imports: [RouterTestingModule.withRoutes([]), HttpClientTestingModule, RouterModule],
      providers: [NgbModule, MtlAuthenticationService, NgbActiveModal, NgbModal]
    });
  }));

  beforeEach(() => {
    TestBed.get(ActivatedRoute);
    fixture = TestBed.createComponent(AnnualProgramShareModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    annualProgramService = TestBed.get(AnnualProgramService);
    dialogsService = TestBed.get(DialogsService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
