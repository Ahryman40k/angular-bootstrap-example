import {
  IEnrichedIntervention,
  IEnrichedProject,
  ITaxonomy,
  RequirementTargetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { FindOptions } from '../../../shared/findOptions/findOptions';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { interventionRepository } from '../../interventions/mongo/interventionRepository';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { IRequirementMongoAttributes } from '../mongo/requirementModel';
import { IPlainRequirementProps, PlainRequirement } from './plainRequirement';
import { RequirementItem } from './requirementItem';

// tslint:disable:no-empty-interface
export interface IRequirementProps extends IPlainRequirementProps, IAuditableProps {
  items: RequirementItem[];
  audit: Audit;
}

export class Requirement extends Auditable(PlainRequirement)<IRequirementProps> {
  public get loadedEntities(): (IEnrichedIntervention | IEnrichedProject)[] {
    return this._loadedEntities;
  }

  public static create(props: IRequirementProps, id?: string): Result<Requirement> {
    const guardPlain = PlainRequirement.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guardPlain, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<Requirement>(guardResult);
    }
    const requirement = new Requirement(props, id);
    return Result.ok<Requirement>(requirement);
  }

  public static async toDomainModel(raw: IRequirementMongoAttributes): Promise<Requirement> {
    const requirementItems = await Promise.all(raw.items.map(item => RequirementItem.toDomainModel(item)));
    // Not Mandatory but we can validated taxonomies when fetch from database
    // Taxonomies are cached ressources so not consuming
    let typeId: string;
    const typeIdTaxonomy: ITaxonomy = (await taxonomyService.getGroup(TaxonomyGroup.requirementType)).find(
      taxo => taxo.code === raw.typeId
    );
    if (typeIdTaxonomy) {
      typeId = typeIdTaxonomy.code;
    }
    let subtypeId: string;
    const subtypeIdTaxonomy: ITaxonomy = (await taxonomyService.getGroup(TaxonomyGroup.requirementSubtype)).find(
      taxo => taxo.code === raw.subtypeId
    );
    if (subtypeIdTaxonomy) {
      subtypeId = subtypeIdTaxonomy.code;
    }

    const requirementProps: IRequirementProps = {
      ...raw,
      typeId,
      subtypeId,
      items: requirementItems,
      audit: await Audit.toDomainModel(raw.audit)
    };
    return Requirement.create(requirementProps, raw._id.toString()).getValue();
  }

  public static toPersistence(requirement: Requirement): IRequirementMongoAttributes {
    return {
      _id: requirement.id,
      items: requirement.items.map(item => RequirementItem.toPersistance(item)),
      typeId: requirement.typeId,
      subtypeId: requirement.subtypeId,
      text: requirement.text,
      audit: Audit.toPersistance(requirement.audit)
    };
  }

  private _loadedEntities: (IEnrichedIntervention | IEnrichedProject)[];

  public async fetchItemEntity<E>(ids: string[], type: RequirementTargetType, fields?: string[]): Promise<E[]> {
    if (isEmpty(ids)) {
      return [];
    }
    const repository = type === RequirementTargetType.intervention ? interventionRepository : projectRepository;

    const entities = await repository.findAll(
      FindOptions.create({
        criterias: {
          id: ids
        },
        fields
      }).getValue()
    );

    return entities as E[];
  }

  public async fetchItemsEntities(): Promise<(IEnrichedIntervention | IEnrichedProject)[]> {
    const fields = ['id', 'status'];
    const [interventions, projects] = await Promise.all([
      this.fetchItemEntity<IEnrichedIntervention>(
        this.items.filter(item => item.type === RequirementTargetType.intervention).map(item => item.id),
        RequirementTargetType.intervention,
        fields
      ),
      this.fetchItemEntity<IEnrichedProject>(
        this.items.filter(item => item.type === RequirementTargetType.project).map(item => item.id),
        RequirementTargetType.project,
        fields
      )
    ]);
    this._loadedEntities = [...interventions, ...projects].filter(x => x);
    return this.loadedEntities;
  }
}
