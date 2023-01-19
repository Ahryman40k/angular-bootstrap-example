import { db } from '../../../src/features/database/DB';
import { createDynamicInterventionList, createInterventionList } from '../outils/interventionDataOutils';

export async function insertBaseInterventions(objectNumber: number = 0) {
  // tslint:disable-next-line:no-console
  console.log('Starting insertBaseInterventions()');
  const interventionModel = db().models.Intervention;
  const taxonomyModel = db().models.Taxonomy;
  const listTaxonomies = await taxonomyModel.find({}).exec();
  // Delete all foreign interventions savend by this script
  await interventionModel.deleteMany({ 'audit.createdBy': 'test' }).exec();
  if (objectNumber) {
    await interventionModel.insertMany(createDynamicInterventionList(objectNumber, listTaxonomies));
  } else {
    await interventionModel.insertMany(createInterventionList());
  }

  // tslint:disable-next-line:no-console
  console.log('Finished insertBaseInterventions()');
}
