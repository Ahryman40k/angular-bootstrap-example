import { CommentCategory, IComment } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { mergeProperties } from '../../../../tests/utils/testHelper';
import { auditService } from '../../../services/auditService';
import { getId } from '../../../shared/domain/entity';
import { getAudit } from '../../audit/test/auditTestHelper';
import { commentMapperDTO } from '../mappers/commentMapperDTO';
import { Comment, ICommentProps } from '../models/comment';
import { IPlainCommentProps } from '../models/plainComment';

const plainCommentProps: IPlainCommentProps = {
  categoryId: CommentCategory.information,
  text: 'this is a comment',
  isPublic: true,
  isProjectVisible: false
};
const commentProps: ICommentProps = {
  ...plainCommentProps,
  audit: getAudit()
};

export function getPlainCommentProps(props?: Partial<IPlainCommentProps>): IPlainCommentProps {
  return mergeProperties(plainCommentProps, {
    ...props
  });
}

export function getCommentProps(props?: Partial<ICommentProps>): ICommentProps {
  return mergeProperties(commentProps, {
    ...props
  });
}

export function getComment(props?: Partial<ICommentProps>, id?: string): Comment {
  return Comment.create(getCommentProps(props), id).getValue();
}

export async function getCommentAsDto(props?: Partial<ICommentProps>, id?: string): Promise<IComment> {
  return commentMapperDTO.getFromModel(getComment(props, id));
}

// only exists for interventions and projects
export function getIComment(props?: Partial<ICommentProps>, id?: string) {
  return {
    id: id ? id : getId(),
    ...plainCommentProps,
    audit: auditService.buildAudit(props?.audit),
    ...props
  };
}

export function assertComment(actual: IComment, expected: IComment) {
  assert.strictEqual(actual.categoryId, expected.categoryId);
  assert.strictEqual(actual.text, expected.text);
  assert.strictEqual(actual.isPublic, expected.isPublic);
  assert.isDefined(actual.audit);
}
