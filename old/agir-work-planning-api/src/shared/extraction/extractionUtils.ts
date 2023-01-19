import {
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionDecision,
  ILength,
  InterventionDecisionType,
  IProjectDecision,
  ITaxonomy,
  ProjectDecisionType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { IObjectMetadata } from '@villemontreal/infra-object-storage-client-node-v2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { objectListToCSV } from '../../../scripts/mongo-to-csv/export-data-helper';
import { Requirement } from '../../features/requirements/models/requirement';
import { TaxonomyFindOptions } from '../../features/taxonomies/models/taxonomyFindOptions';
import { taxonomyRepository } from '../../features/taxonomies/mongo/taxonomyRepository';
import { AuthorizedDateFormats } from '../../utils/moment/moment.enum';
import { IDownloadFileResult } from '../storage/iStorageService';

export class ExtractionUtils {
  public static lengthObjectToLengthInMeters(length: ILength): number {
    return _.isNil(length?.value) ? undefined : Math.round(length.value * (length.unit === 'ft' ? 0.3048 : 1));
  }

  public static formatRequirements(requirements: Requirement[], taxonomies: { [x: string]: ITaxonomy[] }): string {
    const formattedRequirements = requirements?.map(requirement => {
      const requirementType = this.findLabelInTaxonomies(TaxonomyGroup.requirementType, requirement.typeId, taxonomies);
      const requirementSubType = this.findLabelInTaxonomies(
        TaxonomyGroup.requirementSubtype,
        requirement.subtypeId,
        taxonomies
      );
      return `${requirementType} - ${requirementSubType} :\n${requirement.text}`;
    });

    // Join formatted requirements into a single string
    return _.isEmpty(formattedRequirements) ? '' : formattedRequirements.reduce((a, b) => a.concat('\n\n').concat(b));
  }

  public static findLabelInTaxonomies(
    group: TaxonomyGroup,
    code: string,
    taxonomies: { [x: string]: ITaxonomy[] }
  ): string {
    return taxonomies[group].find(taxo => taxo.code === code)?.label?.fr ?? '';
  }

  public static formatNumber(value: number): string {
    return _.isUndefined(value) || _.isNaN(value) ? '' : Number(value).toString();
  }

  public static async getTaxonomiesForSelectedFields(
    selectedFields: string[] = [],
    selectableFieldsToTaxonomyGroups: { [x: string]: TaxonomyGroup[] }
  ): Promise<{ [x: string]: ITaxonomy[] }> {
    // Map selected fields to corresponding taxonomy groups
    const taxonomyGroups = selectedFields
      ?.map(field => selectableFieldsToTaxonomyGroups[field])
      .filter(x => !_.isEmpty(x))
      .flat();

    // Find all taxonomies for those groups
    const allTaxonomies: ITaxonomy[] = taxonomyGroups?.length
      ? await taxonomyRepository.findAll(
          TaxonomyFindOptions.create({
            criterias: {
              group: taxonomyGroups
            },
            fields: ['group', 'code', 'label.fr']
          }).getValue()
        )
      : [];

    // Organize queried taxonomies by taxonomy group
    const taxonomies: { [x: string]: ITaxonomy[] } = {};
    for (const taxonomyGroup of taxonomyGroups) {
      taxonomies[taxonomyGroup] = allTaxonomies.filter(taxo => taxo.group === taxonomyGroup);
    }
    return taxonomies;
  }

  public static mapObjectListsToCsv(
    objects: any[],
    fileNamePrefix: string,
    excelEncoding = false
  ): IDownloadFileResult {
    const csvFileName = `${fileNamePrefix}_extraction_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
    const buffer = Buffer.from(objectListToCSV(objects, excelEncoding ? ';' : ','), excelEncoding ? 'utf16le' : 'utf8');
    return {
      metadata: {
        contentLength: buffer.length,
        contentType: 'text/csv',
        objectName: csvFileName
      } as IObjectMetadata,
      data: buffer
    };
  }

  public static findAndFormatMostRecentDecisionDate(
    entity: IEnrichedProject | IEnrichedIntervention,
    targetDecisionType: ProjectDecisionType | InterventionDecisionType
  ): string {
    if (!targetDecisionType) {
      return '';
    }

    const mostRecentDecisionDate = _.head(
      (entity.decisions as (IProjectDecision | IInterventionDecision)[])
        ?.filter(x => x.typeId === targetDecisionType)
        ?.sort((a, b) => (moment(a.audit?.createdAt).isAfter(moment(b.audit?.createdAt)) ? -1 : 1))
    )?.audit?.createdAt;

    return _.isEmpty(mostRecentDecisionDate) ? '' : moment(mostRecentDecisionDate).format(AuthorizedDateFormats.SECOND);
  }
}
