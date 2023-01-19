import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  IRtuProject,
  Permission,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, orderBy, range } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, take, takeUntil } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { BaseComponent } from '../../../shared/components/base/base.component';
import { AssetService } from '../../../shared/services/asset.service';
import { GLOBAL_FILTER_DEBOUNCE } from '../../../shared/services/filters/global-filter.service';
import { InterventionService } from '../../../shared/services/intervention.service';
import { MapHighlightService } from '../../../shared/services/map-highlight/map-highlight.service';
import { MapService } from '../../../shared/services/map.service';
import {
  allProjectStatus,
  defaultProjectSearchStatuses,
  ProjectService
} from '../../../shared/services/project.service';
import { IRtuPartnerByCategory, RtuProjectService } from '../../../shared/services/rtu-project.service';
import { TaxonomiesService } from '../../../shared/services/taxonomies.service';
import { UserService } from '../../../shared/user/user.service';
import { enumValues, Utils } from '../../../shared/utils/utils';
import { CustomValidators } from '../../../shared/validators/custom-validators';

interface ISectionForm {
  fromYear: number;
  toYear: number;
  section: ISection;
}

const FROM_YEAR_SUBTRACTION = 12;

interface ISection {
  label: string;
  geometry: IGeometry;
}

export interface ILabelProject<T> {
  project: T;
  program: string;
}

@Component({
  selector: 'app-bottom-panel',
  templateUrl: './bottom-panel.component.html',
  styleUrls: ['./bottom-panel.component.scss']
})
export class BottomPanelComponent extends BaseComponent implements OnInit, OnDestroy {
  public shown = false;
  public geometry: IGeometry;
  public form: FormGroup;
  private readonly availableSectionsSubject = new BehaviorSubject<ISection[]>([]);
  public availableSections$ = this.availableSectionsSubject.asObservable();
  private rtuPartnerByCategory: IRtuPartnerByCategory;

  private readonly projectsSubject = new BehaviorSubject<ILabelProject<IEnrichedProject | IRtuProject>[]>([]);
  public labelProjects$ = this.projectsSubject.asObservable();

  private readonly yearsSubject = new BehaviorSubject<number[]>([]);
  public years$ = this.yearsSubject.asObservable();

  private readonly interventionsSubject = new BehaviorSubject<IEnrichedIntervention[]>([]);
  public interventions$ = this.interventionsSubject.asObservable();

  public get isYearIntervalValid(): boolean {
    return this.form?.controls.fromYear.value < this.form?.controls.toYear.value;
  }

  constructor(
    private readonly mapService: MapService,
    private readonly fb: FormBuilder,
    private readonly projectService: ProjectService,
    private readonly assetService: AssetService,
    private readonly mapHighlightService: MapHighlightService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly userService: UserService,
    private readonly interventionService: InterventionService,
    private readonly taxonomiesService: TaxonomiesService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    this.initForm();
    await this.initTaxonomies();
    this.mapService.bottomPanel$.subscribe(async panel => {
      this.shown = panel.isOpened;
      if (!this.shown) {
        return;
      }
      if (this.geometry === panel.geometry) {
        return;
      }
      this.geometry = panel?.geometry;
      const fromYear = this.projectService.fromYear;
      this.form.reset({
        fromYear: fromYear - FROM_YEAR_SUBTRACTION,
        toYear: fromYear,
        section: null
      });
      this.projectsSubject.next([]);
      if (this.geometry) {
        await this.initAvailableSections(this.geometry);
      }
    });
  }

  public togglePanel(): void {
    this.mapService.toggleBottomPanel(!this.shown);
  }

