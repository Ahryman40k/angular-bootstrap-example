import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import {
  IEnrichedIntervention,
  IInterventionPaginatedSearchRequest,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { InterventionConceptionRequirementComponent } from 'src/app/export/intervention-conception-requirement/intervention-conception-requirement.component';
import { ProjectLinkComponent } from 'src/app/export/project-link/project-link.component';
import { AssetService } from 'src/app/shared/services/asset.service';
import { RequirementService } from 'src/app/shared/services/requirement.service';
import { InterventionLinkComponent } from '../../../../export/intervention-link/intervention-link.component';
import { IPaginatedResults } from '../../../models/paginated-results';
import { TaxonomyPipe } from '../../../pipes/taxonomies.pipe';
import { InterventionService } from '../../../services/intervention.service';
import { IVdmColumn } from '../vdm-table/vdm-table.component';
import { VdmDataSource } from './vdm-datasource';
export const DEFAULT_DISPLAYED_COLUMNS = ['id', 'interventionName', 'status', 'streetName', 'streetFrom', 'streetTo'];
@Injectable()
export class InterventionDataSource extends VdmDataSource<IEnrichedIntervention, IInterventionPaginatedSearchRequest> {
  public columns: IVdmColumn<IEnrichedIntervention>[] = [
    {
      fields: [],
      property: 'id',
      sortAsc: true,
      sticky: true,
      component: InterventionLinkComponent,
      label: 'Id int'
    },
    {
      fields: ['interventionName'],
      property: 'interventionName',
      label: 'Libellé'
    },
    {
      fields: ['status'],
      property: 'status',
      label: 'Statut',
      format: (intervention: IEnrichedIntervention) =>
        this.taxonomyPipe.transform(intervention.status, TaxonomyGroup.interventionStatus) as string
    },
    {
      fields: ['streetName'],
      property: 'streetName',
      label: 'Voie'
    },
    {
      fields: ['streetFrom'],
      property: 'streetFrom',
      label: 'Voie de'
    },
    {
      fields: ['streetTo'],
      property: 'streetTo',
      label: 'Voie à'
    },
    {
      fields: ['interventionYear'],
      property: 'interventionYear',
      permission: Permission.INTERVENTION_INITIAL_YEAR_READ,
      label: 'Année de début souhaitée',
      format: (intervention: IEnrichedIntervention) => intervention?.interventionYear?.toString() || ('' as string)
    },
    {
      fields: ['planificationYear'],
      property: 'planificationYear',
      label: 'Année planifiée',
      format: (intervention: IEnrichedIntervention) => intervention?.planificationYear?.toString() || ('' as string)
    },
    {
      fields: ['decisions'],
      property: 'decisions.status.audit.createdAt',
      permission: Permission.INTERVENTION_DECISION_READ,
      label: 'Date statut',
      format: (intervention: IEnrichedIntervention) => {
        try {
          const decisionsRelated = intervention.decisions.filter(des => des.typeId === intervention.status);
          const res = decisionsRelated.sort(
            (a, b) => new Date(a.audit.createdAt).getTime() - new Date(b.audit.createdAt).getTime()
          );
          return (this.datePipe.transform(res[0].audit.createdAt, 'yyyy-MM-dd HH:mm') as string) || '';
        } catch (error) {
          return '';
        }
      }
    },
    {
      fields: ['interventionTypeId'],
      property: 'interventionTypeId',
      label: 'Type intervention',
      format: (intervention: IEnrichedIntervention) =>
        this.taxonomyPipe.transform(intervention.interventionTypeId, TaxonomyGroup.interventionType) as string
    },
    {
      fields: ['audit'],
      property: 'audit.createdAt',
      label: 'Date de création',
      format: (intervention: IEnrichedIntervention) =>
        (this.datePipe.transform(intervention.audit.createdAt, 'yyyy-MM-dd HH:mm') as string) || ''
    },
    {
      fields: ['workTypeId'],
      property: 'workTypeId',
      label: 'Nature des travaux',
      format: (intervention: IEnrichedIntervention) =>
        (this.taxonomyPipe.transform(intervention.workTypeId, TaxonomyGroup.workType) as string) || ''
    },
    {
      fields: ['programId'],
      property: 'programId',
      label: 'Programme',
      format: (intervention: IEnrichedIntervention) =>
        (this.taxonomyPipe.transform(intervention.programId, TaxonomyGroup.programType) as string) || ''
    },
    {
      fields: ['estimate'],
      property: 'estimate.allowance',
      permission: Permission.INTERVENTION_BUDGET_READ,
      label: 'Estimation budgétaire (k$)',
      format: (intervention: IEnrichedIntervention) =>
        intervention?.estimate?.allowance?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || ''
    },
    {
      fields: ['assets'],
      property: 'assets.length.value',
      label: 'Longueur (km)',
      sortAsc: false,
      format: (intervention: IEnrichedIntervention) => {
        try {
          let value: number = 0;
          intervention.assets?.forEach(asset => {
            value += asset?.length?.value || 0;
          });
          const roundedValue = Math.round(value) / 1000;
          return roundedValue.toString() || '0';
        } catch (e) {
          return '0';
        }
      }
    },
    {
      fields: ['assets'],
      property: 'assets[0].typeId',
      sortAsc: false,
      label: 'Type actif',
      format: (intervention: IEnrichedIntervention) => {
        try {
          const assetType = this.assetService.getAssetTypeFromTypeId(intervention.assets[0].typeId);
          return (this.taxonomyPipe.transform(assetType, TaxonomyGroup.assetType) as string) || '';
        } catch (err) {
          return '';
        }
      }
    },
    {
      fields: ['requestorId'],
      property: 'requestorId',
      label: 'Réquérent',
      format: (intervention: IEnrichedIntervention) =>
        (this.taxonomyPipe.transform(intervention.requestorId, TaxonomyGroup.requestor) as string) || ''
    },
    {
      fields: ['executorId'],
      property: 'executorId',
      label: 'Exécutant',
      format: (intervention: IEnrichedIntervention) =>
        (this.taxonomyPipe.transform(intervention.executorId, TaxonomyGroup.executor) as string) || ''
    },
    {
      fields: ['boroughId'],
      property: 'boroughId',
      label: 'Arrondissement',
      format: (intervention: IEnrichedIntervention) =>
        (this.taxonomyPipe.transform(intervention.boroughId, TaxonomyGroup.borough) as string) || ''
    },
    {
      fields: ['decisions'],
      property: 'decisions.typeId',
      sortAsc: false,
      permission: Permission.INTERVENTION_DECISION_READ,
      label: 'Nombre de refus',
      format: (intervention: IEnrichedIntervention) =>
        intervention.decisions?.filter(des => des.typeId === 'refused')?.length?.toString() || ''
    },
    {
      fields: ['project'],
      property: 'project.id',
      label: 'ID Projet',
      component: ProjectLinkComponent
    },
    {
      fields: ['decisions'],
      property: 'decisions.revisionRequest.audit.createdAt',
      permission: Permission.INTERVENTION_DECISION_READ,
      sortAsc: false,
      label: 'Date de la dernière révision',
      format: (intervention: IEnrichedIntervention) => {
        const createdAtValue =
          intervention.decisions?.find(des => des.typeId === 'revisionRequest')?.audit.createdAt || undefined;
        return (this.datePipe.transform(createdAtValue, 'yyyy-MM-dd HH:mm') as string) || '';
      }
    },
    {
      fields: ['decisionRequired'],
      property: 'decisionRequired',
      label: 'Décision Requise',
      format: (intervention: IEnrichedIntervention) => (intervention.decisionRequired ? 'Oui' : ('Non' as string))
    },
    {
      fields: ['contact'],
      property: 'contact',
      permission: Permission.INTERVENTION_REQUESTOR_CONTACT_READ,
      label: 'Contact'
    },
    {
      fields: ['roadNetworkTypeId'],
      property: 'roadNetworkTypeId',
      label: 'Type de réseau',
      format: (intervention: IEnrichedIntervention) =>
        (this.taxonomyPipe.transform(intervention.roadNetworkTypeId, TaxonomyGroup.roadNetworkType) as string) || ''
    },
    {
      fields: ['medalId'],
      property: 'medalId',
      label: 'Médaille',
      format: (intervention: IEnrichedIntervention) =>
        (this.taxonomyPipe.transform(intervention.medalId, TaxonomyGroup.medalType) as string) || ''
    },
    {
      fields: ['requirementsConception'],
      property: 'requirementsConception',
      label: 'Exigences de planification',
      component: InterventionConceptionRequirementComponent,
      permission: Permission.REQUIREMENT_READ,
      augmented: (intervention: IEnrichedIntervention) => {
        try {
          const requirements = [];
          this.requirementsConception.forEach(requirement => {
            requirement.items?.forEach(r => {
              if (r.id === intervention.id) {
                requirements.push(requirement);
              }
            });
          });
          return requirements;
        } catch (e) {
          return undefined;
        }
      }
    }
  ];

  public requirementsConception = [];

  constructor(
    private interventionService: InterventionService,
    private requirementService: RequirementService,
    private taxonomyPipe: TaxonomyPipe,
    private datePipe: DatePipe,
    private readonly assetService: AssetService
  ) {
    super();
    this.displayedColumnsSubject.next(DEFAULT_DISPLAYED_COLUMNS);
    this.sortedColumnSubject.next(this.columns.find(el => el.sortAsc));
    this.datasourceDependencies$.subscribe(() => {
      this.load();
    });
  }
  public requestData(): Observable<IPaginatedResults<IEnrichedIntervention>> {
    return this.interventionService.searchPaginatedInterventions(this.searchRequest);
  }
  public async augmentedResult(items: IEnrichedIntervention[]): Promise<IEnrichedIntervention[]> {
    // Exigences de planification
    if (this.searchRequest.fields.includes('requirementsConception')) {
      const ids = items.map(intervention => intervention.id);
      if (ids.length > 0) {
        const resRequirements = await this.requirementService
          .getRequirements({
            itemId: ids,
            itemType: 'intervention',
            limit: 100000
          })
          .toPromise();
        this.requirementsConception = resRequirements.items;
      }
    }
    return Promise.resolve(items);
  }
}
