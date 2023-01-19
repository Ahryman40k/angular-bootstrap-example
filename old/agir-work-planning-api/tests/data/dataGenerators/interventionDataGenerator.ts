import {
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionDecision,
  IPlainIntervention
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';

import { getDecisionMock } from '../../../scripts/load_data/outils/interventionDataOutils';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { interventionAnnualDistributionService } from '../../../src/services/annualDistribution/interventionAnnualDistributionService';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { createEnrichedIntervention, getPlainIntervention, interventionEnrichedToPlain } from '../interventionData';
import { IDataGenerator } from './_dataGenerator';

class InterventionDataGenerator implements IDataGenerator<IEnrichedIntervention, IPlainIntervention> {
  public createEnriched(partial?: Partial<IEnrichedIntervention>): IEnrichedIntervention {
    return createEnrichedIntervention(partial);
  }

  public createPlain(partial?: Partial<IPlainIntervention>): IPlainIntervention {
    return _.merge(getPlainIntervention(), partial);
  }

  public async store(
    partial?: Partial<IEnrichedIntervention>,
    project?: IEnrichedProject
  ): Promise<IEnrichedIntervention> {
    let intervention = this.createEnriched(partial);
    delete intervention.id;

    if (project) {
      interventionAnnualDistributionService.generateAnnualPeriodFromProjectAnnualPeriods(
        [intervention],
        project.annualDistribution.annualPeriods
      );
      interventionAnnualDistributionService.createDistributionSummary([intervention]);
      intervention.project = { id: project.id };
    }

    intervention = (await interventionRepository.save(intervention)).getValue();

    if (project) {
      if (!project.interventionIds) project.interventionIds = [];
      project.interventionIds.push(intervention.id);
      await projectRepository.save(project);
    }

    return intervention;
  }

  public async update(
    intervention: IEnrichedIntervention,
    partial?: Partial<IEnrichedIntervention>,
    project?: IEnrichedProject
  ): Promise<IEnrichedIntervention> {
    const enriched = Object.assign(intervention, partial);
    if (project) {
      interventionAnnualDistributionService.generateAnnualPeriodFromProjectAnnualPeriods(
        [enriched],
        project.annualDistribution.annualPeriods
      );
      interventionAnnualDistributionService.createDistributionSummary([enriched]);
    }
    const interventionSaveResult = await interventionRepository.save(enriched);
    if (interventionSaveResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult)));
    }
    return interventionSaveResult.getValue();
  }

  public createPlainFromEnriched(enriched: IEnrichedIntervention): IPlainIntervention {
    return interventionEnrichedToPlain(enriched);
  }

  public getMockDecision(decision: Partial<IInterventionDecision>) {
    return getDecisionMock(decision);
  }
}

export const interventionDataGenerator = new InterventionDataGenerator();
