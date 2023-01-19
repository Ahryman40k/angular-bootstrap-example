import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { LengthUnit } from '../../../../features/length/models/length';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.6.0');

interface IAssetDataKeyProperties {
  assetKey: string;
  geomaticKey: string;
  unit?: string;
}

interface IAssetTypeProperties {
  idKey?: string;
  namespace?: string;
  owners?: string[];
  sourcesLayerId?: string;
  workTypes?: string[];
  dataKeys?: string[];
}

interface IAssetDataKeyTaxonomy extends ITaxonomy {
  properties?: IAssetDataKeyProperties;
}

interface IAssetTypeTaxonomy extends ITaxonomy {
  properties?: IAssetTypeProperties;
}

export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deleteAssetDayKeyTaxonomies(taxonomiesCollection);
  await createAssetDataKeyTaxonomies(taxonomiesCollection);
  await createHectaresAreaTaxonomy(taxonomiesCollection);
  await updateAssetTypeTaxonomies(taxonomiesCollection);
}

async function deleteAssetDayKeyTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  const result = await taxonomiesCollection.deleteMany({ group: 'assetDataKey' });
  logger.info(`${result.deletedCount} group assetDataKey DELETED`);
}

// tslint:disable-next-line:max-func-body-length
async function createAssetDataKeyTaxonomies(collection: MongoDb.Collection) {
  const values: IAssetDataKeyTaxonomy[] = [
    {
      group: 'assetDataKey',
      code: 'installationDate',
      label: {
        fr: "Date d'installation",
        en: 'Installation date'
      },
      properties: {
        geomaticKey: 'dateInstallation',
        assetKey: 'installationDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'serviceStatus',
      label: {
        fr: 'État de service',
        en: 'Service status'
      },
      properties: {
        geomaticKey: 'etatDeService',
        assetKey: 'serviceStatus'
      }
    },
    {
      group: 'assetDataKey',
      code: 'diameter',
      label: {
        fr: 'Diamètre',
        en: 'Diameter'
      },
      properties: {
        geomaticKey: 'diametrePo',
        assetKey: 'diameter',
        unit: 'in'
      }
    },
    {
      group: 'assetDataKey',
      code: 'length',
      label: {
        fr: 'Longueur',
        en: 'Length'
      },
      properties: {
        geomaticKey: 'longueurSegment',
        assetKey: 'length',
        unit: LengthUnit.meter
      }
    },
    {
      group: 'assetDataKey',
      code: 'horizontalDiameter',
      label: {
        fr: 'Diamètre horizontal',
        en: 'Horizontal diameter'
      },
      properties: {
        geomaticKey: 'diametreHPo',
        assetKey: 'horizontalDiameter',
        unit: 'in'
      }
    },
    {
      group: 'assetDataKey',
      code: 'verticalDiameter',
      label: {
        fr: 'Diamètre vertical',
        en: 'Vertical diameter'
      },
      properties: {
        geomaticKey: 'diametreVPo',
        assetKey: 'verticalDiameter',
        unit: 'in'
      }
    },
    {
      group: 'assetDataKey',
      code: 'networkClassification',
      label: {
        fr: 'Classification réseau',
        en: 'Network classification'
      },
      properties: {
        geomaticKey: 'classificationReseau',
        assetKey: 'networkClassification'
      }
    },
    {
      group: 'assetDataKey',
      code: 'abandonmentDate',
      label: {
        fr: "Date d'abandon",
        en: 'Abandonment date'
      },
      properties: {
        geomaticKey: 'dateAbandon',
        assetKey: 'abandonmentDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'rehabilitationDate',
      label: {
        fr: 'Date de réhabilitation',
        en: 'Rehabilitation date'
      },
      properties: {
        geomaticKey: 'dateRehabilitation',
        assetKey: 'rehabilidationDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'aqueductSegmentMaterial',
      label: {
        fr: "Matériau du segment d'aqueduc",
        en: 'Aqueduct segment material'
      },
      properties: {
        geomaticKey: 'materiauSegmentAq',
        assetKey: 'aqueductSegmentMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'aqueductRehabilitationType',
      label: {
        fr: "Type de réhabilitation d'aquaduc",
        en: 'Aqueduct rehabilitation type'
      },
      properties: {
        geomaticKey: 'typeRehabilitationAq',
        assetKey: 'aqueductRehabilitationType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'aqueductSegmentType',
      label: {
        fr: "Type de segment d'aqueduc",
        en: 'Aqueduct segment type'
      },
      properties: {
        geomaticKey: 'typeSegmentAq',
        assetKey: 'aqueductSegmentType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'aqueductJoinMaterial',
      label: {
        fr: "Matériau du raccord d'aqueduc",
        en: 'Aqueduct join material'
      },
      properties: {
        geomaticKey: 'materiauRaccordAq',
        assetKey: 'aqueductJoinMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'aqueductJoinType',
      label: {
        fr: "Type de raccord d'aqueduc",
        en: 'Aqueduct join type'
      },
      properties: {
        geomaticKey: 'typeRaccordAq',
        assetKey: 'aqueductJoinType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'aqueductChamberMaterial',
      label: {
        fr: "Matériau de la chambre d'aqueduc",
        en: 'Aqueduct chamber material'
      },
      properties: {
        geomaticKey: 'materiauChambreAq',
        assetKey: 'aqueductChamberMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'material',
      label: {
        fr: 'Matériau',
        en: 'Material'
      },
      properties: {
        geomaticKey: 'materiel',
        assetKey: 'material'
      }
    },
    {
      group: 'assetDataKey',
      code: 'chamberType',
      label: {
        fr: 'Type de la chambre',
        en: 'Chamber type'
      },
      properties: {
        geomaticKey: 'typeChambre',
        assetKey: 'chamberType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'chamberShape',
      label: {
        fr: 'Forme de la chambre',
        en: 'Chamber shape'
      },
      properties: {
        geomaticKey: 'formeChambre',
        assetKey: 'chamberShape'
      }
    },
    {
      group: 'assetDataKey',
      code: 'diameterM',
      label: {
        fr: 'Diamètre',
        en: 'Diameter'
      },
      properties: {
        geomaticKey: 'diametre',
        assetKey: 'diameter',
        unit: LengthUnit.meter
      }
    },
    {
      group: 'assetDataKey',
      code: 'startDate',
      label: {
        fr: 'Date de début',
        en: 'Start date'
      },
      properties: {
        geomaticKey: 'dateDebut',
        assetKey: 'startDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'endDate',
      label: {
        fr: 'Date de fin',
        en: 'End date'
      },
      properties: {
        geomaticKey: 'dateFin',
        assetKey: 'endDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'parkName',
      label: {
        fr: 'Nom du parc',
        en: 'Park name'
      },
      properties: {
        geomaticKey: 'nomParc',
        assetKey: 'parkName'
      }
    },
    {
      group: 'assetDataKey',
      code: 'areaHa',
      label: {
        fr: 'Superficie',
        en: 'Area'
      },
      properties: {
        geomaticKey: 'superficieHa',
        assetKey: 'area',
        unit: 'ha'
      }
    },
    {
      group: 'assetDataKey',
      code: 'areaM2',
      label: {
        fr: 'Superficie',
        en: 'Area'
      },
      properties: {
        geomaticKey: 'superficie',
        assetKey: 'area',
        unit: 'm2'
      }
    },
    {
      group: 'assetDataKey',
      code: 'estimatedWidth',
      label: {
        fr: 'Largeur estimée',
        en: 'Estimated width'
      },
      properties: {
        geomaticKey: 'largeurEstimee',
        assetKey: 'estimatedWidth',
        unit: LengthUnit.meter
      }
    },
    {
      group: 'assetDataKey',
      code: 'estimatedLength',
      label: {
        fr: 'Longueur estimée',
        en: 'Estimated length'
      },
      properties: {
        geomaticKey: 'longueurEstimee',
        assetKey: 'estimatedLength',
        unit: LengthUnit.meter
      }
    },
    {
      group: 'assetDataKey',
      code: 'constructionDate',
      label: {
        fr: 'Date de construction',
        en: 'Construction date'
      },
      properties: {
        geomaticKey: 'dateConstruction',
        assetKey: 'constructionDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'roadworksStartDate',
      label: {
        fr: 'Date de début des travaux',
        en: 'Roadworks start date'
      },
      properties: {
        geomaticKey: 'dateDebutTravaux',
        assetKey: 'roadworksStartDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'roadworksEndDate',
      label: {
        fr: 'Date de fin des travaux',
        en: 'Roadworks end date'
      },
      properties: {
        geomaticKey: 'dateFinTravaux',
        assetKey: 'roadsworksEndDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'intersectionMaterial',
      label: {
        fr: "Matériau de l'intersection",
        en: 'Intersection material'
      },
      properties: {
        geomaticKey: 'materiauInterRef',
        assetKey: 'intersectionMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'intersectionType',
      label: {
        fr: "Type d'intersection",
        en: 'Intersection type'
      },
      properties: {
        geomaticKey: 'typeIntersectRef',
        assetKey: 'intersectionType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'roadwayIslandType',
      label: {
        fr: "Type d'îlot de chaussée",
        en: 'Roadway island type'
      },
      properties: {
        geomaticKey: 'typeIlotRef',
        assetKey: 'roadwayIslandType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'roadwayIslandMaterial',
      label: {
        fr: "Matériau de l'îlot de chaussée",
        en: 'Roadway island material'
      },
      properties: {
        geomaticKey: 'materiauIlotRef',
        assetKey: 'roadwayIslandMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'coverDimension',
      label: {
        fr: 'Dimension du couvercle',
        en: 'Cover dimension'
      },
      properties: {
        geomaticKey: 'dimensionCouverclePo',
        assetKey: 'coverDimension',
        unit: 'in'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerChamberMaterial',
      label: {
        fr: "Matériau de la chambre d'égout",
        en: 'Sewer chamber material'
      },
      properties: {
        geomaticKey: 'materiauChambreEg',
        assetKey: 'sewerChamberMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerChamberType',
      label: {
        fr: "Type de la chambre d'égout",
        en: 'Sewer chamber type'
      },
      properties: {
        geomaticKey: 'typeChambreEg',
        assetKey: 'sewerChamberType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerJoinMaterial',
      label: {
        fr: "Matériau du raccord d'égout",
        en: 'Sewer join material'
      },
      properties: {
        geomaticKey: 'materiauRaccordEg',
        assetKey: 'sewerJoinMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerJoinType',
      label: {
        fr: "Type du raccord d'égout",
        en: 'Sewer join type'
      },
      properties: {
        geomaticKey: 'typeRaccordEg',
        assetKey: 'sewerJoinType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'manholeType',
      label: {
        fr: "Type du regard d'égout",
        en: 'Manhole type'
      },
      properties: {
        geomaticKey: 'typeRegardEg',
        assetKey: 'manholeType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerResistanceClass',
      label: {
        fr: "Class de résistance de l'égout",
        en: 'Sewer resistance class'
      },
      properties: {
        geomaticKey: 'classeDeResistanceEg',
        assetKey: 'sewerResistanceClass'
      }
    },
    {
      group: 'assetDataKey',
      code: 'conductForm',
      label: {
        fr: 'Forme de la conduite',
        en: 'Conduct form'
      },
      properties: {
        geomaticKey: 'formConduite',
        assetKey: 'conductForm'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerSegmentMaterial',
      label: {
        fr: "Matériau du segment d'égout",
        en: 'Sewer segment material'
      },
      properties: {
        geomaticKey: 'materiauSegmentEg',
        assetKey: 'sewerSegmentMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'flowDirection',
      label: {
        fr: "Sens de l'écoulement",
        en: 'Flow direction'
      },
      properties: {
        geomaticKey: 'sensEcoulement',
        assetKey: 'flowDirection'
      }
    },
    {
      group: 'assetDataKey',
      code: 'flowType',
      label: {
        fr: "Type d'écoulement",
        en: 'Flow type'
      },
      properties: {
        geomaticKey: 'typeEcoulement',
        assetKey: 'flowType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerRehabilitationType',
      label: {
        fr: "Type de réhabilitation de l'égout",
        en: 'Sewer rehabilitation type'
      },
      properties: {
        geomaticKey: 'typeRehabilitationEg',
        assetKey: 'sewerRehabilitationType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'networkType',
      label: {
        fr: 'Type de réseau',
        en: 'Network type'
      },
      properties: {
        geomaticKey: 'typeReseau',
        assetKey: 'networkType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerSegmentType',
      label: {
        fr: "Type de segment d'égout",
        en: 'Sewer segment type'
      },
      properties: {
        geomaticKey: 'typeSegmentEg',
        assetKey: 'sewerSegmentType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerSumpMaterial',
      label: {
        fr: 'Matériau du puisard',
        en: 'Sewer sump material'
      },
      properties: {
        geomaticKey: 'materiauPuisard',
        assetKey: 'sewerSumpMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sewerSumpType',
      label: {
        fr: 'Type du puisard',
        en: 'Sewer sump type'
      },
      properties: {
        geomaticKey: 'typePuisard',
        assetKey: 'sewerSumpType'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sidewalkCategory',
      label: {
        fr: 'Catégorie du trottoir',
        en: 'Sidewalk category'
      },
      properties: {
        geomaticKey: 'categorieTrottoirRef',
        assetKey: 'sidewalkCategory'
      }
    },
    {
      group: 'assetDataKey',
      code: 'sidewalkMaterial',
      label: {
        fr: 'Matériau du trottoir',
        en: 'Sidewalk material'
      },
      properties: {
        geomaticKey: 'materiauTrottoirRef',
        assetKey: 'sidewalkMaterial'
      }
    },
    {
      group: 'assetDataKey',
      code: 'plantingDate',
      label: {
        fr: 'Date de plantation',
        en: 'Planting date'
      },
      properties: {
        geomaticKey: 'datePlantation',
        assetKey: 'plantingDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'inspectionDate',
      label: {
        fr: "Date d'inspection",
        en: 'Inspection date'
      },
      properties: {
        geomaticKey: 'dateInspection',
        assetKey: 'inspectionDate'
      }
    },
    {
      group: 'assetDataKey',
      code: 'normalPosition',
      label: {
        fr: 'Position normale',
        en: 'Normal position'
      },
      properties: {
        geomaticKey: 'positionNormale',
        assetKey: 'normalPosition'
      }
    },
    {
      group: 'assetDataKey',
      code: 'currentPosition',
      label: {
        fr: 'Position actuelle',
        en: 'Current position'
      },
      properties: {
        geomaticKey: 'positionActuelle',
        assetKey: 'currentPosition'
      }
    },
    {
      group: 'assetDataKey',
      code: 'valveOrientation',
      label: {
        fr: 'Orientation de la vanne',
        en: 'Valve orientation'
      },
      properties: {
        geomaticKey: 'orientationVanne',
        assetKey: 'valveOrientation'
      }
    },
    {
      group: 'assetDataKey',
      code: 'valveMechanism',
      label: {
        fr: 'Mécanisme de la vanne',
        en: 'Valve mechanism'
      },
      properties: {
        geomaticKey: 'mecanismeVanne',
        assetKey: 'valveMechanism'
      }
    },
    {
      group: 'assetDataKey',
      code: 'valveBrand',
      label: {
        fr: 'Marque de la vanne',
        en: 'Valve brand'
      },
      properties: {
        geomaticKey: 'marqueVanne',
        assetKey: 'valveBrand'
      }
    },
    {
      group: 'assetDataKey',
      code: 'compartment',
      label: {
        fr: 'Compartiment',
        en: 'Compartment'
      },
      properties: {
        geomaticKey: 'compartiment',
        assetKey: 'compartment'
      }
    },
    {
      group: 'assetDataKey',
      code: 'operationalManager',
      label: {
        fr: 'Responsable opérationnel',
        en: 'Operational manager'
      },
      properties: {
        geomaticKey: 'responsableOperationnel',
        assetKey: 'operationalManager'
      }
    },
    {
      group: 'assetDataKey',
      code: 'operationalState',
      label: {
        fr: 'État opérationnel',
        en: 'Operational state'
      },
      properties: {
        geomaticKey: 'etatOperationnel',
        assetKey: 'operationalState'
      }
    },
    {
      group: 'assetDataKey',
      code: 'jurisdiction',
      label: {
        fr: 'Juridiction',
        en: 'Jurisdiction'
      },
      properties: {
        geomaticKey: 'juridiction',
        assetKey: 'jurisdiction'
      }
    },
    {
      group: 'assetDataKey',
      code: 'address',
      label: {
        fr: 'Adresse',
        en: 'Address'
      },
      properties: {
        geomaticKey: 'adresse',
        assetKey: 'address'
      }
    }
  ];
  const insertResults = await collection.insertMany(values);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomy group assetDataKey`);
}

async function createHectaresAreaTaxonomy(collection: MongoDb.Collection) {
  const value: ITaxonomy = {
    group: 'area',
    code: 'ha',
    label: {
      fr: 'Hectares',
      en: 'Hectares'
    }
  };
  const insertResults = await collection.insertOne(value);
  logger.info(`${insertResults.insertedCount} document inserted in taxonomy group area`);
}

async function updateAssetTypeTaxonomies(collection: MongoDb.Collection) {
  logger.info('Update data keys of asset types');
  try {
    const assetTypes: IAssetTypeTaxonomy[] = await collection.find({ group: 'assetType' }).toArray();

    for (const assetType of assetTypes) {
      assetType.properties.dataKeys = getDataKeysForCode(assetType.code);

      await collection.replaceOne({ group: assetType.group, code: assetType.code }, assetType);
    }
  } catch (e) {
    logger.info(`Update asset types error -> ${e}`);
  }
}

function getDataKeysForCode(code: string): string[] {
  let dataKeys: string[] = null;
  switch (code) {
    case 'aqueductValve':
      dataKeys = ['installationDate', 'inspectionDate', 'diameter'];
      break;
    case 'sewerSegment':
      dataKeys = ['installationDate', 'inspectionDate', 'horizontalDiameter', 'verticalDiameter'];
      break;
    case 'aqueductSegment':
      dataKeys = ['installationDate', 'inspectionDate', 'diameter'];
      break;
    case 'aqueductEntranceSegment':
      dataKeys = ['installationDate', 'inspectionDate', 'diameter'];
      break;
    default:
      dataKeys = ['installationDate', 'inspectionDate'];
  }
  return dataKeys;
}
