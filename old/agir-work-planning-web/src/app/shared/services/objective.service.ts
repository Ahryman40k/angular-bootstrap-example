import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEnrichedObjective, IPlainObjective } from '@villemontreal/agir-work-planning-lib/dist/src';
import { merge, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface IProgramBookObjectivesProvider {
  getAll(programBookId: string): Observable<IEnrichedObjective[]>;
}

@Injectable({
  providedIn: 'root'
})
export class ObjectiveService implements IProgramBookObjectivesProvider {
  private readonly objectivesChangedSubject = new Subject();
  public readonly objectivesChanged$ = this.objectivesChangedSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  public create(programBookId: string, objective: IPlainObjective): Promise<IEnrichedObjective> {
    return this.http
      .post<IEnrichedObjective>(`${environment.apis.planning.programBooks}/${programBookId}/objectives`, objective)
      .pipe(tap(() => this.objectivesChangedSubject.next()))
      .toPromise();
  }

  public getAll(programBookId: string): Observable<IEnrichedObjective[]> {
    return this.http.get<IEnrichedObjective[]>(`${environment.apis.planning.programBooks}/${programBookId}/objectives`);
  }

  public async patch(
    programBookId: string,
    objective: IEnrichedObjective,
    input: Partial<IPlainObjective>
  ): Promise<void> {
    const plainObjective: IPlainObjective = {
      name: objective.name,
      targetType: objective.targetType,
      objectiveType: objective.objectiveType,
      requestorId: objective.requestorId,
      assetTypeIds: objective.assetTypeIds,
      workTypeIds: objective.workTypeIds,
      pin: objective.pin,
      referenceValue: objective.values.reference
    };
    Object.assign(plainObjective, input);
    await this.update(programBookId, plainObjective, objective.id);
  }

  public async update(programBookId: string, objective: IPlainObjective, objectiveId: string): Promise<void> {
    await this.http
      .put<IEnrichedObjective>(
        `${environment.apis.planning.programBooks}/${programBookId}/objectives/${objectiveId}`,
        objective
      )
      .pipe(tap(() => this.objectivesChangedSubject.next()))
      .toPromise();
  }

  public async delete(programBookId: string, objectiveId: string): Promise<void> {
    await this.http
      .delete<IPlainObjective>(`${environment.apis.planning.programBooks}/${programBookId}/objectives/${objectiveId}`)
      .pipe(tap(() => this.objectivesChangedSubject.next()))
      .toPromise();
  }
}
