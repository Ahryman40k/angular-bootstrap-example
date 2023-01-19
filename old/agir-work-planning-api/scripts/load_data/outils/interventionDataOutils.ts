import * as turf from '@turf/turf';
import {
  AssetType,
  BoroughCode,
  CommentCategory,
  IEnrichedIntervention,
  IGeometry,
  IInterventionDecision,
  InterventionStatus,
  InterventionType,
  IPlainIntervention,
  ITaxonomy,
  MedalType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';
import { LoremIpsum } from 'lorem-ipsum';
import * as mongoose from 'mongoose';
import * as request from 'superagent';

import { getAssetProps } from '../../../src/features/asset/tests/assetTestHelper';
import { LengthUnit } from '../../../src/features/length/models/length';
import { EXECUTOR_DI } from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { createAuthorMock } from '../../../tests/data/author.mocks';
import { getInterventionAreaGeometry, interventionDataAssetForTest } from '../../../tests/data/interventionData';
import { requestService } from '../../../tests/utils/requestService';
import { geobase } from './geobaseOutils';

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});

export function getCompletePlainIntervention(): IPlainIntervention {
  return {
    interventionName: 'interventionName',
    interventionTypeId: InterventionType.initialNeed,
    workTypeId: 'rehabilitation',
    requestorId: 'bell',
    executorId: EXECUTOR_DI,
    boroughId: 'VM',
    programId: 'pcpr',
    interventionYear: appUtils.getCurrentYear(),
    planificationYear: appUtils.getCurrentYear(),
    estimate: 10,
    contact: 'test',
    status: InterventionStatus.integrated,
    assets: [getAssetProps(interventionDataAssetForTest)],
    interventionArea: {
      isEdited: false,
      geometry: getInterventionAreaGeometry(),
      geometryPin: [-73.65454316139221, 45.52624830046475]
    },
    roadSections: {
      type: 'FeatureCollection',
      features: [
        {
          geometry: {
            type: 'LineString',
            coordinates: [
              [-73.553554, 45.49549],
              [-73.554326, 45.495778]
            ]
          },
          properties: {
            id: 1030565,
            name: 'rue Duke',
            fromName: 'rue Wellington',
            toName: 'rue De la commune',
            scanDirection: 1,
            classification: 0
          },
          type: 'Feature',
          id: 32670
        },
        {
          geometry: {
            type: 'LineString',
            coordinates: [
              [-73.55561256408691, 45.49636066013693],
              [-73.55552673339844, 45.49687204682633]
            ]
          },
          properties: {
            id: 1030565,
            name: 'rue Wellington',
            fromName: 'rue Prince',
            toName: 'rue Duke',
            scanDirection: 1,
            classification: 0
          },
          type: 'Feature',
          id: '32670'
        }
      ]
    },
    audit: {
      createdBy: createAuthorMock()
    }
  };
}

export function addProjectRequirement() {
  return {
    id: '5d83eb825907b06bbeda5e3c',
    typeId: 'coordinationWork',
    text: 'This is a requirement description'
  };
}

export function addInterventionRequirement() {
  return {
    id: '5d83eb825907b06bbeda5e3c',
    typeId: 'coordinationWork',
    text: 'This is a requirement description'
  };
}

export function getDecisionMock(partialDecision?: Partial<IInterventionDecision>): IInterventionDecision {
  const decision: IInterventionDecision = {
    id: '5d83eb825907b06bbeda5e3d',
    typeId: 'canceled',
    previousPlanificationYear: appUtils.getCurrentYear(),
    targetYear: appUtils.getCurrentYear() + 8,
    text: 'This is a decision comment',
    audit: {
      createdAt: Date.now().toString()
    }
  };
  Object.assign(decision, partialDecision);
  return decision;
}

/**
 * Creates a PlainIntervention with specified attribute to add variation
 * between created PlainIntervention
 * @param attributes attributes that exists in a PlainIntervention
 */
export function createInterventionModel(attributes: Partial<IPlainIntervention>): IPlainIntervention {
  const interventionModel: IPlainIntervention = getCompletePlainIntervention();
  Object.assign(interventionModel, attributes);
  return interventionModel;
}

/**
 * Creates a EnrichedIntervention with specified attribute to add variation
 * between created EnrichedIntervention
 * @param attributes attributes that exists in a EnrichedIntervention
 */
export function createEnrichedInterventionModel(attributes: Partial<IEnrichedIntervention>): IEnrichedIntervention {
  let interventionModel = getCompletePlainIntervention() as IEnrichedIntervention;
  interventionModel = addInterventionEnrichedProperties(interventionModel);
  Object.assign(interventionModel, attributes);
  return interventionModel;
}

function addInterventionEnrichedProperties(intervention: IEnrichedIntervention): IEnrichedIntervention {
  intervention.estimate = { allowance: 10, burnedDown: 0, balance: 0 };
  return intervention;
}

/**
 * Creates a list of EnrichedIntervention to insert for testing
 */
