import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { createNotFoundError } from '@villemontreal/core-utils-general-nodejs-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';

import { ITaxonomyGroupCode } from '../../models/taxonomies/taxonomyGroupCode';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { createLogger } from '../../utils/logger';
import { ITaxonomyCriterias, TaxonomyFindOptions } from './models/taxonomyFindOptions';
import { TaxonomyFindPaginatedOptions } from './models/taxonomyFindPaginatedOptions';
import { taxonomyRepository } from './mongo/taxonomyRepository';
import { taxonomyService } from './taxonomyService';
import { taxonomyValidator } from './validators/taxonomyValidator';

const logger = createLogger('TaxonomyController');
/**
 * Application controller
 *
 * Part of the "Mongo/Mongoose examples" provided by the generator.
 *
 * The "@autobind" decorator automatically binds all the methods of
 * the class to the proper "this" value. When a route is executed,
 * the receiving method of the controller must be properly bound or
 * "this" will not represent the controller instance.
 * @see https://github.com/andreypopp/autobind-decorator
 */
@autobind
export class TaxonomyController {
  public async getTaxonomies(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    let criterias: ITaxonomyCriterias = {};
    ['group', 'code'].forEach(param => {
      const paramValue: string = req.params[param] || req.query[param];
      if (paramValue) {
        criterias = {
          ...criterias,
          [param]: paramValue
        };
      }
    });

    const taxonomyFindOptions = TaxonomyFindPaginatedOptions.create({
      criterias,
      offset: req.query.offset,
      limit: req.query.limit,
      orderBy: req.query.sort
    });

    if (taxonomyFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(taxonomyFindOptions)));
    }
    logger.debug(
      { result: taxonomyFindOptions.getValue().props },
      'FindOptions ***************************************'
    );

    const taxonomyList = await taxonomyRepository.findPaginated(taxonomyFindOptions.getValue());

    // TODO This line is in comment. Need to confirm what its suppose to be used for?
    // const savedApplication: IApplication = await applicationService.save(application);
    res.status(HttpStatusCodes.OK).send(taxonomyList);
  }

  /**
   * Saves a new taxonomy
   */
  public async postTaxonomy(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const taxonomyInput: ITaxonomy = req.body;
    await taxonomyValidator.validatePost(taxonomyInput);

    if (!taxonomyInput.hasOwnProperty('isActive')) {
      taxonomyInput.isActive = true;
    }

    const savedTaxonomyResult = await taxonomyRepository.save(taxonomyInput);
    if (savedTaxonomyResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(savedTaxonomyResult)));
    }
    res.status(HttpStatusCodes.CREATED).send(savedTaxonomyResult.getValue());
    taxonomyService.reset();
  }

  /**
   * Updates an existing taxonomy
   */
  public async updateTaxonomy(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const groupCode: ITaxonomyGroupCode = {
      group: req.params.group,
      code: req.params.code
    };
    const taxonomyInput: ITaxonomy = req.body;

    await taxonomyValidator.validateUpdate(groupCode, taxonomyInput);

    const taxonomy = await taxonomyService.getTaxonomy(groupCode.group as TaxonomyGroup, groupCode.code);

    if (!taxonomy) {
      throw errorMtlMapper.toApiError(new NotFoundError(`Could not find the taxonomy ${groupCode.code}`));
    } else {
      const savedTaxonomyResult = await taxonomyRepository.save({ ...taxonomy, ...taxonomyInput });
      if (savedTaxonomyResult.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(savedTaxonomyResult)));
      }

      res.status(HttpStatusCodes.OK).send(savedTaxonomyResult.getValue());
    }
    taxonomyService.reset();
  }

  /**
   * Deletes a taxonomy
   */
  public async deleteTaxonomy(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const groupCode: ITaxonomyGroupCode = {
      group: req.params.group,
      code: req.params.code
    };

    taxonomyValidator.validateDelete(groupCode);

    const taxonomy = await taxonomyService.getTaxonomy(groupCode.group as TaxonomyGroup, groupCode.code);
    if (!taxonomy) {
      throw createNotFoundError("The taxonomy you are trying to delete doesn't exist.");
    }

    const taxonomyRemoveFindOptionsResult = TaxonomyFindOptions.create({
      criterias: {
        id: taxonomy.id
      }
    });
    if (taxonomyRemoveFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(
        new InvalidParameterError(Result.combineForError(taxonomyRemoveFindOptionsResult))
      );
    }

    await taxonomyRepository.delete(taxonomyRemoveFindOptionsResult.getValue());
    taxonomyService.reset();

    res.status(HttpStatusCodes.NO_CONTENT).send();
  }
}
export const taxonomyController: TaxonomyController = new TaxonomyController();
