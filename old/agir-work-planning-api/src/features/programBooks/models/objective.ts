import { IEnrichedIntervention, ProgramBookObjectiveTargetType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, sumBy, uniq } from 'lodash';

import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { IObjectiveMongoAttributes } from '../mongo/objectiveSchema';
import { ObjectiveValues } from './objectiveValues';
import { IPlainObjectiveProps, PlainObjective } from './plainObjective';

// tslint:disable:no-empty-interface
export interface IObjectiveProps extends IPlainObjectiveProps, IAuditableProps {
  values: ObjectiveValues;
  audit: Audit;
}

export class Objective extends Auditable(PlainObjective)<IObjectiveProps> {
  public static create(props: IObjectiveProps, id?: string): Result<Objective> {
    const guardPlain = PlainObjective.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guardPlain, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<Objective>(guardResult);
    }
    const objective = new Objective(props, id);
    return Result.ok<Objective>(objective);
  }

  public static async toDomainModel(raw: IObjectiveMongoAttributes): Promise<Objective> {
    const values = await ObjectiveValues.toDomainModel(raw.values);
    return Objective.create(
      {
        name: raw.name,
        targetType: raw.targetType,
        objectiveType: raw.objectiveType,
        requestorId: raw.requestorId,
        assetTypeIds: raw.assetTypeIds,
        workTypeIds: raw.workTypeIds,
        values,
        pin: raw.pin,
        referenceValue: values.reference,
        audit: await Audit.toDomainModel(raw.audit)
      },
      raw.id
    ).getValue();
  }

  public static toPersistence(objective: Objective): IObjectiveMongoAttributes {
    return {
      id: objective.id,
      name: objective.name,
      targetType: objective.targetType,
      objectiveType: objective.objectiveType,
      requestorId: objective.requestorId,
      assetTypeIds: objective.assetTypeIds,
      workTypeIds: objective.workTypeIds,
      values: ObjectiveValues.toPersistence(objective.values),
      pin: objective.pin,
      audit: Audit.toPersistance(objective.audit)
    };
  }

  public get values(): ObjectiveValues {
    return this.props.values;
  }

  public updateValue(interventions: IEnrichedIntervention[], year: number, additionalCosts = 0): Result<Objective> {
    const updatedValueResult = this.calculateValue(interventions, year, additionalCosts);
    // recalculate objective value
    if (updatedValueResult.isFailure) {
      return Result.fail(updatedValueResult.errorValue());
    }
    this.values.setCalculated(updatedValueResult.getValue());
    return Result.ok(this);
  }

  public calculateValue(interventions: IEnrichedIntervention[], year: number, additionalCosts = 0): Result<number> {
    // Filter interventions matchingObjective
    const objectiveInterventions = interventions.filter(intervention => this.interventionMatchObjective(intervention));
    let calculatedValue = 0;
    switch (this.targetType) {
      case ProgramBookObjectiveTargetType.budget:
        const interventionsBudget = this.sumByPropertyByYearAnnualPeriod(
          objectiveInterventions,
          'annualAllowance',
          year
        );
        calculatedValue = interventionsBudget + additionalCosts;
        break;
      case ProgramBookObjectiveTargetType.length:
        calculatedValue = this.sumByPropertyByYearAnnualPeriod(objectiveInterventions, 'annualLength', year);
        break;
      default:
        return Result.fail(
          `Objective Target Type ${this.targetType} does not match known: ${enumValues(
            ProgramBookObjectiveTargetType
          ).join(',')}`
        );
    }
    return Result.ok(calculatedValue);
  }

  private sumByPropertyByYearAnnualPeriod(
    interventions: IEnrichedIntervention[],
    property: 'annualLength' | 'annualAllowance',
    year: number
  ): number {
    return sumBy(interventions, intervention => {
      const annualPeriod = intervention.annualDistribution.annualPeriods.find(ap => ap.year === year);
      return annualPeriod ? annualPeriod[property] : 0;
    });
  }

  private interventionMatchObjective(intervention: IEnrichedIntervention): boolean {
    // - All intervention must contains minimum 1 asset in the assets embeded array
    // - An intervention assets can have multiple typid
    const interventionAssetTypes = uniq(intervention?.assets?.map(el => el.typeId)) || [];
    interventionAssetTypes.some(el => this.assetTypeIds.includes(el));
    return (
      (!this.requestorId || intervention.requestorId === this.requestorId) &&
      (isEmpty(this.workTypeIds) || this.workTypeIds.includes(intervention.workTypeId)) &&
      (isEmpty(this.assetTypeIds) || interventionAssetTypes.some(el => this.assetTypeIds.includes(el)))
    );
  }
}
