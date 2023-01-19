import { IAuthor } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { Author } from '../author';

class AuthorMapperDTO extends FromModelToDtoMappings<Author, IAuthor, void> {
  protected async getFromNotNullModel(author: Author): Promise<IAuthor> {
    return this.map(author);
  }

  private map(author: Author) {
    return {
      userName: author.userName,
      displayName: author.displayName
    };
  }
}

export const authorMapperDTO = new AuthorMapperDTO();
