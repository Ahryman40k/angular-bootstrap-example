import { AnnualProgramExpand, Permission } from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { userService } from '../../../services/userService';
import { enrichedAnnualProgramSchema, IAnnualProgramMongoAttributes } from './annualProgramSchema';

export type IAnnualProgramMongoDocument = IAnnualProgramMongoAttributes & Document;
export type AnnualProgramModel = CustomModel<IAnnualProgramMongoAttributes>;

export const annualProgramModelFactory = (mongoose: Connection) => {
  const annualProgramModel = mongoose.model<IAnnualProgramMongoDocument>(
    constants.mongo.collectionNames.ANNUAL_PROGRAMS,
    enrichedAnnualProgramSchema
  ) as AnnualProgramModel;
  annualProgramModel.schema = enrichedAnnualProgramSchema;

  // Set lookups with expands
  annualProgramModel.lookups = (aggregate, expand: string[] = []) => {
    /* Get annual program from program book */
    if (expand.includes(AnnualProgramExpand.programBooks)) {
      const user = userService.currentUser;
      if (user.hasPermission(Permission.PROGRAM_BOOK_READ)) {
        aggregate.lookup(getAnnualProgramProgramBookLookup());

        if (!user.hasPermission(Permission.PROGRAM_BOOK_READ_ALL)) {
          const sharedRolesField = '$$this.sharedRoles';
          aggregate.addFields({
            programBooks: {
              $filter: {
                input: '$programBooks',
                cond: {
                  $and: [
                    // Need to check against $missing, undefined and null otherwise could lead to errors.
                    { $ne: [sharedRolesField, '$missing'] },
                    { $ne: [sharedRolesField, undefined] },
                    { $ne: [sharedRolesField, null] },
                    {
                      $or: user.roles.map(r => {
                        return { $in: [r, sharedRolesField] };
                      })
                    }
                  ]
                }
              }
            }
          });
        }
        if (!user.hasPermission(Permission.PROGRAM_BOOK_READ_NEW)) {
          aggregate.addFields({
            programBooks: {
              $filter: {
                input: '$programBooks',
                cond: {
                  $ne: ['$$this.status', 'new']
                }
              }
            }
          });
        }
      }
    }
  };
  return annualProgramModel;
};

export const getAnnualProgramProgramBookLookup = () => {
  return {
    from: constants.mongo.collectionNames.PROGRAM_BOOKS,
    localField: '_id',
    foreignField: 'annualProgramId',
    as: 'programBooks'
  };
};