export function createEnrichedInterventionList(): IEnrichedIntervention[] {
  const list: IEnrichedIntervention[] = [];
  list.push(
    createEnrichedInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.waiting,
      comments: [
        {
          id: mongoose.Types.ObjectId().toHexString(),
          categoryId: CommentCategory.information,
          text: 'public comment',
          audit: {
            createdAt: new Date().toISOString(),
            createdBy: createAuthorMock()
          }
        },
        {
          id: mongoose.Types.ObjectId().toHexString(),
          categoryId: CommentCategory.information,
          text: 'private comment',
          isPublic: false,
          audit: {
            createdAt: new Date().toISOString(),
            createdBy: createAuthorMock()
          }
        }
      ]
    })
  );
  list.push(
    createEnrichedInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.waiting,
      estimate: { allowance: 2000, burnedDown: 0, balance: 2000 },
      medalId: MedalType.bronze
    })
  );
  list.push(
    createEnrichedInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.waiting,
      estimate: { allowance: 2050, burnedDown: 0, balance: 2000 },
      medalId: MedalType.bronze
    })
  );
  list.push(
    createEnrichedInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.integrated,
      estimate: { allowance: 2050, burnedDown: 0, balance: 2000 },
      medalId: MedalType.silver
    })
  );
  list.push(
    createEnrichedInterventionModel({
      boroughId: BoroughCode.VM,
      status: InterventionStatus.integrated,
      estimate: { allowance: 2550, burnedDown: 0, balance: 2000 },
      medalId: MedalType.silver
    })
  );
  list.push(
    createEnrichedInterventionModel({
      programId: 'pcpr',
      status: InterventionStatus.waiting,
      estimate: { allowance: 1990, burnedDown: 0, balance: 2000 },
      medalId: MedalType.gold
    })
  );
  list.push(
    createEnrichedInterventionModel({
      programId: 'prcpr',
      status: InterventionStatus.waiting,
      medalId: MedalType.gold
    })
  );
  list.push(
    createEnrichedInterventionModel({
      programId: 'par',
      status: InterventionStatus.waiting,
      medalId: MedalType.platinum
    })
  );
  list.push(createEnrichedInterventionModel({ status: InterventionStatus.waiting, medalId: MedalType.platinum }));
  return list;
}

/**
 * Creates a list of PlainIntervention to insert for testing
 */
export function createInterventionList(): IPlainIntervention[] {
  const list: IPlainIntervention[] = [];
  list.push(
    createInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.waiting
    })
  );
  list.push(createInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting, estimate: 2000 }));
  list.push(createInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting, estimate: 2050 }));
  list.push(createInterventionModel({ boroughId: 'SAME', status: InterventionStatus.integrated, estimate: 2500 }));
  list.push(
    createInterventionModel({ boroughId: BoroughCode.VM, status: InterventionStatus.integrated, estimate: 2550 })
  );
  list.push(createInterventionModel({ programId: 'pcpr', status: InterventionStatus.waiting, estimate: 1900 }));
  list.push(createInterventionModel({ programId: 'prcpr', status: InterventionStatus.waiting }));
  list.push(createInterventionModel({ programId: 'par', status: InterventionStatus.waiting }));
  list.push(createInterventionModel({ status: InterventionStatus.waiting }));
  return list;
}

/**
 * Creates a dynamic interventions list
 */
export function createDynamicInterventionList(objectNumber: number, listTaxonomies: ITaxonomy[]): IPlainIntervention[] {
  const listInterventionsType: ITaxonomy[] = listTaxonomies.filter(
    item => item.group === TaxonomyGroup.interventionType
  );
  const listWorkType: ITaxonomy[] = listTaxonomies.filter(item => item.group === TaxonomyGroup.workType);
  const listRequestor: ITaxonomy[] = listTaxonomies.filter(item => item.group === TaxonomyGroup.requestor);
  const listBorough: ITaxonomy[] = listTaxonomies.filter(item => item.group === TaxonomyGroup.borough);
  const listStatus: ITaxonomy[] = listTaxonomies.filter(item => item.group === TaxonomyGroup.interventionStatus);
  const listProgram: ITaxonomy[] = listTaxonomies.filter(item => item.group === TaxonomyGroup.programType);
  // TODO: create function to use available layers automatically
  const listTypeAsset: ITaxonomy[] = listTaxonomies.filter(
    item => item.group === TaxonomyGroup.assetType && item.code === AssetType.fireHydrant
  );
  const listOwnerAsset: ITaxonomy[] = listTaxonomies.filter(item => item.group === TaxonomyGroup.assetOwner);
  const list: IPlainIntervention[] = [];
  for (let i = 0; i < objectNumber; i++) {
    const randomGeometry = geobase.getRandomFeature();
    const intervention: IPlainIntervention = {
      interventionName: 'script-generation',
      interventionTypeId: _.sample(listInterventionsType).code,
      workTypeId: _.sample(listWorkType).code,
      requestorId: _.sample(listRequestor).code,
      executorId: EXECUTOR_DI,
      boroughId: _.sample(listBorough).code,
      status: _.sample(listStatus).code,
      interventionYear: Math.floor(Math.random() * 2) + 2020,
      planificationYear: Math.floor(Math.random() * 2) + 2020,
      estimate: Math.floor(Math.random() * 1000) + 90000,
      programId: _.sample(listProgram).code,
      contact: lorem.generateWords(2),
      assets: [
        {
          id: '' + (Math.floor(Math.random() * 8000) + 182000),
          typeId: _.sample(listTypeAsset).code,
          ownerId: _.sample(listOwnerAsset).code,
          length: {
            unit: LengthUnit.meter,
            value: 100
          },
          geometry: randomGeometry.geometry as IGeometry
        }
      ],
      interventionArea: {
        isEdited: false,
        geometry: turf.buffer(randomGeometry, 5, { units: 'meters' }).geometry as IGeometry
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            type: randomGeometry.type,
            geometry: randomGeometry.geometry as IGeometry,
            properties: randomGeometry.properties as {}
          }
        ]
      }
    };
    list.push(createInterventionModel(intervention));
  }
  return list;
}

export function createRandomGeometry() {
  return {} as IGeometry;
}

export function getInterventionsSearch(apiUrl: string, searchRequest: {} | string): Promise<request.Response> {
  return requestService.get(apiUrl, undefined, searchRequest);
}
