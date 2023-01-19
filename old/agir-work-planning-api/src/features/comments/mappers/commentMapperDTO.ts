import { IAudit, IComment } from '@villemontreal/agir-work-planning-lib';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { Comment } from '../models/comment';

class CommentMapperDTO extends FromModelToDtoMappings<Comment, IComment, void> {
  protected async getFromNotNullModel(comment: Comment): Promise<IComment> {
    const auditDTO = await auditMapperDTO.getFromModel(comment.audit);
    return this.map(comment, auditDTO);
  }

  // For now it is a one/one but could be different
  private map(comment: Comment, auditDTO: IAudit): IComment {
    return {
      id: comment.id,
      categoryId: comment.categoryId,
      text: comment.text,
      isPublic: comment.isPublic,
      isProjectVisible: comment.isProjectVisible,
      audit: auditDTO
    };
  }
}

export const commentMapperDTO = new CommentMapperDTO();
