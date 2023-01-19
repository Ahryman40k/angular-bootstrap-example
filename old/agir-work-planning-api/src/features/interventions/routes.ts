import { DOCUMENT_ALLOWED_MIME_TYPES, Permission } from '@villemontreal/agir-work-planning-lib';
import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { uploadMiddleWare } from '../../shared/upload/uploadMiddleware';
import { interventionController } from './interventionController';
import { AddCommentToInterventionController } from './useCases/comments/addComment/addCommentToInterventionController';
import { DeleteCommentFromInterventionController } from './useCases/comments/deleteComment/deleteCommentFromInterventionController';
import { GetInterventionCommentsController } from './useCases/comments/getComments/getInterventionCommentsController';
import { UpdateCommentInterventionController } from './useCases/comments/updateComment/updateCommentInterventionController';
import { AddDocumentToInterventionController } from './useCases/documents/addDocument/addDocumentToInterventionController';
import { DeleteDocumentFromInterventionController } from './useCases/documents/deleteDocument/deleteDocumentFromInterventionController';
import { GetInterventionDocumentByIdController } from './useCases/documents/getDocumentById/getInterventionDocumentByIdController';
import { UpdateDocumentInterventionController } from './useCases/documents/updateDocument/updateDocumentInterventionController';
import { ExtractInterventionsController } from './useCases/extract/extractInterventionsController';

const V1_INTERVENTIONS_PATH = `/v1/interventions`;

// tslint:disable:max-func-body-length
export function getInterventionsRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_INTERVENTIONS_PATH}`,
      handler: interventionController.create
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_READ)],
      method: HttpMethods.GET,
      path: `${V1_INTERVENTIONS_PATH}`,
      handler: interventionController.searchGet
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_READ)],
      method: HttpMethods.GET,
      path: `${V1_INTERVENTIONS_PATH}/countBy`,
      handler: interventionController.countByGet
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_READ)],
      method: HttpMethods.POST,
      path: `${V1_INTERVENTIONS_PATH}/countBy`,
      handler: interventionController.countByPost
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_READ)],
      method: HttpMethods.GET,
      path: `${V1_INTERVENTIONS_PATH}/:id`,
      handler: interventionController.getOne
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_INTERVENTIONS_PATH}/:id`,
      handler: interventionController.update
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_DELETE)],
      method: HttpMethods.DELETE,
      path: `${V1_INTERVENTIONS_PATH}/:id`,
      handler: interventionController.deleteById
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_INTERVENTIONS_PATH}/:id/annualDistribution`,
      handler: interventionController.updateInterventionAnnualDistribution
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_COMMENT_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_INTERVENTIONS_PATH}/:id/comments`,
      handler: new AddCommentToInterventionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_COMMENT_READ)],
      method: HttpMethods.GET,
      path: `${V1_INTERVENTIONS_PATH}/:id/comments`,
      handler: new GetInterventionCommentsController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_COMMENT_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_INTERVENTIONS_PATH}/:id/comments/:idComment`,
      handler: new UpdateCommentInterventionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_COMMENT_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_INTERVENTIONS_PATH}/:id/comments/:idComment`,
      handler: new DeleteCommentFromInterventionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_DECISION_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_INTERVENTIONS_PATH}/:id/decisions`,
      handler: interventionController.addDecision
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_DECISION_READ)],
      method: HttpMethods.GET,
      path: `${V1_INTERVENTIONS_PATH}/:id/decisions`,
      handler: interventionController.getDecisions
    },
    {
      method: HttpMethods.GET,
      path: `${V1_INTERVENTIONS_PATH}/:id/documents/:documentId`,
      handler: new GetInterventionDocumentByIdController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_DOCUMENT_READ)]
    },
    {
      method: HttpMethods.POST,
      path: `${V1_INTERVENTIONS_PATH}/:id/documents`,
      handler: new AddDocumentToInterventionController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_DOCUMENT_WRITE),
        uploadMiddleWare(DOCUMENT_ALLOWED_MIME_TYPES)
      ]
    },
    {
      method: HttpMethods.PUT,
      path: `${V1_INTERVENTIONS_PATH}/:id/documents/:documentId`,
      handler: new UpdateDocumentInterventionController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_DOCUMENT_WRITE),
        uploadMiddleWare(DOCUMENT_ALLOWED_MIME_TYPES, true)
      ]
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_DOCUMENT_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_INTERVENTIONS_PATH}/:id/documents/:documentId`,
      handler: new DeleteDocumentFromInterventionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_READ)],
      method: HttpMethods.POST,
      path: `${V1_INTERVENTIONS_PATH}/search`,
      handler: interventionController.searchPost
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INTERVENTION_EXTRACT)],
      method: HttpMethods.POST,
      path: `${V1_INTERVENTIONS_PATH}/extract`,
      handler: new ExtractInterventionsController().execute
    }
  ];
}
