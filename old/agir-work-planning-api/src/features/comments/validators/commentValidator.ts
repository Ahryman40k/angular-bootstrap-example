import { IApiError, IPlainComment, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { get, isEmpty } from 'lodash';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { IPlainCommentProps } from '../models/plainComment';

export class CommentValidator {
  public static async validateAgainstOpenApi(commentInput: IPlainCommentProps): Promise<Result<IGuardResult>> {
    return openApiInputValidator.validateOpenApiModel('PlainComment', commentInput);
  }

  public static async validateTaxonomies(inputComment: IPlainComment): Promise<Result<IGuardResult>> {
    const taxonomies: ITaxonomy[] = await taxonomyService.all();
    const commentTaxonomyProperties: { param: string; taxonomyGroup: string; optionnal: boolean }[] = [
      { param: 'categoryId', taxonomyGroup: TaxonomyGroup.commentCategory, optionnal: true }
    ];

    const errors: IApiError[] = [];
    for (const property of commentTaxonomyProperties) {
      const objectPropertyValue = get(inputComment, property.param);
      if (!property.optionnal || objectPropertyValue) {
        const getTaxonomy = taxonomies.find(
          taxonomy => taxonomy.group === property.taxonomyGroup && taxonomy.code === objectPropertyValue
        );
        if (getTaxonomy === undefined && objectPropertyValue !== undefined) {
          errors.push({
            code: '',
            message: `Taxonomy code: ${objectPropertyValue} doesn't exist`,
            target: property.param
          });
        }
      }
    }
    if (!isEmpty(errors)) {
      return Result.combine(
        errors.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }
}
