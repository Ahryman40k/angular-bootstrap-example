import * as _ from 'lodash';

import { configs } from '../../../../config/configs';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { plugin } from '../../../repositories/plugins/history/mongooseDiffHistory';
import { createLogger } from '../../../utils/logger';
import { AnnualProgramModel, annualProgramModelFactory } from '../../annualPrograms/mongo/annualProgramModel';
import { CounterModel, counterModelFactory } from '../../counters/mongo/counterModel';
import { HistoryModel, historyModelFactory } from '../../history/mongo/historyModel';
import { NexoImportLogModel, nexoImportLogModelFactory } from '../../importNexo/mongo/nexoImportLogModel';
import { BicImportLogModel, bicImportLogsModelFactory } from '../../imports/mongo/bicImportLogModel';
import { ImportRelationModel, importRelationModelFactory } from '../../imports/mongo/importRelationModel';
import { InterventionModel, interventionModelFactory } from '../../interventions/mongo/interventionModel';
import {
  OpportunityNoticeModel,
  opportunityNoticeModelFactory
} from '../../opportunityNotices/mongo/opportunityNoticeModel';
import { ProgramBookModel, programBookModelFactory } from '../../programBooks/mongo/programBookModel';
import { ProjectModel, projectModelFactory } from '../../projects/mongo/projectModel';
import { RequirementModel, requirementModelFactory } from '../../requirements/mongo/requirementModel';
import { RtuExportLogModel, rtuExportLogModelFactory } from '../../rtu/mongo/rtuExportLogModel';
import { RtuImportLogModel, rtuImportLogModelFactory } from '../../rtu/mongo/rtuImportLogModel';
import { RtuProjectModel, rtuProjectModelFactory } from '../../rtu/mongo/rtuProjectModel';
import { SubmissionModel, submissionModelFactory } from '../../submissions/mongo/submissionModel';
import { TaxonomyModel, taxonomyModelFactory } from '../../taxonomies/mongo/taxonomyModel';
import { UserPreferenceModel, userPreferencesModelFactory } from '../../users/mongo/userPreferenceModel';
import { Database } from '../database';
import { MongoClient } from './mongoClient';

const logger = createLogger('MongoDatabase');

export interface IModels {
  Project: ProjectModel;
  Intervention: InterventionModel;
  Taxonomy: TaxonomyModel;
  AnnualProgram: AnnualProgramModel;
  History: HistoryModel;
  ProgramBook: ProgramBookModel;
  UserPreference: UserPreferenceModel;
  ImportRelation: ImportRelationModel;
  BicImportLog: BicImportLogModel;
  OpportunityNotice: OpportunityNoticeModel;
  NexoImportLog: NexoImportLogModel;
  Requirement: RequirementModel;
  RtuImportLog: RtuImportLogModel;
  RtuProject: RtuProjectModel;
  RtuExportLog: RtuExportLogModel;
  Counters: CounterModel;
  Submission: SubmissionModel;
}

export class MongoDatabase extends Database<MongoClient> {
  private static instanceMongo: MongoDatabase;

  private constructor() {
    super();
  }
  /**
   * Singleton
   */
  static get instance(): MongoDatabase {
    if (!this.instanceMongo) {
      this.instanceMongo = new MongoDatabase();
    }
    return this.instanceMongo;
  }
  /**
   * Initializes connection
   */
  public async init(): Promise<void> {
    logger.info(`Init Mongo Database`);
    this._client = new MongoClient();
    await this._client.openConnection();
    this.initModels();
    if (!configs.testingMode) {
      this.initDiffHistory();
    }
    logger.info(`Mongo Database ready`);
  }

  public get models(): IModels {
    return this._models as IModels;
  }

  protected initModels() {
    const mongoConnection = (this.client as MongoClient).getConnection();
    this._models = {
      Project: projectModelFactory(mongoConnection),
      Intervention: interventionModelFactory(mongoConnection),
      Taxonomy: taxonomyModelFactory(mongoConnection),
      AnnualProgram: annualProgramModelFactory(mongoConnection),
      History: historyModelFactory(mongoConnection),
      ProgramBook: programBookModelFactory(mongoConnection),
      UserPreference: userPreferencesModelFactory(mongoConnection),
      ImportRelation: importRelationModelFactory(mongoConnection),
      BicImportLog: bicImportLogsModelFactory(mongoConnection),
      OpportunityNotice: opportunityNoticeModelFactory(mongoConnection),
      NexoImportLog: nexoImportLogModelFactory(mongoConnection),
      Requirement: requirementModelFactory(mongoConnection),
      RtuImportLog: rtuImportLogModelFactory(mongoConnection),
      RtuProject: rtuProjectModelFactory(mongoConnection),
      RtuExportLog: rtuExportLogModelFactory(mongoConnection),
      Counters: counterModelFactory(mongoConnection),
      Submission: submissionModelFactory(mongoConnection)
    };
  }

  private initDiffHistory() {
    const modelsWithDiffHistory = ['Project', 'Intervention', 'Taxonomy', 'AnnualProgram', 'Constraint', 'ProgramBook'];
    modelsWithDiffHistory.forEach(modelName => {
      const model: CustomModel<any> = _.get(this.models, modelName);
      if (model && model.schema) {
        model.schema.plugin(plugin);
      }
    });
  }
}
export const mongoDatabase = MongoDatabase.instance;
