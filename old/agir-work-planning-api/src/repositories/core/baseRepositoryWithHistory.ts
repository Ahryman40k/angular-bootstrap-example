import { IHistory, IHistorySummary } from '@villemontreal/agir-work-planning-lib/dist/src';
import { get } from 'lodash';
import { Document } from 'mongoose';

import { constants, EntityType } from '../../../config/constants';
import { historyRepository, IHistoryOptions } from '../../features/history/mongo/historyRepository';
import { auditService } from '../../services/auditService';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { FindOptions, IFindOptionsProps } from '../../shared/findOptions/findOptions';
import { Result } from '../../shared/logic/result';
import { BaseRepository } from './baseRepository';

export abstract class BaseRepositoryWithHistory<
  T,
  Q extends Document,
  F extends FindOptions<IFindOptionsProps>
> extends BaseRepository<T, Q, F> {
  public async history(
    operation: 'create' | 'update' | 'delete',
    current: T,
    incoming: T,
    options?: IHistoryOptions
  ): Promise<void> {
    const entityType: EntityType = this.getHistoryEntityTypeByModelName(this.model.modelName);
    let op: string = operation;
    if (get(options, 'operation')) {
      op = options.operation;
    }
    await this.persistHistory(entityType, current, incoming, op, options);
  }

  protected async persistHistory(
    entityType: EntityType,
    currentEntity: T | any,
    newEntity: T | any,
    actionId: string,
    options?: IHistoryOptions
  ): Promise<IHistory> {
    const audit = auditService.buildAudit();

    const history: IHistory = {
      objectTypeId: entityType,
      referenceId: this.getObjectIdentifier(newEntity),
      actionId,
      summary: this.getSummary(currentEntity, newEntity, actionId, options),
      audit,
      categoryId: options?.categoryId
    } as IHistory;

    const saveHistoryResult = await historyRepository.save(history);
    if (saveHistoryResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveHistoryResult)));
    }
    return saveHistoryResult.getValue();
  }

  private getSummary(
    currentEntity: T | any,
    newEntity: T | any,
    actionId: string,
    options?: IHistoryOptions
  ): IHistorySummary {
    let statuses: any;
    if (!currentEntity) {
      statuses = { statusFrom: '', statusTo: newEntity.status };
    } else if (currentEntity.status !== newEntity.status && actionId !== constants.operation.DELETE) {
      statuses = { statusFrom: currentEntity.status, statusTo: newEntity.status };
    }
    const comments = options?.comments ? options?.comments : undefined;

    return {
      comments,
      ...statuses
    };
  }

  private getHistoryEntityTypeByModelName(modelName: string): EntityType {
    switch (modelName) {
      case constants.mongo.collectionNames.PROJECTS:
        return EntityType.project;
      case constants.mongo.collectionNames.INTERVENTIONS:
        return EntityType.intervention;
      default:
        return null;
    }
  }
}
