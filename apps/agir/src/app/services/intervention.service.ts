import { inject, Injectable } from '@angular/core';
import { Intervention } from '@ahryman40k/types/intervention-api-types';
import { catchError, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';


const intervention_api = '/v1/intervention' 


@Injectable({
  providedIn: 'root'
})
export class InterventionService {

  private readonly http = inject(HttpClient);

  public create(): Observable<Intervention|null> {
    return this.http.post<Intervention>( intervention_api, {} ).pipe(
      catchError(() => {
        // eslint-disable-next-line no-restricted-syntax
        console.info('Error handled by service...');
        return throwError( () => new Error('Cannot create intervention') );
      } )
    )
  }

  public getAll(): Observable<Intervention[]|null> {
    return this.http.get<Intervention[]>( intervention_api )
  }

  public getById( id: string): Observable<Intervention|null> {
    return this.http.get<Intervention>( intervention_api )
  }

  public updateOne( intervention: Intervention): Observable<Intervention|null> {
    return this.http.put<Intervention>( intervention_api, intervention )
  }

  public deleteOne( id: string): Observable<Intervention|null> {
    return this.http.delete<Intervention>( intervention_api )
  }

  public search( criterias: unknown ): Observable<Intervention|null> {
    return this.http.post<Intervention>( intervention_api, criterias )
  }
}
