import { Permission } from '@villemontreal/agir-work-planning-lib';

import { constants } from '../../../config/constants';
import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { CreateOpportunityNoticeController } from './useCases/createOpportunityNotice/createOpportunityNoticeController';
import { GetOpportunityNoticeController } from './useCases/getOpportunityNotice/getOpportunityNoticeController';
import { CreateOpportunityNoticeNoteController } from './useCases/notes/createOpportunityNoticeNote/createOpportunityNoticeNoteController';
import { UpdateOpportunityNoticeNoteController } from './useCases/notes/updateOpportunityNoticeNote/updateOpportunityNoticeNoteController';
import { SearchOpportunityNoticeController } from './useCases/searchOpportunityNotice/searchOpportunityNoticeController';
import { UpdateOpportunityNoticeController } from './useCases/updateOpportunityNotice/updateOpportunityNoticeController';

export const V1_OPPORTUNITY_NOTICES_PATH = constants.locationPaths.OPPORTUNITY_NOTICES;

// tslint:disable:max-func-body-length
export function getOpportunityNoticesRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.OPPORTUNITY_NOTICE_WRITE)],
      method: HttpMethods.POST,
      path: V1_OPPORTUNITY_NOTICES_PATH,
      handler: new CreateOpportunityNoticeController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.OPPORTUNITY_NOTICE_READ)],
      method: HttpMethods.GET,
      path: V1_OPPORTUNITY_NOTICES_PATH,
      handler: new SearchOpportunityNoticeController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.OPPORTUNITY_NOTICE_READ)],
      method: HttpMethods.GET,
      path: `${V1_OPPORTUNITY_NOTICES_PATH}/:id`,
      handler: new GetOpportunityNoticeController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.OPPORTUNITY_NOTICE_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_OPPORTUNITY_NOTICES_PATH}/:id`,
      handler: new UpdateOpportunityNoticeController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.OPPORTUNITY_NOTICE_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_OPPORTUNITY_NOTICES_PATH}/:id/notes`,
      handler: new CreateOpportunityNoticeNoteController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.OPPORTUNITY_NOTICE_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_OPPORTUNITY_NOTICES_PATH}/:id/notes/:noteId`,
      handler: new UpdateOpportunityNoticeNoteController().execute
    }
  ];
}
