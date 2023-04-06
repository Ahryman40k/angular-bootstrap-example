import { StoredAnnualProgram } from '@ahryman40k/types/program-api-types';
import { ServerStorages } from '../infrastructure';
import { CreateAnnualProgramRequest, GetAnnualProgramRequest } from '../routes/types/create-annual-program.route';
import { DeclareServiceHandler } from '../framework';





export type AnnualProgramService = 
  DeclareServiceHandler<CreateAnnualProgramRequest, StoredAnnualProgram[], 'annual-program.create'> 
  & DeclareServiceHandler<GetAnnualProgramRequest, StoredAnnualProgram[], 'annual-program.getById'> 

export const createAnnualProgramService = (infra: ServerStorages): AnnualProgramService => {
  return {
    "annual-program.create": ({programs}) => {
      // Validation
      //  - validateAgainstOpenApi => handle by Zod in middleware at communication level
      //  - validateAgainstTaxonomies => to validate but is handled by Zod at communication level
      //  - validateRestrictions ? why is it test so late ? does it should appears at comminication level ?
      //  - validateCommonBusinessRules
      //      - validateTargetYear =>  gte current year
      //      - validateUnique     =>  Tuple [year, executorId] doesn't exist
      //      - validateSharedRole =>  Goal not obvious ...               

      const result = infra["annual-program.create"](programs);
      
      // Do whatever
      // We may need conversion from Raw objects to Business object definition

      return result;
    },
    "annual-program.getById": ( {annualProgramId} ) => {
      const result = infra["annual-program.get_by_id"]([annualProgramId])
      return result;
    }
    
  };
};
