import {
  ISubmission,
  ISubmissionRequirement,
  SubmissionProgressStatus,
  SubmissionRequirementMention,
  SubmissionRequirementSubtype,
  SubmissionRequirementType,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { mergeProperties, NOT_FOUND_UUID } from '../../../../tests/utils/testHelper';
import { getAudit } from '../../audit/test/auditTestHelper';
import { IProjectSubmissionProps } from '../models/projectSubmissionCommand';
import { ISubmissionRequirementProps, SubmissionRequirement } from '../models/requirements/submissionRequirement';
import { ISubmissionProps, Submission } from '../models/submission';
import { ISubmissionCreateRequestProps } from '../models/submissionCreateRequest';
import { submissionRepository } from '../mongo/submissionRepository';
import { ISubmissionPatchRequestProps } from '../useCases/patchSubmission/submissionPatchRequest';
import { ISubmissionRequirementCreateRequestProps } from '../useCases/requirements/addSubmissionRequirement/submissionRequirementCreateRequest';
import { ISubmissionRequirementUpdateRequestProps } from '../useCases/requirements/updateSubmissionRequirement/submissionRequirementUpdateRequest';

export const DRM_NUMBER = '7373';
export const SUBMISSION_NUMBER = `${DRM_NUMBER}10`;

export function getSubmissionCreateRequestProps(
  props?: Partial<ISubmissionCreateRequestProps>
): ISubmissionCreateRequestProps {
  return {
    programBookId: NOT_FOUND_UUID,
    projectIds: ['P00001'],
    ...props
  };
}

export function getSubmissionPatchRequestProps(
  props?: Partial<ISubmissionPatchRequestProps>
): ISubmissionPatchRequestProps {
  return {
    submissionNumber: SUBMISSION_NUMBER,
    status: SubmissionStatus.INVALID,
    progressStatus: SubmissionProgressStatus.DESIGN,
    progressStatusChangeDate: new Date().toISOString(),
    comment: 'this is a comment',
    ...props
  };
}

export function getProjectSubmissionCommandProps(props?: Partial<IProjectSubmissionProps>): IProjectSubmissionProps {
  return {
    submissionNumber: SUBMISSION_NUMBER,
    projectId: 'P00001',
    ...props
  };
}

export function getSubmissionRequirementRequestProps(
  props?: Partial<ISubmissionRequirementCreateRequestProps>
): ISubmissionRequirementCreateRequestProps {
  return {
    submissionNumber: SUBMISSION_NUMBER,
    subtypeId: SubmissionRequirementSubtype.OTHER,
    text: 'teste',
    ...props
  };
}

const submissionRequirementProps: ISubmissionRequirementProps = {
  projectIds: undefined,
  mentionId: SubmissionRequirementMention.AFTER_TENDER,
  typeId: SubmissionRequirementType.OTHER,
  subtypeId: SubmissionRequirementSubtype.OTHER,
  text: 'TEST',
  isDeprecated: false,
  audit: getAudit()
};

export function getSubmissionRequirement(props?: Partial<SubmissionRequirement>): SubmissionRequirement {
  return SubmissionRequirement.create(mergeProperties(submissionRequirementProps, props)).getValue();
}

export function getSubmissionRequirementUpdateRequestProps(
  props?: Partial<ISubmissionRequirementUpdateRequestProps>
): ISubmissionRequirementUpdateRequestProps {
  return {
    id: '1234',
    submissionNumber: SUBMISSION_NUMBER,
    subtypeId: submissionRequirementProps.subtypeId,
    text: submissionRequirementProps.text,
    ...props
  };
}

export function getSubmissionProps(props?: Partial<ISubmissionProps>): ISubmissionProps {
  return mergeProperties(
    {
      submissionNumber: SUBMISSION_NUMBER,
      drmNumber: DRM_NUMBER,
      status: SubmissionStatus.VALID,
      progressStatus: SubmissionProgressStatus.PRELIMINARY_DRAFT,
      progressHistory: [
        {
          progressStatus: SubmissionStatus.VALID,
          audit: getAudit()
        }
      ],
      audit: getAudit(),
      ...getSubmissionCreateRequestProps(props)
    },
    props
  );
}

export function getSubmission(props?: Partial<ISubmissionProps>): Submission {
  return Submission.create(getSubmissionProps(props)).getValue();
}

export async function createAndSaveSubmission(props?: Partial<ISubmissionProps>): Promise<Submission> {
  const submissionResult = Submission.create(getSubmissionProps(props));
  return (await submissionRepository.save(submissionResult.getValue())).getValue();
}

export function assertSubmissions(submission: ISubmission, expected: ISubmission) {
  assert.strictEqual(submission.submissionNumber, expected.submissionNumber);
  assert.strictEqual(submission.drmNumber, expected.drmNumber);
  assert.strictEqual(submission.programBookId, expected.programBookId);
  assert.isTrue(submission.projectIds.every(projectId => expected.projectIds.includes(projectId)));
  assert.strictEqual(submission.status, expected.status);
  assert.strictEqual(submission.progressStatus, expected.progressStatus);
  assert.isDefined(submission.audit);
  assert.strictEqual(submission.progressHistory.length, expected.progressHistory.length);

  const foundProgressHistory = submission.progressHistory.find(x => x);
  const expectedProgressHistory = expected.progressHistory.find(x => x);
  assert.strictEqual(foundProgressHistory.progressStatus, expectedProgressHistory.progressStatus);
  assert.strictEqual(foundProgressHistory.createdAt, expectedProgressHistory.createdAt);
  assert.strictEqual(foundProgressHistory.createdBy.userName, expectedProgressHistory.createdBy.userName);
  assert.strictEqual(foundProgressHistory.createdBy.displayName, expectedProgressHistory.createdBy.displayName);
}

export function assertSubmissionRequirement(
  submissionRequirement: ISubmissionRequirement,
  expectedSubmissionRequirement: Partial<ISubmissionRequirement>
) {
  assert.strictEqual(submissionRequirement.id, expectedSubmissionRequirement.id);
  assert.strictEqual(submissionRequirement.subtypeId, expectedSubmissionRequirement.subtypeId);
  assert.strictEqual(submissionRequirement.text, expectedSubmissionRequirement.text);
  assert.strictEqual(submissionRequirement.typeId, expectedSubmissionRequirement.typeId);
  assert.strictEqual(submissionRequirement.mentionId, expectedSubmissionRequirement.mentionId);
  assert.strictEqual(submissionRequirement.isDeprecated, expectedSubmissionRequirement.isDeprecated);
  assert.strictEqual(submissionRequirement.planningRequirementId, expectedSubmissionRequirement.planningRequirementId);
  assert.isDefined(submissionRequirement.audit.createdAt);
  assert.isDefined(submissionRequirement.audit.createdBy);
}

export function assetSubmissionProjectRequirements(
  submissionRequirements: Partial<ISubmissionRequirement[]>,
  expected: { id: string; projectIds: string[] }[]
) {
  assert.strictEqual(submissionRequirements.length, expected.length);
  submissionRequirements.forEach((submissionRequirement, index) => {
    assert.strictEqual(submissionRequirement.projectIds.length, expected[index].projectIds.length);
    assert.equal(submissionRequirement.planningRequirementId, expected[index].id);
    expected[index].projectIds.forEach((projectId: string) => {
      assert.isTrue(submissionRequirement.projectIds.includes(projectId));
    });
  });
}
