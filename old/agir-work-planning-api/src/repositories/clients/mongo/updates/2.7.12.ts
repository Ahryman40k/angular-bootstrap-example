import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { LengthUnit } from '../../../../features/length/models/length';
import { TaxonomyModel } from '../../../../features/taxonomies/mongo/taxonomyModel';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.12');
let taxonomiesCollection: MongoDb.Collection;

interface IAssetDataKeyProperties {
  assetKey: string;
  geomaticKey: string;
  unit?: string;
}

interface IAssetDataKeyTaxonomy extends ITaxonomy {
  properties?: IAssetDataKeyProperties;
}

/**
 * For V2.7.12 we need to modify the taxonomy group assetType
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await insertTaxonomies(getNewAssetTypeTaxonomies());
  await insertTaxonomies(getAssetDataKeyTaxonomies());
  await upsertAssetTypeTaxonomies(await getModifiedAssetTypeTaxonomies());

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.12 executed in ${milliseconds} milliseconds`);
}

async function upsertAssetTypeTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Upsert in taxonomies collection`);
  try {
    for (const taxonomy of taxonomies) {
      await taxonomiesCollection.updateOne(
        { group: taxonomy.group, code: taxonomy.code },
        {
          $set: {
            'properties.dataKeys': taxonomy.properties.dataKeys
          }
        },
        { upsert: true }
      );
    }
  } catch (e) {
    logger.error(`Taxonomies update datakeys -> ${e}`);
  }
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  try {
    const insertResults = await taxonomiesCollection.insertMany(taxonomies);
    logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
  } catch (e) {
    logger.info(`Insert taxonomies error -> ${e}`);
  }
}

// tslint:disable-next-line: max-func-body-length
export async function getModifiedAssetTypeTaxonomies(taxonomyModel?: TaxonomyModel): Promise<ITaxonomy[]> {
  const taxonomies: ITaxonomy[] = [];
  let assetTypes: ITaxonomy[];
  if (taxonomyModel) {
    assetTypes = await taxonomyModel.find({ group: TaxonomyGroup.assetType }).exec();
  } else {
    assetTypes = await taxonomiesCollection.find({ group: TaxonomyGroup.assetType }).toArray();
  }
  const mappings: {
    code: string;
    isMainAttribute: boolean;
    assetCode: string;
  }[] = [
    {
      code: 'code',
      assetCode: 'busStop',
      isMainAttribute: true
    },
    {
      code: 'description',
      assetCode: 'busStop',
      isMainAttribute: true
    },
    {
      code: 'lines',
      assetCode: 'busStop',
      isMainAttribute: true
    },
    {
      code: 'noPark',
      assetCode: 'electricalTerminal',
      isMainAttribute: true
    },
    {
      code: 'noSite',
      assetCode: 'electricalTerminal',
      isMainAttribute: true
    },
    {
      code: 'borough',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'numberOfTerminals',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'location',
      assetCode: 'electricalTerminal',
      isMainAttribute: true
    },
    {
      code: 'pricing',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'serialNumber',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'serialNumberTerminal1',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'serialNumberTerminal2',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'program',
      assetCode: 'electricalTerminal',
      isMainAttribute: true
    },
    {
      code: 'installationDate',
      assetCode: 'electricalTerminal',
      isMainAttribute: true
    },
    {
      code: 'operationalDate',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'place',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'address',
      assetCode: 'electricalTerminal',
      isMainAttribute: true
    },
    {
      code: 'postalCode',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'longitude',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'boroughRM',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'provenanceGivenR',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'versionDateR',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'latitude',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'hierarchy',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'paPost',
      assetCode: 'electricalTerminal',
      isMainAttribute: false
    },
    {
      code: 'refUse',
      assetCode: 'roadway',
      isMainAttribute: true
    },
    {
      code: 'refRoadwayMaterial',
      assetCode: 'roadway',
      isMainAttribute: true
    },
    {
      code: 'refFoundationType',
      assetCode: 'roadway',
      isMainAttribute: true
    },
    {
      code: 'constructionDate',
      assetCode: 'roadway',
      isMainAttribute: true
    },
    {
      code: 'contructionDateRef',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'areaM2',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'estimatedLength',
      assetCode: 'roadway',
      isMainAttribute: true
    },
    {
      code: 'estimatedWidth',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'thmGeo',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'positionR',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'startDate',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'endDate',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'sectionId',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'jmapId',
      assetCode: 'roadway',
      isMainAttribute: false
    },
    {
      code: 'intersectionType',
      assetCode: 'roadway-intersection',
      isMainAttribute: true
    },
    {
      code: 'intersectionMaterial',
      assetCode: 'roadway-intersection',
      isMainAttribute: true
    },
    {
      code: 'refFoundationType',
      assetCode: 'roadway-intersection',
      isMainAttribute: false
    },
    {
      code: 'constructionDate',
      assetCode: 'roadway-intersection',
      isMainAttribute: true
    },
    {
      code: 'contructionDateRef',
      assetCode: 'roadway-intersection',
      isMainAttribute: false
    },
    {
      code: 'areaM2',
      assetCode: 'roadway-intersection',
      isMainAttribute: true
    },
    {
      code: 'thmGeo',
      assetCode: 'roadway-intersection',
      isMainAttribute: false
    },
    {
      code: 'startDate',
      assetCode: 'roadway-intersection',
      isMainAttribute: false
    },
    {
      code: 'endDate',
      assetCode: 'roadway-intersection',
      isMainAttribute: false
    },
    {
      code: 'jmapId',
      assetCode: 'intLogical',
      isMainAttribute: false
    },
    {
      code: 'no',
      assetCode: 'intLogical',
      isMainAttribute: true
    },
    {
      code: 'name',
      assetCode: 'intLogical',
      isMainAttribute: true
    },
    {
      code: 'intRef',
      assetCode: 'intLogical',
      isMainAttribute: false
    },
    {
      code: 'intMaster',
      assetCode: 'intLogical',
      isMainAttribute: false
    },
    {
      code: 'controller',
      assetCode: 'intLogical',
      isMainAttribute: false
    },
    {
      code: 'nameValue',
      assetCode: 'intLogical',
      isMainAttribute: true
    },
    {
      code: 'x',
      assetCode: 'intLogical',
      isMainAttribute: false
    },
    {
      code: 'y',
      assetCode: 'intLogical',
      isMainAttribute: false
    },
    {
      code: 'material',
      assetCode: 'gas',
      isMainAttribute: true
    },
    {
      code: 'pressureClass',
      assetCode: 'gas',
      isMainAttribute: false
    },
    {
      code: 'installationDate',
      assetCode: 'gas',
      isMainAttribute: true
    },
    {
      code: 'diameterM',
      assetCode: 'gas',
      isMainAttribute: false
    },
    {
      code: 'line',
      assetCode: 'hqLine',
      isMainAttribute: true
    },
    {
      code: 'type',
      assetCode: 'hqLine',
      isMainAttribute: true
    },
    {
      code: 'topNumber',
      assetCode: 'hqLine',
      isMainAttribute: false
    },
    {
      code: 'state',
      assetCode: 'hqLine',
      isMainAttribute: true
    },
    {
      code: 'ciOwner',
      assetCode: 'hqLine',
      isMainAttribute: false
    },
    {
      code: 'voltageExp',
      assetCode: 'hqLine',
      isMainAttribute: true
    },
    {
      code: 'version',
      assetCode: 'hqLine',
      isMainAttribute: false
    },
    {
      code: 'toponym',
      assetCode: 'hqSubstation',
      isMainAttribute: true
    },
    {
      code: 'voltage',
      assetCode: 'hqSubstation',
      isMainAttribute: true
    },
    {
      code: 'state',
      assetCode: 'hqSubstation',
      isMainAttribute: true
    },
    {
      code: 'source',
      assetCode: 'hqSubstation',
      isMainAttribute: true
    },
    {
      code: 'version',
      assetCode: 'hqSubstation',
      isMainAttribute: false
    },
    {
      code: 'address',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'networkClassification',
      assetCode: 'aqueductSegment',
      isMainAttribute: true
    },
    {
      code: 'abandonmentDate',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'installationDate',
      assetCode: 'aqueductSegment',
      isMainAttribute: true
    },
    {
      code: 'sectionHierarchy',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'jurisdiction',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'noAsset',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'noRegulationSector',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'tankName',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'owner',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'operationalManager',
      assetCode: 'aqueductSegment',
      isMainAttribute: true
    },
    {
      code: 'assetPositionStatus',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'proposalStatus',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'assetStatus',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'territory',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'rehabilitationDate',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'diameter',
      assetCode: 'aqueductSegment',
      isMainAttribute: true
    },
    {
      code: 'idGcaf',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'length',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'aqueductSegmentMaterial',
      assetCode: 'aqueductSegment',
      isMainAttribute: true
    },
    {
      code: 'noChambreSurPlanCle',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'aqueductRehabilitationType',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'aqueductSegmentType',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'noGeobaseSection',
      assetCode: 'aqueductSegment',
      isMainAttribute: true
    },
    {
      code: 'installationYear',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'rehabilitationYear',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'serviceStatus',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'operationalState',
      assetCode: 'aqueductSegment',
      isMainAttribute: false
    },
    {
      code: 'address',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'networkClassification',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: true
    },
    {
      code: 'abandonmentDate',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'installationDate',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: true
    },
    {
      code: 'sectionHierarchy',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'jurisdiction',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'noAsset',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'noRegulationSector',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'tankName',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'owner',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'operationalManager',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: true
    },
    {
      code: 'assetPositionStatus',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'proposalStatus',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'assetStatus',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'territory',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'rehabilitationDate',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'diameter',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: true
    },
    {
      code: 'idGcaf',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'length',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'aqueductSegmentMaterial',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: true
    },
    {
      code: 'noChambreSurPlanCle',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'aqueductRehabilitationType',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'aqueductSegmentType',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'noGeobaseSection',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: true
    },
    {
      code: 'installationYear',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'rehabilitationYear',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'serviceStatus',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'operationalState',
      assetCode: 'aqueductEntranceSegment',
      isMainAttribute: false
    },
    {
      code: 'address',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'networkClassification',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: true
    },
    {
      code: 'abandonmentDate',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'installationDate',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: true
    },
    {
      code: 'sectionHierarchy',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'jurisdiction',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'noAsset',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'noRegulationSector',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'tankName',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'owner',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'operationalManager',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'assetPositionStatus',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'proposalStatus',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'assetStatus',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'territory',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'isAssetRehabilitated',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberDiameter',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'activeDrainage',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberShape',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'idGcaf',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberWidth',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberLength',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'aqueductChamberMaterial',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'noRegulationChamber',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'noChambreSurPlanCle',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'noPlanContratTec',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'drainValvePresence',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'depth',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberType',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: true
    },
    {
      code: 'noGeobaseSection',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'serviceStatus',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'operationalState',
      assetCode: 'aqueductValveChamber',
      isMainAttribute: false
    },
    {
      code: 'address',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'networkClassification',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: true
    },
    {
      code: 'spatialCoordinateX',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'spatialCoordinateY',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'abandonmentDate',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'installationDate',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: true
    },
    {
      code: 'sectionHierarchy',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'jurisdiction',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'noAsset',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'noRegulationSector',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'tankName',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'owner',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'operationalManager',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'assetPositionStatus',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'proposalStatus',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'assetStatus',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'territory',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'compartment',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'diameter',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'function',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'idGcaf',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'valveBrand',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'valveMechanism',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'numberOfHandlingTurns',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'valveOrientation',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'currentPosition',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'normalPosition',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'depth',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'closingDirection',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'boundaryValve',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'noGeobaseSection',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'valveBorough',
      assetCode: 'waterServiceEntrance',
      isMainAttribute: false
    },
    {
      code: 'address',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'networkClassification',
      assetCode: 'sewerSegment',
      isMainAttribute: true
    },
    {
      code: 'abandonmentDate',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'installationDate',
      assetCode: 'sewerSegment',
      isMainAttribute: true
    },
    {
      code: 'sectionHierarchy',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'jurisdiction',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'owner',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'operationalManager',
      assetCode: 'sewerSegment',
      isMainAttribute: true
    },
    {
      code: 'proposalStatus',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'assetStatus',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'territory',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'sewerResistanceClass',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'rehabilitationDate',
      assetCode: 'sewerSegment',
      isMainAttribute: true
    },
    {
      code: 'horizontalDiameter',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'verticalDiameter',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'pipeForm',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'sewerSegmentMaterial',
      assetCode: 'sewerSegment',
      isMainAttribute: true
    },
    {
      code: 'flowDirection',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'flowType',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'sewerRehabilitationType',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'networkType',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'sewerSegmentType',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'noAsset',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'watershed',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'idGcaf',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'length',
      assetCode: 'sewerSegment',
      isMainAttribute: true
    },
    {
      code: 'noPipePi',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'upstreamDepth',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'downstreamDepth',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'noGeobaseSection',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'serviceStatus',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'operationalState',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'installationYear',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'rehabilitationYear',
      assetCode: 'sewerSegment',
      isMainAttribute: false
    },
    {
      code: 'address',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'networkClassification',
      assetCode: 'sewerChamber',
      isMainAttribute: true
    },
    {
      code: 'abandonmentDate',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'installationDate',
      assetCode: 'sewerChamber',
      isMainAttribute: true
    },
    {
      code: 'sectionHierarchy',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'jurisdiction',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'noAsset',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'owner',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'operationalManager',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'proposalStatus',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'assetStatus',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'territory',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'isAssetRehabilitated',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'watershed',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'coverDimension',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberShape',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'chimneyShape',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'idGcaf',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberWidth',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'chamberLength',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'sewerChamberMaterial',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'noChamberDeeu',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'depth',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'sewerChamberType',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'noGeobaseSection',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'serviceStatus',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'operationalState',
      assetCode: 'sewerChamber',
      isMainAttribute: false
    },
    {
      code: 'line',
      assetCode: 'pylon',
      isMainAttribute: true
    },
    {
      code: 'support',
      assetCode: 'pylon',
      isMainAttribute: false
    },
    {
      code: 'silhouets',
      assetCode: 'pylon',
      isMainAttribute: false
    },
    {
      code: 'proprioSup',
      assetCode: 'pylon',
      isMainAttribute: false
    },
    {
      code: 'precision',
      assetCode: 'pylon',
      isMainAttribute: false
    },
    {
      code: 'source',
      assetCode: 'pylon',
      isMainAttribute: false
    },
    {
      code: 'jmapId',
      assetCode: 'unifiedSection',
      isMainAttribute: false
    },
    {
      code: 'labelMap2016',
      assetCode: 'unifiedSection',
      isMainAttribute: false
    },
    {
      code: 'legendMap2016',
      assetCode: 'unifiedSection',
      isMainAttribute: false
    },
    {
      code: 'boroughPi',
      assetCode: 'unifiedSection',
      isMainAttribute: false
    },
    {
      code: 'size',
      assetCode: 'unifiedSection',
      isMainAttribute: true
    },
    {
      code: 'hypReport',
      assetCode: 'unifiedSection',
      isMainAttribute: false
    },
    {
      code: 'hypTable',
      assetCode: 'unifiedSection',
      isMainAttribute: false
    },
    {
      code: 'hypMap',
      assetCode: 'unifiedSection',
      isMainAttribute: false
    },
    {
      code: 'sidewalkCategory',
      assetCode: 'sidewalk',
      isMainAttribute: true
    },
    {
      code: 'sidewalkMaterial',
      assetCode: 'sidewalk',
      isMainAttribute: true
    },
    {
      code: 'edgeMaterial',
      assetCode: 'sidewalk',
      isMainAttribute: true
    },
    {
      code: 'inserMaterial',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'constructionDate',
      assetCode: 'sidewalk',
      isMainAttribute: true
    },
    {
      code: 'contructDateRef',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'areaM2',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'estimatedLength',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'estimatedWidth',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'thmGeo',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'startDate',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'endDate',
      assetCode: 'sidewalk',
      isMainAttribute: false
    },
    {
      code: 'startDate',
      assetCode: 'lineUndercutPark',
      isMainAttribute: true
    },
    {
      code: 'material',
      assetCode: 'lineUndercutPark',
      isMainAttribute: false
    },
    {
      code: 'usage',
      assetCode: 'lineUndercutPark',
      isMainAttribute: false
    },
    {
      code: 'parkName',
      assetCode: 'lineUndercutPark',
      isMainAttribute: true
    },
    {
      code: 'startDate',
      assetCode: 'polygonUndercutPark',
      isMainAttribute: true
    },
    {
      code: 'material',
      assetCode: 'polygonUndercutPark',
      isMainAttribute: false
    },
    {
      code: 'usage',
      assetCode: 'polygonUndercutPark',
      isMainAttribute: false
    },
    {
      code: 'parkName',
      assetCode: 'polygonUndercutPark',
      isMainAttribute: true
    },
    {
      code: 'parkId',
      assetCode: 'park',
      isMainAttribute: false
    },
    {
      code: 'type',
      assetCode: 'park',
      isMainAttribute: true
    },
    {
      code: 'parkName',
      assetCode: 'park',
      isMainAttribute: true
    },
    {
      code: 'boroughName',
      assetCode: 'park',
      isMainAttribute: true
    },
    {
      code: 'areaHa',
      assetCode: 'park',
      isMainAttribute: false
    },
    {
      code: 'roadwayIslandType',
      assetCode: 'roadway-islands',
      isMainAttribute: false
    },
    {
      code: 'roadwayIslandMaterial',
      assetCode: 'roadway-islands',
      isMainAttribute: true
    },
    {
      code: 'edgeMaterial',
      assetCode: 'roadway-islands',
      isMainAttribute: false
    },
    {
      code: 'inserRoadwayIslandMaterial',
      assetCode: 'roadway-islands',
      isMainAttribute: false
    },
    {
      code: 'constructionDate',
      assetCode: 'roadway-islands',
      isMainAttribute: true
    },
    {
      code: 'contructionDateRef',
      assetCode: 'roadway-islands',
      isMainAttribute: false
    },
    {
      code: 'areaM2',
      assetCode: 'roadway-islands',
      isMainAttribute: true
    },
    {
      code: 'thmGeo',
      assetCode: 'roadway-islands',
      isMainAttribute: false
    },
    {
      code: 'startDate',
      assetCode: 'roadway-islands',
      isMainAttribute: false
    },
    {
      code: 'endDate',
      assetCode: 'roadway-islands',
      isMainAttribute: false
    },
    {
      code: 'station',
      assetCode: 'metroStation',
      isMainAttribute: true
    },
    {
      code: 'name',
      assetCode: 'metroStation',
      isMainAttribute: false
    },
    {
      code: 'url',
      assetCode: 'metroStation',
      isMainAttribute: false
    },
    {
      code: 'trackType',
      assetCode: 'bikePath',
      isMainAttribute: true
    },
    {
      code: 'jmapId',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'objectId',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'placeName',
      assetCode: 'chuteEgout',
      isMainAttribute: true
    },
    {
      code: 'snowId',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'descPlace',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'streetName',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'fullAddress',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'pointX',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'pointY',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'municipalityName',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'aliasName',
      assetCode: 'chuteEgout',
      isMainAttribute: false
    },
    {
      code: 'streetLampId',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'relayId',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'lampGoogleStreetUrl',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'lampPlaqueTransitionR',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'lampPriseCourantR',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'lampPriseSonR',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'lampHautParleurR',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'lampProjecteurR',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'futNumeroRac',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'futDateInstall',
      assetCode: 'barrel',
      isMainAttribute: true
    },
    {
      code: 'futMateriauR',
      assetCode: 'barrel',
      isMainAttribute: true
    },
    {
      code: 'futFinitionR',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'futDateFinition',
      assetCode: 'barrel',
      isMainAttribute: false
    },
    {
      code: 'futTypeR',
      assetCode: 'barrel',
      isMainAttribute: false
    }
  ];

  for (const assetType of assetTypes) {
    const taxonomy = _.cloneDeep(assetType);
    const codeMaps = mappings.filter(item => item.assetCode === assetType.code);
    let count = 1;
    let dataKeys;

    if (codeMaps.length) {
      dataKeys = codeMaps.map(item => {
        const object = {
          code: item.code,
          isMainAttribute: item.isMainAttribute,
          displayOrder: count
        };
        count++;
        return object;
      });
    } else if (assetType.properties.dataKeys) {
      dataKeys = assetType.properties.dataKeys.map((item: string | object) => {
        let object: object;
        if (_.isString(item)) {
          object = {
            code: item,
            isMainAttribute: false,
            displayOrder: count
          };
        } else {
          object = item;
        }
        count++;
        return object;
      });
    }
    taxonomy.properties.dataKeys = dataKeys;
    taxonomies.push(taxonomy);
  }
  return taxonomies;
}

function getNewAssetTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'assetType',
      code: 'barrel',
      label: {
        fr: 'Fût',
        en: 'Barrel'
      },
      properties: {
        idKey: 'id',
        namespace: 'secured',
        owners: ['publicWorksRoad'],
        sourcesLayerId: 'futs',
        workTypes: ['undefined'],
        dataKeys: ['installationDate', 'inspectionDate'],
        consultationOnly: true
      }
    },
    {
      group: 'assetType',
      code: 'chuteEgout',
      label: {
        fr: "Chute à l'égout",
        en: "Chute à l'égout"
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['dre'],
        sourcesLayerId: 'chute-a-egout',
        workTypes: ['undefined'],
        dataKeys: ['installationDate', 'inspectionDate'],
        consultationOnly: false
      }
    }
  ];
}

// tslint:disable-next-line: max-func-body-length
function getAssetDataKeyTaxonomies(): IAssetDataKeyTaxonomy[] {
  return [
    {
      code: 'code',
      group: 'assetDataKey',
      label: {
        fr: 'Code',
        en: 'Code'
      },
      properties: {
        geomaticKey: 'code',
        assetKey: 'code'
      }
    },
    {
      code: 'lines',
      group: 'assetDataKey',
      label: {
        fr: 'Lignes',
        en: 'Lines'
      },
      properties: {
        geomaticKey: 'lignes',
        assetKey: 'lines'
      }
    },
    {
      code: 'description',
      group: 'assetDataKey',
      label: {
        fr: 'Descriptif',
        en: 'Description'
      },
      properties: {
        geomaticKey: 'descriptif',
        assetKey: 'description'
      }
    },
    {
      code: 'sectionHierarchy',
      group: 'assetDataKey',
      label: {
        fr: 'Hiérarchie du tronçon',
        en: 'Section hierarchy'
      },
      properties: {
        geomaticKey: 'hierarchieTroncon',
        assetKey: 'sectionHierarchy'
      }
    },
    {
      code: 'noAsset',
      group: 'assetDataKey',
      label: {
        fr: 'No actif',
        en: 'Asset No'
      },
      properties: {
        geomaticKey: 'noActif',
        assetKey: 'noAsset'
      }
    },
    {
      code: 'noRegulationSector',
      group: 'assetDataKey',
      label: {
        fr: 'Secteur',
        en: 'Sector'
      },
      properties: {
        geomaticKey: 'noSecteurRegulation',
        assetKey: 'noRegulationSector'
      }
    },
    {
      code: 'tankName',
      group: 'assetDataKey',
      label: {
        fr: 'Nom du réservoir',
        en: 'Tank name'
      },
      properties: {
        geomaticKey: 'nomReservoir',
        assetKey: 'tankName'
      }
    },
    {
      code: 'owner',
      group: 'assetDataKey',
      label: {
        fr: 'Propriétaire',
        en: 'Owner'
      },
      properties: {
        geomaticKey: 'proprietaire',
        assetKey: 'owner'
      }
    },
    {
      code: 'assetPositionStatus',
      group: 'assetDataKey',
      label: {
        fr: "Statut de la position de l'actif",
        en: 'Asset position status'
      },
      properties: {
        geomaticKey: 'statutPositionActif',
        assetKey: 'assetPositionStatus'
      }
    },
    {
      code: 'proposalStatus',
      group: 'assetDataKey',
      label: {
        fr: 'Statut de la proposition',
        en: 'Proposal status'
      },
      properties: {
        geomaticKey: 'statutProposition',
        assetKey: 'proposalStatus'
      }
    },
    {
      code: 'assetStatus',
      group: 'assetDataKey',
      label: {
        fr: "Statut de l'actif",
        en: 'Asset status'
      },
      properties: {
        geomaticKey: 'statutActif',
        assetKey: 'assetStatus'
      }
    },
    {
      code: 'territory',
      group: 'assetDataKey',
      label: {
        fr: 'Territoire',
        en: 'Territory'
      },
      properties: {
        geomaticKey: 'territoire',
        assetKey: 'territory'
      }
    },
    {
      code: 'idGcaf',
      group: 'assetDataKey',
      label: {
        fr: 'ID Gcaf',
        en: 'ID Gcaf'
      },
      properties: {
        geomaticKey: 'idGcaf',
        assetKey: 'idGcaf'
      }
    },
    {
      code: 'noGeobaseSection',
      group: 'assetDataKey',
      label: {
        fr: 'ID du tronçon',
        en: 'Section ID'
      },
      properties: {
        geomaticKey: 'noTronconGeobase',
        assetKey: 'noGeobaseSection'
      }
    },
    {
      code: 'refUse',
      group: 'assetDataKey',
      label: {
        fr: 'Utilisation référence',
        en: 'Reference use'
      },
      properties: {
        geomaticKey: 'utilisationRef',
        assetKey: 'refUse'
      }
    },
    {
      code: 'refRoadwayMaterial',
      group: 'assetDataKey',
      label: {
        fr: 'Matériau de la chaussée',
        en: 'Roadway material'
      },
      properties: {
        geomaticKey: 'materiauChausseeRef',
        assetKey: 'refRoadwayMaterial'
      }
    },
    {
      code: 'refFoundationType',
      group: 'assetDataKey',
      label: {
        fr: 'Type de fondation',
        en: 'Foundation type'
      },
      properties: {
        geomaticKey: 'typeFondationRef',
        assetKey: 'refFoundationType'
      }
    },
    {
      code: 'no',
      group: 'assetDataKey',
      label: {
        fr: 'No',
        en: 'No'
      },
      properties: {
        geomaticKey: 'no',
        assetKey: 'no'
      }
    },
    {
      code: 'name',
      group: 'assetDataKey',
      label: {
        fr: 'Nom',
        en: 'Name'
      },
      properties: {
        geomaticKey: 'nom',
        assetKey: 'name'
      }
    },
    {
      code: 'nameValue',
      group: 'assetDataKey',
      label: {
        fr: 'Nom',
        en: 'Name'
      },
      properties: {
        geomaticKey: 'nomValeur',
        assetKey: 'nameValue'
      }
    },
    {
      code: 'line',
      group: 'assetDataKey',
      label: {
        fr: 'Ligne',
        en: 'Line'
      },
      properties: {
        geomaticKey: 'ligne',
        assetKey: 'line'
      }
    },
    {
      code: 'type',
      group: 'assetDataKey',
      label: {
        fr: 'Type',
        en: 'Type'
      },
      properties: {
        geomaticKey: 'type',
        assetKey: 'type'
      }
    },
    {
      code: 'state',
      group: 'assetDataKey',
      label: {
        fr: 'Etat',
        en: 'State'
      },
      properties: {
        geomaticKey: 'etat',
        assetKey: 'state'
      }
    },
    {
      code: 'contructionDateRef',
      group: 'assetDataKey',
      label: {
        fr: 'Date de construction',
        en: 'Construction date'
      },
      properties: {
        geomaticKey: 'dateConstructPrecRef',
        assetKey: 'contructionDateRef'
      }
    },
    {
      code: 'thmGeo',
      group: 'assetDataKey',
      label: {
        fr: 'ThmGéo',
        en: 'ThmGeo'
      },
      properties: {
        geomaticKey: 'thmGeo',
        assetKey: 'thmGeo'
      }
    },
    {
      code: 'positionR',
      group: 'assetDataKey',
      label: {
        fr: 'Position R',
        en: 'Position R'
      },
      properties: {
        geomaticKey: 'positionR',
        assetKey: 'positionR'
      }
    },
    {
      code: 'sectionId',
      group: 'assetDataKey',
      label: {
        fr: 'ID de tronçon',
        en: 'Section ID'
      },
      properties: {
        geomaticKey: 'idTrc',
        assetKey: 'sectionId'
      }
    },
    {
      code: 'jmapId',
      group: 'assetDataKey',
      label: {
        fr: 'JMAP ID',
        en: 'JMAP ID'
      },
      properties: {
        geomaticKey: 'jmapId',
        assetKey: 'jmapId'
      }
    },
    {
      code: 'intRef',
      group: 'assetDataKey',
      label: {
        fr: 'intRef',
        en: 'intRef'
      },
      properties: {
        geomaticKey: 'intRef',
        assetKey: 'intRef'
      }
    },
    {
      code: 'intMaster',
      group: 'assetDataKey',
      label: {
        fr: 'intMaitre',
        en: 'intMaster'
      },
      properties: {
        geomaticKey: 'intMaitre',
        assetKey: 'intMaster'
      }
    },
    {
      code: 'controler',
      group: 'assetDataKey',
      label: {
        fr: 'Contrôleur',
        en: 'Controler'
      },
      properties: {
        geomaticKey: 'controleur',
        assetKey: 'controler'
      }
    },
    {
      code: 'x',
      group: 'assetDataKey',
      label: {
        fr: 'x',
        en: 'x'
      },
      properties: {
        geomaticKey: 'x',
        assetKey: 'x'
      }
    },
    {
      code: 'y',
      group: 'assetDataKey',
      label: {
        fr: 'y',
        en: 'y'
      },
      properties: {
        geomaticKey: 'y',
        assetKey: 'y'
      }
    },
    {
      code: 'topNumber',
      group: 'assetDataKey',
      label: {
        fr: 'Nombre Sup',
        en: 'Top number'
      },
      properties: {
        geomaticKey: 'nombreSup',
        assetKey: 'topNumber'
      }
    },
    {
      code: 'ciOwner',
      group: 'assetDataKey',
      label: {
        fr: 'Propriétaire Ci',
        en: 'Owner Ci'
      },
      properties: {
        geomaticKey: 'proprietaireCi',
        assetKey: 'ciOwner'
      }
    },
    {
      code: 'voltageExp',
      group: 'assetDataKey',
      label: {
        fr: 'Tension',
        en: 'Voltage'
      },
      properties: {
        geomaticKey: 'tensionExp',
        assetKey: 'voltageExp'
      }
    },
    {
      code: 'version',
      group: 'assetDataKey',
      label: {
        fr: 'Version',
        en: 'Version'
      },
      properties: {
        geomaticKey: 'version',
        assetKey: 'version'
      }
    },
    {
      code: 'pressureClass',
      group: 'assetDataKey',
      label: {
        fr: 'Classe de la pression',
        en: 'Pressure class'
      },
      properties: {
        geomaticKey: 'classePression',
        assetKey: 'pressureClass'
      }
    },
    {
      code: 'toponym',
      group: 'assetDataKey',
      label: {
        fr: 'Toponyme',
        en: 'Toponym'
      },
      properties: {
        geomaticKey: 'toponyme',
        assetKey: 'toponym'
      }
    },
    {
      code: 'voltage',
      group: 'assetDataKey',
      label: {
        fr: 'Tension',
        en: 'Voltage'
      },
      properties: {
        geomaticKey: 'tension',
        assetKey: 'voltage'
      }
    },
    {
      code: 'source',
      group: 'assetDataKey',
      label: {
        fr: 'Source',
        en: 'Source'
      },
      properties: {
        geomaticKey: 'source',
        assetKey: 'source'
      }
    },
    {
      code: 'noChambreSurPlanCle',
      group: 'assetDataKey',
      label: {
        fr: 'noChambreSurPlanCle',
        en: 'noChambreSurPlanCle'
      },
      properties: {
        geomaticKey: 'noChambreSurPlanCle',
        assetKey: 'noChambreSurPlanCle'
      }
    },
    {
      code: 'installationYear',
      group: 'assetDataKey',
      label: {
        fr: "Année d'installation",
        en: 'Installation year'
      },
      properties: {
        geomaticKey: 'anneeInstallation',
        assetKey: 'installationYear'
      }
    },
    {
      code: 'rehabilitationYear',
      group: 'assetDataKey',
      label: {
        fr: 'Année de réhabilitation',
        en: 'Rehabilitation year'
      },
      properties: {
        geomaticKey: 'anneeRehabilitation',
        assetKey: 'rehabilitationYear'
      }
    },
    {
      code: 'isAssetRehabilitated',
      group: 'assetDataKey',
      label: {
        fr: 'Actif réhabilité',
        en: 'Asset rehabilitated'
      },
      properties: {
        geomaticKey: 'actifRehabilite',
        assetKey: 'isAssetRehabilitated'
      }
    },
    {
      code: 'chamberDiameter',
      group: 'assetDataKey',
      label: {
        fr: 'Diamètre de la chambre',
        en: 'Chamber diameter'
      },
      properties: {
        geomaticKey: 'diametreChambre',
        assetKey: 'chamberDiameter',
        unit: LengthUnit.meter
      }
    },
    {
      code: 'activeDrainage',
      group: 'assetDataKey',
      label: {
        fr: 'Drainage actif',
        en: 'Active drainage'
      },
      properties: {
        geomaticKey: 'drainageActif',
        assetKey: 'activeDrainage'
      }
    },
    {
      code: 'chamberWidth',
      group: 'assetDataKey',
      label: {
        fr: 'Largeur de la chambre',
        en: 'Chamber width'
      },
      properties: {
        geomaticKey: 'largeurChambre',
        assetKey: 'chamberWidth',
        unit: LengthUnit.meter
      }
    },
    {
      code: 'chamberLength',
      group: 'assetDataKey',
      label: {
        fr: 'Longueur de la chambre',
        en: 'Chamber length'
      },
      properties: {
        geomaticKey: 'longueurChambre',
        assetKey: 'chamberLength',
        unit: LengthUnit.meter
      }
    },
    {
      code: 'noRegulationChamber',
      group: 'assetDataKey',
      label: {
        fr: 'Régulation de la chambre',
        en: 'Regulation Chamber'
      },
      properties: {
        geomaticKey: 'noChambreRegulation',
        assetKey: 'noRegulationChamber'
      }
    },
    {
      code: 'noPlanContratTec',
      group: 'assetDataKey',
      label: {
        fr: 'noPlanContratTec',
        en: 'noPlanContratTec'
      },
      properties: {
        geomaticKey: 'noPlanContratTec',
        assetKey: 'noPlanContratTec'
      }
    },
    {
      code: 'drainValvePresence',
      group: 'assetDataKey',
      label: {
        fr: "Présence d'un clapet drain",
        en: 'Drain valve presence'
      },
      properties: {
        geomaticKey: 'presenceClapetDrain',
        assetKey: 'drainValvePresence'
      }
    },
    {
      code: 'depth',
      group: 'assetDataKey',
      label: {
        fr: 'Profondeur',
        en: 'Depth'
      },
      properties: {
        geomaticKey: 'profondeur',
        assetKey: 'depth',
        unit: LengthUnit.meter
      }
    },
    {
      code: 'watershed',
      group: 'assetDataKey',
      label: {
        fr: 'Bassin versant',
        en: 'Watershed'
      },
      properties: {
        geomaticKey: 'bassinVersant',
        assetKey: 'watershed'
      }
    },
    {
      code: 'pipeForm',
      group: 'assetDataKey',
      label: {
        fr: 'Forme de la conduite',
        en: 'Pipe form'
      },
      properties: {
        geomaticKey: 'formeConduite',
        assetKey: 'pipeForm'
      }
    },
    {
      code: 'noPipePi',
      group: 'assetDataKey',
      label: {
        fr: 'Conduite Pi',
        en: 'Pipe Pi'
      },
      properties: {
        geomaticKey: 'noConduitePi',
        assetKey: 'noPipePi'
      }
    },
    {
      code: 'upstreamDepth',
      group: 'assetDataKey',
      label: {
        fr: 'Profondeur en amont',
        en: 'Upstream depth'
      },
      properties: {
        geomaticKey: 'profondeurRadierAmont',
        assetKey: 'upstreamDepth',
        unit: LengthUnit.meter
      }
    },
    {
      code: 'downstreamDepth',
      group: 'assetDataKey',
      label: {
        fr: 'Profondeur en aval',
        en: 'Downstream depth'
      },
      properties: {
        geomaticKey: 'profondeurRadierAval',
        assetKey: 'downstreamDepth',
        unit: LengthUnit.meter
      }
    },
    {
      code: 'chimneyShape',
      group: 'assetDataKey',
      label: {
        fr: 'Forme de la cheminée',
        en: 'Chimney shape'
      },
      properties: {
        geomaticKey: 'formeCheminee',
        assetKey: 'chimneyShape'
      }
    },
    {
      code: 'noChamberDeeu',
      group: 'assetDataKey',
      label: {
        fr: 'Chambre DEEU',
        en: 'Chamber DEEU'
      },
      properties: {
        geomaticKey: 'noChambreDeeu',
        assetKey: 'noChamberDeeu'
      }
    },
    {
      code: 'objectId',
      group: 'assetDataKey',
      label: {
        fr: "ID de l'objet",
        en: 'Object ID'
      },
      properties: {
        geomaticKey: 'objectid',
        assetKey: 'objectId'
      }
    },
    {
      code: 'placeName',
      group: 'assetDataKey',
      label: {
        fr: 'Lieu',
        en: 'Place'
      },
      properties: {
        geomaticKey: 'nomLieu',
        assetKey: 'placeName'
      }
    },
    {
      code: 'snowId',
      group: 'assetDataKey',
      label: {
        fr: 'ID neige',
        en: 'Snow ID'
      },
      properties: {
        geomaticKey: 'idNeige',
        assetKey: 'snowId'
      }
    },
    {
      code: 'descPlace',
      group: 'assetDataKey',
      label: {
        fr: 'Lieu',
        en: 'Place'
      },
      properties: {
        geomaticKey: 'descLieu',
        assetKey: 'descPlace'
      }
    },
    {
      code: 'streetName',
      group: 'assetDataKey',
      label: {
        fr: 'Voie',
        en: 'Street'
      },
      properties: {
        geomaticKey: 'nomVoie',
        assetKey: 'streetName'
      }
    },
    {
      code: 'fullAddress',
      group: 'assetDataKey',
      label: {
        fr: 'Adresse',
        en: 'Address'
      },
      properties: {
        geomaticKey: 'adresCmpl',
        assetKey: 'fullAddress'
      }
    },
    {
      code: 'pointX',
      group: 'assetDataKey',
      label: {
        fr: 'x',
        en: 'x'
      },
      properties: {
        geomaticKey: 'pointX',
        assetKey: 'pointX'
      }
    },
    {
      code: 'pointY',
      group: 'assetDataKey',
      label: {
        fr: 'y',
        en: 'y'
      },
      properties: {
        geomaticKey: 'pointY',
        assetKey: 'pointY'
      }
    },
    {
      code: 'municipalityName',
      group: 'assetDataKey',
      label: {
        fr: 'Municipalité',
        en: 'Municipality'
      },
      properties: {
        geomaticKey: 'nommun',
        assetKey: 'municipalityName'
      }
    },
    {
      code: 'aliasName',
      group: 'assetDataKey',
      label: {
        fr: "Nom d'alias",
        en: 'Alias name'
      },
      properties: {
        geomaticKey: 'aliasNom',
        assetKey: 'aliasName'
      }
    },
    {
      code: 'streetLampId',
      group: 'assetDataKey',
      label: {
        fr: 'ID du lampadaire',
        en: 'Street lamp ID'
      },
      properties: {
        geomaticKey: 'idEclLampadaire',
        assetKey: 'streetLampId'
      }
    },
    {
      code: 'relayId',
      group: 'assetDataKey',
      label: {
        fr: 'ID du relais',
        en: 'Relay ID'
      },
      properties: {
        geomaticKey: 'idEclRelais',
        assetKey: 'relayId'
      }
    },
    {
      code: 'lampGoogleStreetUrl',
      group: 'assetDataKey',
      label: {
        fr: 'Google street URL',
        en: 'Google street URL'
      },
      properties: {
        geomaticKey: 'lampGoogleStreetUrl',
        assetKey: 'lampGoogleStreetUrl'
      }
    },
    {
      code: 'lampPlaqueTransitionR',
      group: 'assetDataKey',
      label: {
        fr: 'Plaque de transition',
        en: 'Plaque de transition'
      },
      properties: {
        geomaticKey: 'lampPlaqueTransitionR',
        assetKey: 'lampPlaqueTransitionR'
      }
    },
    {
      code: 'lampPriseCourantR',
      group: 'assetDataKey',
      label: {
        fr: 'Prise de courant',
        en: 'Plug'
      },
      properties: {
        geomaticKey: 'lampPriseCourantR',
        assetKey: 'lampPriseCourantR'
      }
    },
    {
      code: 'lampPriseSonR',
      group: 'assetDataKey',
      label: {
        fr: 'Prise de son',
        en: 'Prise de son'
      },
      properties: {
        geomaticKey: 'lampPriseSonR',
        assetKey: 'lampPriseSonR'
      }
    },
    {
      code: 'lampHautParleurR',
      group: 'assetDataKey',
      label: {
        fr: 'Haut-parleur',
        en: 'Speaker'
      },
      properties: {
        geomaticKey: 'lampHautParleurR',
        assetKey: 'lampHautParleurR'
      }
    },
    {
      code: 'lampProjecteurR',
      group: 'assetDataKey',
      label: {
        fr: 'Projecteur',
        en: 'Projector'
      },
      properties: {
        geomaticKey: 'lampProjecteurR',
        assetKey: 'lampProjecteurR'
      }
    },
    {
      code: 'futNumeroRac',
      group: 'assetDataKey',
      label: {
        fr: 'Numéro Rac',
        en: 'Rac Number'
      },
      properties: {
        geomaticKey: 'futNumeroRac',
        assetKey: 'futNumeroRac'
      }
    },
    {
      code: 'futMateriauR',
      group: 'assetDataKey',
      label: {
        fr: 'Matériau',
        en: 'Material'
      },
      properties: {
        geomaticKey: 'futMateriauR',
        assetKey: 'futMateriauR'
      }
    },
    {
      code: 'futFinitionR',
      group: 'assetDataKey',
      label: {
        fr: 'Finition',
        en: 'Finition'
      },
      properties: {
        geomaticKey: 'futFinitionR',
        assetKey: 'futFinitionR'
      }
    },
    {
      code: 'futTypeR',
      group: 'assetDataKey',
      label: {
        fr: 'Type',
        en: 'Type'
      },
      properties: {
        geomaticKey: 'futTypeR',
        assetKey: 'futTypeR'
      }
    },
    {
      code: 'futDateFinition',
      group: 'assetDataKey',
      label: {
        fr: 'Date de finition',
        en: 'Date of completion'
      },
      properties: {
        geomaticKey: 'futDateFinition',
        assetKey: 'futDateFinition'
      }
    },
    {
      code: 'futDateInstall',
      group: 'assetDataKey',
      label: {
        fr: "Date d'installation",
        en: 'Installation date'
      },
      properties: {
        geomaticKey: 'futDateInstall',
        assetKey: 'futDateInstall'
      }
    },
    {
      code: 'support',
      group: 'assetDataKey',
      label: {
        fr: 'Support',
        en: 'Support'
      },
      properties: {
        geomaticKey: 'support',
        assetKey: 'support'
      }
    },
    {
      code: 'silhouets',
      group: 'assetDataKey',
      label: {
        fr: 'Silhouettes',
        en: 'Silhouettes'
      },
      properties: {
        geomaticKey: 'silhouets',
        assetKey: 'silhouets'
      }
    },
    {
      code: 'proprioSup',
      group: 'assetDataKey',
      label: {
        fr: 'ProprioSup',
        en: 'ProprioSup'
      },
      properties: {
        geomaticKey: 'proprioSup',
        assetKey: 'proprioSup'
      }
    },
    {
      code: 'precision',
      group: 'assetDataKey',
      label: {
        fr: 'Précision',
        en: 'Precision'
      },
      properties: {
        geomaticKey: 'precision',
        assetKey: 'precision'
      }
    },
    {
      code: 'labelMap2016',
      group: 'assetDataKey',
      label: {
        fr: 'Carte étiquette 2016',
        en: 'Label map 2016'
      },
      properties: {
        geomaticKey: 'carteEtiquette2016',
        assetKey: 'labelMap2016'
      }
    },
    {
      code: 'legendMap2016',
      group: 'assetDataKey',
      label: {
        fr: 'Carte légende 2016',
        en: 'Legend map 2016'
      },
      properties: {
        geomaticKey: 'carteLegende2016',
        assetKey: 'legendMap2016'
      }
    },
    {
      code: 'boroughPi',
      group: 'assetDataKey',
      label: {
        fr: 'Arrondissement Pi',
        en: 'Borough Pi'
      },
      properties: {
        geomaticKey: 'arrondissementPi',
        assetKey: 'boroughPi'
      }
    },
    {
      code: 'size',
      group: 'assetDataKey',
      label: {
        fr: 'Longueur',
        en: 'Length'
      },
      properties: {
        geomaticKey: 'longueur',
        assetKey: 'size',
        unit: LengthUnit.meter
      }
    },
    {
      code: 'hypReport',
      group: 'assetDataKey',
      label: {
        fr: 'Hyp rapport',
        en: 'Hyp report'
      },
      properties: {
        geomaticKey: 'hypRapport',
        assetKey: 'hypReport'
      }
    },
    {
      code: 'hypTable',
      group: 'assetDataKey',
      label: {
        fr: 'Hyp tableau',
        en: 'Hyp table'
      },
      properties: {
        geomaticKey: 'hypTableau',
        assetKey: 'hypTable'
      }
    },
    {
      code: 'hypMap',
      group: 'assetDataKey',
      label: {
        fr: 'Hyp carte',
        en: 'Hyb map'
      },
      properties: {
        geomaticKey: 'hypCarte',
        assetKey: 'hypMap'
      }
    },
    {
      code: 'edgeMaterial',
      group: 'assetDataKey',
      label: {
        fr: 'Matériau de la bordure',
        en: 'Edge material'
      },
      properties: {
        geomaticKey: 'materiauBordureRef',
        assetKey: 'edgeMaterial'
      }
    },
    {
      code: 'inserMaterial',
      group: 'assetDataKey',
      label: {
        fr: 'Matériau Inser',
        en: 'Inser material'
      },
      properties: {
        geomaticKey: 'materiauinserRef',
        assetKey: 'inserMaterial'
      }
    },
    {
      code: 'usage',
      group: 'assetDataKey',
      label: {
        fr: 'Usage',
        en: 'Usage'
      },
      properties: {
        geomaticKey: 'usage',
        assetKey: 'usage'
      }
    },
    {
      code: 'boroughName',
      group: 'assetDataKey',
      label: {
        fr: 'Arrondissement',
        en: 'Borough'
      },
      properties: {
        geomaticKey: 'nomArrondissement',
        assetKey: 'boroughName'
      }
    },
    {
      code: 'parkId',
      group: 'assetDataKey',
      label: {
        fr: 'ID de parc',
        en: 'Park ID'
      },
      properties: {
        geomaticKey: 'idParc',
        assetKey: 'parkId'
      }
    },
    {
      code: 'inserRoadwayIslandMaterial',
      group: 'assetDataKey',
      label: {
        fr: "Matériau de l'îlot de chaussée",
        en: 'Roadway island material'
      },
      properties: {
        geomaticKey: 'materiauInserIlotRef',
        assetKey: 'inserRoadwayIslandMaterial'
      }
    },
    {
      code: 'contructDateRef',
      group: 'assetDataKey',
      label: {
        fr: 'Date de construction',
        en: 'Construction date'
      },
      properties: {
        geomaticKey: 'dateConstruprecRef',
        assetKey: 'contructDateRef'
      }
    },
    {
      code: 'station',
      group: 'assetDataKey',
      label: {
        fr: 'Station',
        en: 'Station'
      },
      properties: {
        geomaticKey: 'station',
        assetKey: 'station'
      }
    },
    {
      code: 'url',
      group: 'assetDataKey',
      label: {
        fr: 'URL',
        en: 'URL'
      },
      properties: {
        geomaticKey: 'url',
        assetKey: 'url'
      }
    },
    {
      code: 'trackType',
      group: 'assetDataKey',
      label: {
        fr: 'Type de voie',
        en: 'Track type'
      },
      properties: {
        geomaticKey: 'typeVoie',
        assetKey: 'trackType'
      }
    },
    {
      code: 'noPark',
      group: 'assetDataKey',
      label: {
        fr: 'Parc',
        en: 'Park'
      },
      properties: {
        geomaticKey: 'noParc',
        assetKey: 'noPark'
      }
    },
    {
      code: 'noSite',
      group: 'assetDataKey',
      label: {
        fr: 'Site',
        en: 'Site'
      },
      properties: {
        geomaticKey: 'noSite',
        assetKey: 'noSite'
      }
    },
    {
      code: 'borough',
      group: 'assetDataKey',
      label: {
        fr: 'Arrondissement',
        en: 'Borough'
      },
      properties: {
        geomaticKey: 'arrondissement',
        assetKey: 'borough'
      }
    },
    {
      code: 'numberOfTerminals',
      group: 'assetDataKey',
      label: {
        fr: 'Nombre de bornes',
        en: 'Number of terminals'
      },
      properties: {
        geomaticKey: 'nbrBorne',
        assetKey: 'numberOfTerminals'
      }
    },
    {
      code: 'location',
      group: 'assetDataKey',
      label: {
        fr: 'Emplacement',
        en: 'Location'
      },
      properties: {
        geomaticKey: 'emplacement',
        assetKey: 'location'
      }
    },
    {
      code: 'pricing',
      group: 'assetDataKey',
      label: {
        fr: 'Tarification',
        en: 'Pricing'
      },
      properties: {
        geomaticKey: 'tarification',
        assetKey: 'pricing'
      }
    },
    {
      code: 'serialNumber',
      group: 'assetDataKey',
      label: {
        fr: 'Numéro de série',
        en: 'Serial number'
      },
      properties: {
        geomaticKey: 'noSerieFut',
        assetKey: 'serialNumber'
      }
    },
    {
      code: 'serialNumberTerminal1',
      group: 'assetDataKey',
      label: {
        fr: 'Numéro de série de la borne N°1',
        en: 'Terminal N°1 serial number'
      },
      properties: {
        geomaticKey: 'noSerieBorne1',
        assetKey: 'serialNumberTerminal1'
      }
    },
    {
      code: 'serialNumberTerminal2',
      group: 'assetDataKey',
      label: {
        fr: 'Numéro de série de la borne N°2',
        en: 'Terminal N°2 serial number'
      },
      properties: {
        geomaticKey: 'noSerieBorne2',
        assetKey: 'serialNumberTerminal2'
      }
    },
    {
      code: 'program',
      group: 'assetDataKey',
      label: {
        fr: 'Programme',
        en: 'Program'
      },
      properties: {
        geomaticKey: 'programme',
        assetKey: 'program'
      }
    },
    {
      code: 'operationalDate',
      group: 'assetDataKey',
      label: {
        fr: 'Date de mise en opération',
        en: 'Operational date'
      },
      properties: {
        geomaticKey: 'miseEnOperation',
        assetKey: 'operationalDate'
      }
    },
    {
      code: 'place',
      group: 'assetDataKey',
      label: {
        fr: 'Lieu',
        en: 'Place'
      },
      properties: {
        geomaticKey: 'lieu',
        assetKey: 'place'
      }
    },
    {
      code: 'postalCode',
      group: 'assetDataKey',
      label: {
        fr: 'Code postal',
        en: 'Postal code'
      },
      properties: {
        geomaticKey: 'codePostal',
        assetKey: 'postalCode'
      }
    },
    {
      code: 'longitude',
      group: 'assetDataKey',
      label: {
        fr: 'Longitude',
        en: 'Longitude'
      },
      properties: {
        geomaticKey: 'longWgs84R',
        assetKey: 'longitude'
      }
    },
    {
      code: 'latitude',
      group: 'assetDataKey',
      label: {
        fr: 'Latitude',
        en: 'Latitude'
      },
      properties: {
        geomaticKey: 'latWgs84R',
        assetKey: 'latitude'
      }
    },
    {
      code: 'boroughRM',
      group: 'assetDataKey',
      label: {
        fr: 'Arrondissement',
        en: 'Borough'
      },
      properties: {
        geomaticKey: 'arrondissementRM',
        assetKey: 'boroughRM'
      }
    },
    {
      code: 'provenanceGivenR',
      group: 'assetDataKey',
      label: {
        fr: 'Provenance donnée',
        en: 'Origin given'
      },
      properties: {
        geomaticKey: 'provenancedonneeR',
        assetKey: 'provenanceGivenR'
      }
    },
    {
      code: 'versionDateR',
      group: 'assetDataKey',
      label: {
        fr: 'Date de la version',
        en: 'Version date'
      },
      properties: {
        geomaticKey: 'dateVersionR',
        assetKey: 'versionDateR'
      }
    },
    {
      code: 'hierarchy',
      group: 'assetDataKey',
      label: {
        fr: 'Hiérarchie',
        en: 'Hierarchy'
      },
      properties: {
        geomaticKey: 'hierarchie',
        assetKey: 'hierarchy'
      }
    },
    {
      code: 'paPost',
      group: 'assetDataKey',
      label: {
        fr: 'Poteau',
        en: 'Post'
      },
      properties: {
        geomaticKey: 'paPoteau',
        assetKey: 'paPost'
      }
    },
    {
      code: 'spatialCoordinateX',
      group: 'assetDataKey',
      label: {
        fr: 'x',
        en: 'x'
      },
      properties: {
        geomaticKey: 'coordonneeSpatialeX',
        assetKey: 'spatialCoordinateX'
      }
    },
    {
      code: 'spatialCoordinateY',
      group: 'assetDataKey',
      label: {
        fr: 'y',
        en: 'y'
      },
      properties: {
        geomaticKey: 'coordonneeSpatialeY',
        assetKey: 'spatialCoordinateY'
      }
    },
    {
      code: 'function',
      group: 'assetDataKey',
      label: {
        fr: 'Fonction',
        en: 'Function'
      },
      properties: {
        geomaticKey: 'fonction',
        assetKey: 'function'
      }
    },
    {
      code: 'numberOfHandlingTurns',
      group: 'assetDataKey',
      label: {
        fr: 'Nombre de tours de manipulation',
        en: 'Number of handling turns'
      },
      properties: {
        geomaticKey: 'nombreToursManipulation',
        assetKey: 'numberOfHandlingTurns'
      }
    },
    {
      code: 'closingDirection',
      group: 'assetDataKey',
      label: {
        fr: 'Sens de fermeture',
        en: 'Closing direction'
      },
      properties: {
        geomaticKey: 'sensFermeture',
        assetKey: 'closingDirection'
      }
    },
    {
      code: 'boundaryValve',
      group: 'assetDataKey',
      label: {
        fr: 'Vanne limitrophe',
        en: 'Boundary valve'
      },
      properties: {
        geomaticKey: 'vanneLimitrophe',
        assetKey: 'boundaryValve'
      }
    },
    {
      code: 'valveBorough',
      group: 'assetDataKey',
      label: {
        fr: 'Arrondissement',
        en: 'Bourough'
      },
      properties: {
        geomaticKey: 'noArrondissementVanne',
        assetKey: 'valveBorough'
      }
    }
  ];
}

// export as a function as we need to compare existing and new asset types taxos
export const taxos2712 = async (taxonomyModel: TaxonomyModel) => {
  return [
    ...getNewAssetTypeTaxonomies(),
    ...getAssetDataKeyTaxonomies(),
    ...(await getModifiedAssetTypeTaxonomies(taxonomyModel))
  ];
};
