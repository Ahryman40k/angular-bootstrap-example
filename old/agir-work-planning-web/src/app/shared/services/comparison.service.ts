import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import {
  AnnualProgramExpand,
  IEnrichedIntervention,
  IEnrichedProject,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { intersection } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { CriteriaIndex } from 'src/app/map/config/layers/map-enums';

import { enumValues } from '../utils/utils';
import { AnnualProgramService } from './annual-program.service';
import { MapService } from './map.service';
import { TaxonomiesService } from './taxonomies.service';

export enum CriteriaType {
  ANNUAL_PROGRAM = 'Programmation annuelle',
  PROJECT_TYPE = 'Type de projet',
  MEDALS = 'Médaille',
  WORK_TYPE = 'Nature des travaux',
  PROGRAM_TYPE = 'Programme',
  REQUESTOR = 'Requérant',
  EXECUTOR = 'Exécutant'
}

export interface ICriteriaFeature {
  _highlighted: boolean;
  id: string;
  criteriaIndex: CriteriaIndex;
}

export interface ICriteriaValue {
  type: CriteriaType;
  items: ICriteriaItem[];
}

export interface ICriteriaItem {
  value: string;
  label?: string;
  color?: string;
  index?: number;
}

export const defaultCriteriaType = CriteriaType.PROGRAM_TYPE;
const annualProgramFields = ['executorId', 'year', 'programBooks.id'];
export const projectCriteriaValues: {
  type: CriteriaType;
  checkValueExist: (project: IEnrichedProject, item: ICriteriaItem) => boolean;
}[] = [
  // AGIR
  {
    type: CriteriaType.ANNUAL_PROGRAM,
    checkValueExist: (project, item) => {
      const programBooks = project.annualDistribution
        ? project.annualDistribution.annualPeriods.map(x => x.programBookId)
        : [];
      return intersection(programBooks, item.value.split(',')).length > 0;
    }
  },
  // AGIR
  {
    type: CriteriaType.EXECUTOR,
    checkValueExist: (project, item) => {
      return item.value && item.value === project.executorId;
    }
  },
  // AGIR
  {
    type: CriteriaType.MEDALS,
    checkValueExist: (project, item) => {
      return item.value && item.value === project.medalId;
    }
  },
  // AGIR
  {
    type: CriteriaType.PROJECT_TYPE,
    checkValueExist: (project, item) => {
      return item.value && item.value === project.projectTypeId;
    }
  },
  // PNI
  {
    type: CriteriaType.PROGRAM_TYPE,
    checkValueExist: (project, item) => {
      const value = project.interventions?.length > 0 ? project.interventions[0].programId : '';
      return item.value && item.value === value;
    }
  },
  // PNI
  {
    type: CriteriaType.REQUESTOR,
    checkValueExist: (project, item) => {
      const value = project.interventions?.length > 0 ? project.interventions[0].requestorId : '';
      return item.value && item.value === value;
    }
  },
  // PNI
  {
    type: CriteriaType.WORK_TYPE,
    checkValueExist: (project, item) => {
      const value = project.interventions?.length > 0 ? project.interventions[0].workTypeId : '';
      return item.value && item.value === value;
    }
  }
];
export const interventionCriteriaValues: { type: CriteriaType; getValue: (intervention) => string }[] = [
  {
    type: CriteriaType.EXECUTOR,
    getValue: (intervention: IEnrichedIntervention) => intervention.executorId
  },
  {
    type: CriteriaType.MEDALS,
    getValue: (intervention: IEnrichedIntervention) => intervention.medalId
  },
  {
    type: CriteriaType.PROGRAM_TYPE,
    getValue: (intervention: IEnrichedIntervention) => intervention.programId
  },
  {
    type: CriteriaType.REQUESTOR,
    getValue: (intervention: IEnrichedIntervention) => intervention.requestorId
  },
  {
    type: CriteriaType.WORK_TYPE,
    getValue: (intervention: IEnrichedIntervention) => intervention.workTypeId
  }
];

export const interventionFields = ['medalId', 'workTypeId', 'programId', 'requestorId', 'executorId'];
export const projectFields = [
  'medalId',
  'executorId',
  'annualDistribution.annualPeriods.programBookId',
  'interventionIds'
];

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private readonly allCriteriaValuesSubject$ = new BehaviorSubject<ICriteriaValue[]>([]);
  private readonly criteriaValuesSubject$ = new BehaviorSubject<ICriteriaValue>(null);
  private readonly interventionsSubject$ = new BehaviorSubject<IEnrichedIntervention[]>(null);

  public allCriteriaValues$ = this.allCriteriaValuesSubject$.asObservable();
  public criteriaValues$ = this.criteriaValuesSubject$.asObservable();

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly mapService: MapService,
    private readonly annualProgramService: AnnualProgramService
  ) {
    this.criteriaValuesSubject$.next({ type: defaultCriteriaType, items: [{ value: '' }] });
  }

  // fields to add to search call when we have criteria
  get projectFields(): string[] {
    return this.haveCriteriaValue ? projectFields : [];
  }

  // fields to add to search call when we have criteria
  get interventionFields(): string[] {
    return this.haveCriteriaValue ? interventionFields : [];
  }

  public get criteriaValues(): ICriteriaValue {
    return this.criteriaValuesSubject$.getValue();
  }

  public get allCriteriaValues(): ICriteriaValue[] {
    return this.allCriteriaValuesSubject$.getValue();
  }

  public get interventions(): IEnrichedIntervention[] {
    return this.interventionsSubject$.getValue();
  }

  public setInterventions(interventions: IEnrichedIntervention[]): void {
    this.interventionsSubject$.next(interventions);
  }

  private patchAllCriteriaValues(criteriaValue: ICriteriaValue): void {
    const allCriteriaValues = this.allCriteriaValues;
    const exist = this.checkCriteriaExist(criteriaValue.type);
    if (!exist) {
      allCriteriaValues.push(criteriaValue);
      this.allCriteriaValuesSubject$.next(allCriteriaValues);
    }
  }

  public patchCriteriaValue(criteriaValue: ICriteriaValue): void {
    this.criteriaValuesSubject$.next(criteriaValue);
  }

  public get criteriaValuesChanged$(): Observable<boolean> {
    return this.criteriaValues$.pipe(map(el => this.haveCriteriaValue));
  }

  private patchTaxonomiesItems(type: CriteriaType, taxonomyGroup: TaxonomyGroup): void {
    this.taxonomiesService
      .getTaxonomyByGroup(taxonomyGroup)
      .then(taxonomies => {
        const items: ICriteriaItem[] = taxonomies.items.map(taxo => {
          return { label: taxo.label.fr, value: taxo.code };
        });
        this.patchAllCriteriaValues({ type, items });
      })
      .catch(err => err);
  }

  private checkCriteriaExist(type: CriteriaType): boolean {
    return this.allCriteriaValuesSubject$.getValue().some(el => el.type === type);
  }

  private patchAnnualPrograms(): void {
    this.annualProgramService
      .getAll(annualProgramFields, [AnnualProgramExpand.programBooks], true)
      .then(annualPrograms => {
        let codes = annualPrograms.items.map(el => el.executorId);
        codes = codes.filter((el, index) => codes.indexOf(el) === index);
        this.taxonomiesService
          .codes(TaxonomyGroup.executor, codes)
          .pipe(take(1))
          .subscribe((taxo: ITaxonomy[]) => {
            const items: ICriteriaItem[] = annualPrograms.items.map(item => {
              const label = taxo.find(x => x.code === item.executorId)?.label.fr;
              return { label: `${label} - ${item.year}`, value: item.programBooks.map(pb => pb.id).join(',') };
            });
            this.patchAllCriteriaValues({ type: CriteriaType.ANNUAL_PROGRAM, items });
          });
      })
      .catch(err => err);
  }

  public get haveCriteriaValue(): boolean {
    return this.criteriaValues.items.some(el => el.value);
  }

  public loadCriteriaValues(type: CriteriaType): void {
    if (this.checkCriteriaExist(type)) {
      return;
    }
    switch (type) {
      case CriteriaType.WORK_TYPE:
        this.patchTaxonomiesItems(type, TaxonomyGroup.workType);
        break;
      case CriteriaType.EXECUTOR:
        this.patchTaxonomiesItems(type, TaxonomyGroup.executor);
        break;
      case CriteriaType.MEDALS:
        this.patchTaxonomiesItems(type, TaxonomyGroup.medalType);
        break;
      case CriteriaType.PROGRAM_TYPE:
        this.patchTaxonomiesItems(type, TaxonomyGroup.programType);
        break;
      case CriteriaType.PROJECT_TYPE:
        this.patchTaxonomiesItems(type, TaxonomyGroup.projectType);
        break;
      case CriteriaType.REQUESTOR:
        this.patchTaxonomiesItems(type, TaxonomyGroup.requestor);
        break;
      default:
        this.patchAnnualPrograms();
        break;
    }
  }

  private getTranslation(zoom: number): number {
    // [zoom level, translate to apply]
    const zoomLevels: [number, number][] = [
      [12.5, 250],
      [12.8, 210],
      [12.9, 200],
      [13, 180],
      [13.4, 160],
      [13.6, 130],
      [13.8, 110],
      [14, 90],
      [14.4, 80],
      [14.6, 70],
      [14.7, 60],
      [15, 50],
      [15.3, 40],
      [15.5, 35],
      [15.6, 30],
      [16, 25],
      [16.3, 20],
      [16.6, 15],
      [16.8, 13],
      [17.2, 10],
      [17.6, 8],
      [18, 6],
      [18.4, 4],
      [18.9, 3],
      [19.5, 2],
      [20, 1.7]
    ];
    const index = zoomLevels.findIndex(el => zoom < el[0]);
    if (index === -1) {
      return zoomLevels[zoomLevels.length - 1][1];
    }
    return index > 0 ? zoomLevels[index - 1][1] : zoomLevels[index][1];
  }

  public getProjectsCriteria(projects: IEnrichedProject[]): turf.Feature<turf.Point>[] {
    return projects
      .map(el => {
        el.interventions = this.interventions.filter(x => el.interventionIds.includes(x.id));
        return el;
      })
      ?.filter(p => p.geometryPin)
      .map(p => {
        let point = turf.point(p.geometryPin);
        point = turf.transformTranslate(point, this.getTranslation(this.mapService.zoom), 20, { units: 'meters' });
        point.properties = this.getProjectProperties(p);
        return point;
      });
  }

  public getInterventionCriteria(interventions: IEnrichedIntervention[]): turf.Feature<turf.Point>[] {
    return interventions
      ?.filter(i => i.interventionArea.geometryPin)
      .map(i => {
        let point = turf.point(i.interventionArea.geometryPin);
        point = turf.transformTranslate(point, this.getTranslation(this.mapService.zoom), 20, { units: 'meters' });
        point.properties = this.getInterventionProperties(i);
        return point;
      });
  }

  private getProjectProperties(project: IEnrichedProject): ICriteriaFeature {
    const projectCriteriaValue = projectCriteriaValues.find(el => el.type === this.criteriaValues.type);
    const index = projectCriteriaValue
      ? this.criteriaValues.items.findIndex(item => projectCriteriaValue.checkValueExist(project, item))
      : -1;
    const criteriaIndex = index > -1 ? enumValues<CriteriaIndex>(CriteriaIndex)[index] : null;
    return {
      _highlighted: true,
      id: project.id,
      criteriaIndex
    };
  }

  private getInterventionProperties(intervention: IEnrichedIntervention): ICriteriaFeature {
    const interventionCriteriaValue = interventionCriteriaValues.find(el => el.type === this.criteriaValues.type);
    const value = interventionCriteriaValue ? interventionCriteriaValue.getValue(intervention) : '';
    const index = this.criteriaValues.items.findIndex(el => el.value === value && el.value);
    const criteriaIndex = index > -1 ? enumValues<CriteriaIndex>(CriteriaIndex)[index] : null;
    return {
      _highlighted: true,
      id: intervention.id,
      criteriaIndex
    };
  }
}
