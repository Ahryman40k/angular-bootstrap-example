import { DOCUMENT_ALLOWED_MIME_TYPES, Permission } from '@villemontreal/agir-work-planning-lib';

import { constants } from '../../../config/constants';
import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { uploadMiddleWare } from '../../shared/upload/uploadMiddleware';
import { CountBySubmissionController } from './useCases/countBySubmission/countBySubmissionController';
import { CreateSubmissionController } from './useCases/createSubmission/createSubmissionController';
import { AddDocumentToSubmissionController } from './useCases/documents/addDocument/addDocumentToSubmissionController';
import { DeleteDocumentFromSubmissionController } from './useCases/documents/deleteDocument/deleteDocumentFromSubmissionController';
import { GetSubmissionDocumentByIdController } from './useCases/documents/getDocumentById/getSubmissionDocumentByIdController';
import { UpdateDocumentSubmissionController } from './useCases/documents/updateDocument/updateDocumentSubmissionController';
import { GetSubmissionController } from './useCases/getSubmission/getSubmissionController';
import { PatchSubmissionController } from './useCases/patchSubmission/patchSubmissionController';
import { AddProjectToSubmissionController } from './useCases/projectSubmission/addProjectToSubmission/addProjectToSubmissionController';
import { RemoveProjectFromSubmissionController } from './useCases/projectSubmission/removeProjectFromSubmission/removeProjectFromSubmissionController';
import { CreateSubmissionRequirementController } from './useCases/requirements/addSubmissionRequirement/createSubmissionRequirementController';
import { DeleteSubmissionRequirementController } from './useCases/requirements/deleteSubmissionRequirement/deleteSubmissionRequirementController';
import { PatchSubmissionRequirementController } from './useCases/requirements/patchSubmissionRequirement/patchSubmissionRequirementController';
import { UpdateSubmissionRequirementController } from './useCases/requirements/updateSubmissionRequirement/updateSubmissionRequirementController';
import { SearchSubmissionController } from './useCases/searchSubmission/searchSubmissionController';

const V1_SUBMISSIONS_PATH = constants.locationPaths.SUBMISSIONS;

export function getSubmissionsRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_SUBMISSIONS_PATH}`,
      handler: new CreateSubmissionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_READ)],
      method: HttpMethods.POST,
      path: `${V1_SUBMISSIONS_PATH}/search`,
      handler: new SearchSubmissionController().execute
    },
    {
      method: HttpMethods.GET,
      path: `${V1_SUBMISSIONS_PATH}/countBy`,
      handler: new CountBySubmissionController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_READ)]
    },
    {
      middlewares: [
        gdaAuthMiddlewareFactory.create(
          Permission.SUBMISSION_STATUS_WRITE || Permission.SUBMISSION_PROGRESS_STATUS_WRITE
        )
      ],
      method: HttpMethods.PATCH,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber`,
      handler: new PatchSubmissionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_READ)],
      method: HttpMethods.GET,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber`,
      handler: new GetSubmissionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/add/project/:id`,
      handler: new AddProjectToSubmissionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/remove/project/:id`,
      handler: new RemoveProjectFromSubmissionController().execute
    },
    {
      method: HttpMethods.POST,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/documents`,
      handler: new AddDocumentToSubmissionController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_DOCUMENT_WRITE),
        uploadMiddleWare(DOCUMENT_ALLOWED_MIME_TYPES)
      ]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/documents/:documentId`,
      handler: new GetSubmissionDocumentByIdController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_DOCUMENT_READ)]
    },
    {
      method: HttpMethods.PUT,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/documents/:documentId`,
      handler: new UpdateDocumentSubmissionController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_DOCUMENT_WRITE),
        uploadMiddleWare(DOCUMENT_ALLOWED_MIME_TYPES, true)
      ]
    },
    {
      method: HttpMethods.DELETE,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/documents/:documentId`,
      handler: new DeleteDocumentFromSubmissionController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_DOCUMENT_WRITE)]
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_REQUIREMENT_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/requirements`,
      handler: new CreateSubmissionRequirementController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_REQUIREMENT_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/requirements/:id`,
      handler: new UpdateSubmissionRequirementController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_REQUIREMENT_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/requirements/:id`,
      handler: new DeleteSubmissionRequirementController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.SUBMISSION_REQUIREMENT_WRITE)],
      method: HttpMethods.PATCH,
      path: `${V1_SUBMISSIONS_PATH}/:submissionNumber/requirements/:id`,
      handler: new PatchSubmissionRequirementController().execute
    }
  ];
}
