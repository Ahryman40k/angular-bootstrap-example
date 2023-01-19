import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { of } from 'rxjs';
import { AlertComponent } from 'src/app/shared/alerts/alert/alert.component';
import { VdmSelectComponent } from 'src/app/shared/components/vdm-select/vdm-select.component';
import { LayoutModalComponent } from 'src/app/shared/dialogs/form-modal/layout-modal.component';
import { FormErrorClassDirective } from 'src/app/shared/forms/errors/form-error-class.directive';
import { FormErrorStructuralDirective } from 'src/app/shared/forms/errors/form-error-structural.directive';
import { FormErrorTagDirective } from 'src/app/shared/forms/errors/form-error-tag.directive';
import { FormErrorsComponent } from 'src/app/shared/forms/errors/form-errors.component';
import * as FormUtils from 'src/app/shared/forms/forms.utils';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { AnnualProgramModalComponent } from './annual-program-modal.component';

const annualProgramMock = {
  id: 'testId',
  executorId: 'di',
  year: 2022,
  budgetCap: 10,
  description: 'test',
  sharedRoles: [],
  status: 'news',
  audit: null
};
describe('AnnualProgramModalComponent', () => {
  let component: AnnualProgramModalComponent;
  let fixture: ComponentFixture<AnnualProgramModalComponent>;
  let annualProgramServiceMock: any;
  let taxonomiesServiceMock: any;
  beforeEach(async(() => {
    annualProgramServiceMock = jasmine.createSpyObj('AnnualProgramService', [
      'annualProgramContainsProjects',
      'create'
    ]);
    taxonomiesServiceMock = jasmine.createSpyObj('TaxonomiesService', {
      group: of('mock data')
    });

    TestBed.configureTestingModule({
      declarations: [
        AnnualProgramModalComponent,
        LayoutModalComponent,
        VdmSelectComponent,
        FormErrorsComponent,
        FormErrorTagDirective,
        FormErrorClassDirective,
        FormErrorStructuralDirective,
        AlertComponent
      ],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        NgbModule
      ],
      providers: [
        MtlAuthenticationService,
        NgbActiveModal,
        NgbModal,
        NgbModule,
        { provide: TaxonomiesService, useValue: taxonomiesServiceMock },
        { provide: AnnualProgramService, useValue: annualProgramServiceMock }
      ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualProgramModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return boolen', () => {
    const canUpdateExecutorAndYear = component.isUpdating && !component.annualProgramContainsProject;
    if (component.annualProgramContainsProject) {
      expect(component.canUpdateExecutorAndYear).toBe(!canUpdateExecutorAndYear);
    } else {
      expect(component.canUpdateExecutorAndYear).toBe(canUpdateExecutorAndYear);
    }
  });

  describe('Async methods Calls', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(AnnualProgramModalComponent);
      component = fixture.componentInstance;
    });

    it('should call annualProgramContainsProjects one time in ngOnInit', () => {
      component.annualProgram = annualProgramMock;
      fixture.detectChanges();
      expect(annualProgramServiceMock.annualProgramContainsProjects).toHaveBeenCalledTimes(1);
    });

    it('should call taxonomiesService.group one time in ngOnInit', () => {
      expect(taxonomiesServiceMock.group).toHaveBeenCalledTimes(1);
    });

    it('should call markAllAsTouched in submit function', () => {
      const markAllAsTouched = spyOnProperty(FormUtils, 'markAllAsTouched');
      component
        .submit()
        .then(() => {
          expect(markAllAsTouched).toHaveBeenCalledTimes(1);
        })
        .catch();
    });
  });
});
