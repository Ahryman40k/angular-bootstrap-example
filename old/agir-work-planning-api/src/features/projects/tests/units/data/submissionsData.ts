import {
  SubmissionRequirementMention,
  SubmissionRequirementSubtype,
  SubmissionRequirementType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { ISubmissionProps } from '../../../../submissions/models/submission';
import { getSubmissionRequirement } from '../../../../submissions/tests/submissionTestHelper';

export function getPartialSubmissionsPropsData(projectIds: any): Partial<ISubmissionProps>[] {
  return [
    {
      submissionNumber: '12345',
      drmNumber: '01',
      projectIds: [projectIds.project2],
      requirements: [
        getSubmissionRequirement({
          mentionId: SubmissionRequirementMention.BEFORE_TENDER,
          typeId: SubmissionRequirementType.COMPLETION_PERIOD,
          isDeprecated: true,
          subtypeId: SubmissionRequirementSubtype.OTHER,
          text: 'blabla'
        }),
        getSubmissionRequirement({
          mentionId: SubmissionRequirementMention.AFTER_TENDER,
          typeId: SubmissionRequirementType.PROGRAMMATION,
          isDeprecated: false,
          subtypeId: SubmissionRequirementSubtype.SPRING,
          text: 'shpring'
        })
      ]
    },
    {
      submissionNumber: '23456',
      drmNumber: '11',
      projectIds: [projectIds.project3],
      requirements: [
        getSubmissionRequirement({
          mentionId: SubmissionRequirementMention.BEFORE_TENDER,
          typeId: SubmissionRequirementType.WORK,
          isDeprecated: false,
          subtypeId: SubmissionRequirementSubtype.COORDINATION_WORK,
          text: 'workworkworkworkwork'
        })
      ]
    },
    {
      submissionNumber: '11111',
      drmNumber: '23',
      projectIds: [projectIds.project7],
      requirements: [
        getSubmissionRequirement({
          mentionId: SubmissionRequirementMention.AFTER_TENDER,
          typeId: SubmissionRequirementType.OTHER,
          isDeprecated: true,
          subtypeId: SubmissionRequirementSubtype.OTHER,
          text: 'blabla'
        }),
        getSubmissionRequirement({
          mentionId: SubmissionRequirementMention.AFTER_TENDER,
          typeId: SubmissionRequirementType.PROGRAMMATION,
          isDeprecated: false,
          subtypeId: SubmissionRequirementSubtype.SCHOOL_HOLIDAYS,
          text: 'bloublou'
        })
      ]
    }
  ];
}
