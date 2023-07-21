
import { ServerServices } from '../../domain';
import { Routes, createFunctionBuilder, makeGet, makePost, validate } from '../../framework';
import { CreateSubmissionRequest, GetSubmissionByIdRequest } from '../types/submission.route';


const V1_SUBMISSION_PATH = '/api/v1/annualsubmission';


export const submission_routes = (service: ServerServices): Routes => ({
  [makeGet(`${V1_SUBMISSION_PATH}/:submissionId`)]: {
    middlewares: [validate(GetSubmissionByIdRequest)],
    handler: createFunctionBuilder(service, 'submission.getById'),
  },
  [makePost(V1_SUBMISSION_PATH)]: {
    middlewares: [validate(CreateSubmissionRequest)],
    handler: createFunctionBuilder(service, 'submission.create'),
  },
});
