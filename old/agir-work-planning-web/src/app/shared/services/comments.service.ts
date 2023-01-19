import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IComment, IPlainComment, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten } from 'lodash';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { ObjectType } from '../models/object-type/object-type';
import { BroadcastEvent, WindowBroadcastService } from '../window/window-broadcast.service';
import { TaxonomiesService } from './taxonomies.service';

/**
 * We need to ignore some comment categories because they are reserved for the more-information screens.
 */
const MORE_INFORMATION_COMMENT_CATEGORY_TAXONOMY_CODES = ['other', 'risk'];
export interface ICommentableEntity {
  id?: string; // all properties should manadatory but are not in IEnrichedIntervention and IEnrichedproject...
  comments?: IComment[];
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  constructor(
    private readonly http: HttpClient,
    private readonly broadcastService: WindowBroadcastService,
    private readonly taxonomyService: TaxonomiesService
  ) {}

  public async createComment(entityType: ObjectType, id: string, comment: IPlainComment): Promise<void> {
    await this.http.post<IPlainComment>(`${this.getBaseUrl(entityType)}/${id}/comments`, comment).toPromise();
  }

  public async deleteComment(entityType: ObjectType, interventionId: string, commentId: string): Promise<void> {
    await this.http
      .delete<IComment>(`${this.getBaseUrl(entityType)}/${interventionId}/comments/${commentId}`)
      .toPromise();
  }

  public async updateComment(
    entityType: ObjectType,
    entityId: string,
    commentId: string,
    comment: IPlainComment
  ): Promise<void> {
    await this.http
      .put<IPlainComment>(`${this.getBaseUrl(entityType)}/${entityId}/comments/${commentId}`, comment)
      .toPromise();
  }

  public getComments(entityType: ObjectType, id: string): Promise<IComment[]> {
    return this.http.get<IComment[]>(`${this.getBaseUrl(entityType)}/${id}/comments`).toPromise();
  }

  public async getMultipleInterventionsComments(ids: string[]): Promise<IComment[]> {
    const results = await Promise.all(ids.map(id => this.getComments(ObjectType.intervention, id)));
    return flatten(results);
  }

  public getCommentCategories(until$: Observable<any>): Observable<ITaxonomy[]> {
    return this.taxonomyService.group(TaxonomyGroup.commentCategory).pipe(
      takeUntil(until$),
      map(taxonomies => taxonomies.filter(t => !MORE_INFORMATION_COMMENT_CATEGORY_TAXONOMY_CODES.includes(t.code)))
    );
  }

  public removeMoreInformationComments(comments: IComment[]): IComment[] {
    return comments?.filter(c => !MORE_INFORMATION_COMMENT_CATEGORY_TAXONOMY_CODES.includes(c.categoryId)) || [];
  }

  public keepMoreInformationCommentsOnly(comments: IComment[]): IComment[] {
    return comments?.filter(c => MORE_INFORMATION_COMMENT_CATEGORY_TAXONOMY_CODES.includes(c.categoryId)) || [];
  }

  private getBaseUrl(entityType: ObjectType): string {
    switch (entityType) {
      case 'project':
        return environment.apis.planning.projects;
      case 'intervention':
        return environment.apis.planning.interventions;
      default:
        throw Error('Invalid entity type');
    }
  }
}