  private initForm(): void {
    const fromYear = this.projectService.fromYear;
    this.form = this.fb.group({
      fromYear: [
        fromYear - FROM_YEAR_SUBTRACTION,
        [Validators.required, CustomValidators.min(2000), Validators.max(3000)]
      ],
      toYear: [fromYear, [Validators.required, CustomValidators.min(2000), Validators.max(3000)]],
      section: null
    });
    this.form.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE), takeUntil(this.destroy$))
      .subscribe(async (formValue: ISectionForm) => {
        if (
          this.isYearIntervalValid &&
          this.form.controls.section.value &&
          this.form.controls.fromYear.valid &&
          this.form.controls.toYear.valid
        ) {
          await this.getSectionActivity(formValue);
        }
      });
  }

  private async initAvailableSections(geometry: IGeometry): Promise<void> {
    const assets = await this.assetService.searchAssets({
      geometry,
      assetTypes: ['roadSection']
    });
    const sections: ISection[] = [];
    assets.forEach(asset => {
      sections.push({
        label: `${asset.properties.shortStreetName}, ${asset.properties.shortStreetFrom} à ${asset.properties.shortStreetTo}`,
        geometry: asset?.geometry
      });
    });
    this.availableSectionsSubject.next(sections);
  }

  private async initTaxonomies(): Promise<void> {
    const partnerTaxonomies = await this.taxonomiesService
      .group(TaxonomyGroup.infoRtuPartner)
      .pipe(take(1))
      .toPromise();

    this.rtuPartnerByCategory = this.rtuProjectService.getPartnerIdsByCategory(partnerTaxonomies);
  }

  private async getSectionActivity(formValue: ISectionForm): Promise<void> {
    this.yearsSubject.next(range(formValue.fromYear, formValue.toYear + 1));
    const paginatedProjects = await this.projectService
      .searchProjects({
        fromEndYear: formValue.fromYear,
        toStartYear: formValue.toYear,
        status: allProjectStatus,
        intersectGeometry: formValue.section.geometry,
        limit: environment.services.pagination.limitMax,
        fields: ['status', 'startYear', 'endYear', 'projectTypeId', 'interventionIds']
      })
      .toPromise();
    const labelProjects = await this.getLabelProjects(paginatedProjects.items);

    const canSearchPartnerProjects = await this.userService.hasPermission(Permission.PARTNER_PROJECT_READ);
    const noPartnerProjectCategories = [...this.rtuPartnerByCategory.borough, ...this.rtuPartnerByCategory.city];
    const paginatedRtuProjects = await this.rtuProjectService
      .searchRtuProjects({
        fromDateEnd: Utils.generateDatesFromYear(formValue.fromYear).firstDate,
        toDateStart: Utils.generateDatesFromYear(formValue.toYear).lastDate,
        intersectGeometry: formValue.section.geometry,
        partnerId: canSearchPartnerProjects
          ? [...noPartnerProjectCategories, ...this.rtuPartnerByCategory.partner]
          : noPartnerProjectCategories,
        limit: environment.services.pagination.limitMax,
        fields: ['status', 'dateStart', 'dateEnd', 'partnerId']
      })
      .toPromise();

    // get interventions
    const paginatedInterventions = await this.interventionService
      .searchInterventionsPost({
        project: null,
        fromPlanificationYear: formValue.fromYear,
        toPlanificationYear: formValue.toYear,
        intersectGeometry: formValue.section.geometry,
        limit: environment.services.pagination.limitMax,
        fields: ['status', 'planificationYear', 'interventionTypeId', 'programId', 'workTypeId', 'assets']
      })
      .toPromise();
    this.interventionsSubject.next(paginatedInterventions);

    const labelRtuProjects: ILabelProject<IRtuProject>[] = paginatedRtuProjects.items.map(p => {
      return {
        program: null,
        project: p
      };
    });
    const orderedLabelRtuProjects = orderBy(labelRtuProjects, p => {
      const rtuProject = p.project;
      return new Date(rtuProject.dateStart);
    });
    const combinedProjects = [...labelProjects, ...orderedLabelRtuProjects];
    const combinedOrderedProjects = orderBy(
      combinedProjects,
      a => {
        const project = a.project as IEnrichedProject;
        if ((project as IEnrichedProject).startYear) {
          return project.startYear;
        }
        const rtuProject = a.project as IRtuProject;
        if (rtuProject.dateStart) {
          return new Date(rtuProject.dateStart).getFullYear();
        }
      },
      'asc'
    );

    this.projectsSubject.next(combinedOrderedProjects);
  }

  private async getLabelProjects(projects: IEnrichedProject[]): Promise<ILabelProject<IEnrichedProject>[]> {
    if (!projects?.length) {
      return [];
    }

    const pniProjects = projects.filter(p => p.projectTypeId === ProjectType.nonIntegrated);
    const nonPniProjects = projects.filter(p => p.projectTypeId !== ProjectType.nonIntegrated);
    const labelProjects: ILabelProject<IEnrichedProject>[] = [];
    if (pniProjects?.length) {
      const interventionIds = flatten(pniProjects.map(p => p.interventionIds));

      const interventions = await this.interventionService
        .searchInterventions({
          id: interventionIds,
          limit: environment.services.pagination.limitMax,
          fields: ['programId', 'project']
        })
        .toPromise();

      const mappedProjects: ILabelProject<IEnrichedProject>[] = pniProjects.map(p => {
        const labelProject: ILabelProject<IEnrichedProject> = {
          project: p,
          program: interventions.find(i => i.project?.id === p.id)?.programId
        };
        return labelProject;
      });
      labelProjects.push(...mappedProjects);
    }
    if (nonPniProjects?.length) {
      const mappedNonPniProjects = nonPniProjects.map(p => {
        const labelProject: ILabelProject<IEnrichedProject> = {
          project: p,
          program: null
        };
        return labelProject;
      });
      labelProjects.push(...mappedNonPniProjects);
    }
    return labelProjects;
  }
}
