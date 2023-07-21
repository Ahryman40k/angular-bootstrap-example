import { Submission } from '@ahryman40k/types/submission-api-types';
import { DeclareServiceHandler } from '../framework';
import { ServerStorages } from '../infrastructure';
import { CreateSubmissionRequest, GetSubmissionByIdRequest } from '../routes/types/submission.route';






export type SubmissionService = 
  DeclareServiceHandler<CreateSubmissionRequest, Submission[], 'submission.create'> 
  & DeclareServiceHandler<GetSubmissionByIdRequest, Submission[], 'submission.getById'> 
  
  
export const createSubmissionService = (infra: ServerStorages): SubmissionService => {
  return {
    "submission.create": ({submissions}) => {
      // Validation
      //  - validateAgainstOpenApi => handle by Zod in middleware at communication level
      //  - validateAgainstTaxonomies => to validate but is handled by Zod at communication level
      //  - validateRestrictions ? why is it test so late ? does it should appears at comminication level ?
      //  - validateCommonBusinessRules
      //      - validateTargetYear =>  gte current year
      //      - validateUnique     =>  Tuple [year, executorId] doesn't exist
      //      - validateSharedRole =>  Goal not obvious ...               

      const result = infra["submission.create"](submissions);
      
      // Do whatever
      // We may need conversion from Raw objects to Business object definition

      return result;
    },
    "submission.getById": ( {submissionId} ) => {
      const result = infra["submission.get_by_id"]([submissionId])
      return result;
    },
    
  };
};
