import { DOCUMENT_ALLOWED_MIME_TYPES, Permission } from '@villemontreal/agir-work-planning-lib';
import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { uploadMiddleWare } from '../../shared/upload/uploadMiddleware';
import { projectController } from './projectController';
import { AddCommentToProjectController } from './useCases/comments/addComment/addCommentToProjectController';
import { DeleteCommentFromProjectController } from './useCases/comments/deleteComment/deleteCommentFromProjectController';
import { GetProjectCommentsController } from './useCases/comments/getComments/getProjectCommentsController';
import { UpdateCommentProjectController } from './useCases/comments/updateComment/updateCommentProjectController';
import { AddDocumentToProjectController } from './useCases/documents/addDocument/addDocumentToProjectController';
import { DeleteDocumentFromProjectController } from './useCases/documents/deleteDocument/deleteDocumentFromProjectController';
import { GetProjectDocumentByIdController } from './useCases/documents/getDocumentById/getProjectDocumentByIdController';
import { UpdateDocumentProjectController } from './useCases/documents/updateDocument/updateDocumentProjectController';
import { DeleteDrmNumberController } from './useCases/drm/deleteDrmNumber/deleteDrmNumberController';
import { GenerateDrmNumberController } from './useCases/drm/generateDrmNumber/generateDrmNumberController';
import { ExtractProjectsController } from './useCases/extract/extractProjectsController';

const V1_PROJECTS_PATH = `/v1/projects`;

// tslint:disable:max-func-body-length
export function getProjectsRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}`,
      handler: projectController.create
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROJECTS_PATH}`,
      handler: projectController.searchGet
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROJECTS_PATH}/countBy`,
      handler: projectController.getCountBySearch
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_READ)],
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}/countBy`,
      handler: projectController.postCountBySearch
    },
    {
      method: HttpMethods.GET,
      path: `${V1_PROJECTS_PATH}/:id/documents/:documentId`,
      handler: new GetProjectDocumentByIdController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_DOCUMENT_READ)]
    },
    {
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}/:id/documents`,
      handler: new AddDocumentToProjectController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.PROJECT_DOCUMENT_WRITE),
        uploadMiddleWare(DOCUMENT_ALLOWED_MIME_TYPES)
      ]
    },
    {
      method: HttpMethods.PUT,
      path: `${V1_PROJECTS_PATH}/:id/documents/:documentId`,
      handler: new UpdateDocumentProjectController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.PROJECT_DOCUMENT_WRITE),
        uploadMiddleWare(DOCUMENT_ALLOWED_MIME_TYPES, true)
      ]
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_DOCUMENT_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_PROJECTS_PATH}/:id/documents/:documentId`,
      handler: new DeleteDocumentFromProjectController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROJECTS_PATH}/:id`,
      handler: projectController.getOne
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_PROJECTS_PATH}/:id`,
      handler: projectController.update
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_DECISION_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROJECTS_PATH}/:id/decisions`,
      handler: projectController.getDecisions
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_DECISION_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}/:id/decisions`,
      handler: projectController.addDecision
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_COMMENT_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}/:id/comments`,
      handler: new AddCommentToProjectController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_COMMENT_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROJECTS_PATH}/:id/comments`,
      handler: new GetProjectCommentsController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_COMMENT_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_PROJECTS_PATH}/:id/comments/:idComment`,
      handler: new UpdateCommentProjectController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_COMMENT_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_PROJECTS_PATH}/:id/comments/:idComment`,
      handler: new DeleteCommentFromProjectController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_PROJECTS_PATH}/:id/annualDistribution`,
      handler: projectController.updateProjectAnnualDistribution
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_READ)],
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}/search`,
      handler: projectController.searchPost
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_DRM_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}/generateDrmNumber`,
      handler: new GenerateDrmNumberController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_DRM_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_PROJECTS_PATH}/drmNumber`,
      handler: new DeleteDrmNumberController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROJECT_EXTRACT)],
      method: HttpMethods.POST,
      path: `${V1_PROJECTS_PATH}/extract`,
      handler: new ExtractProjectsController().execute
    }
  ];
}
