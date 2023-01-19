import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { AlertComponent } from 'src/app/shared/alerts/alert/alert.component';
import { CollapseComponent } from 'src/app/shared/components/collapse/collapse.component';
import { LayoutModalComponent } from 'src/app/shared/dialogs/form-modal/layout-modal.component';
import { DetailsAddButtonComponent } from 'src/app/shared/forms/details-add-button/details-add-button.component';
import { CurrencyKPipe } from 'src/app/shared/pipes/currencyk.pipe';
import { NotAvailablePipe } from 'src/app/shared/pipes/not-available.pipe';
import { PermissionsPipe } from 'src/app/shared/pipes/permissions.pipe';
import { TaxonomyPipe } from 'src/app/shared/pipes/taxonomies.pipe';
import { AnnualProgramsComponent } from './annual-programs.component';

describe('AnnualProgramsComponent', () => {
  let component: AnnualProgramsComponent;
  let fixture: ComponentFixture<AnnualProgramsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PermissionsPipe,
        TaxonomyPipe,
        CurrencyKPipe,
        NotAvailablePipe,
        AnnualProgramsComponent,
        LayoutModalComponent,
        DetailsAddButtonComponent,
        CollapseComponent
      ],
      imports: [RouterTestingModule.withRoutes([]), HttpClientTestingModule, RouterModule],
      providers: [NgbModule, MtlAuthenticationService]
    });
  }));

  beforeEach(() => {
    TestBed.get(ActivatedRoute);
    fixture = TestBed.createComponent(AnnualProgramsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
