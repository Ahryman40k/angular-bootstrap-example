import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  ANNUAL_PROGRAM_STATUSES_CAN_CHANGE_PROGRAM_BOOKS,
  AnnualProgramExpand,
  AnnualProgramStatus,
  BaseAnnualProgramService,
  IEnrichedAnnualProgram,
  IEnrichedProject,
  IPlainAnnualProgram
} from '@villemontreal/agir-work-planning-lib';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

import { buildHttpParams } from '../http/params-builder';
import { IAnnualProgramFindOptions } from '../models/findOptions/annualProgramFindOptions';
import { PROGRAM_BOOK_FIELDS } from '../models/findOptions/programBookFields';
import { IPaginatedResults } from '../models/paginated-results';
import { FromPage } from './annual-program-menu.service';
import { ProgramBookService } from './program-book.service';

@Injectable({
  providedIn: 'root'
})
export class AnnualProgramService extends BaseAnnualProgramService {
  public cachedPaginatedAnnualPrograms: IPaginatedResults<IEnrichedAnnualProgram>;

  private readonly annualProgramChangedSubject = new Subject<IEnrichedAnnualProgram>();
  public annualProgramChanged$ = this.annualProgramChangedSubject.asObservable();

  private readonly selectedAnnualProgramSubject = new Subject<IEnrichedAnnualProgram>();
  public selectedAnnualProgram$ = this.selectedAnnualProgramSubject.asObservable();

  public fromYear: number;
  public toYear: number;

  constructor(
    private readonly http: HttpClient,
    private readonly programBookService: ProgramBookService,
    private readonly router: Router
  ) {
    super();
    this.annualProgramChanged$.subscribe(() => (this.cachedPaginatedAnnualPrograms = null));
  }
  public updateSelectedAnnualProgram(data) {
    this.selectedAnnualProgramSubject.next(data);
  }
  public updateAnnualprograms() {
    this.annualProgramChangedSubject.next();
  }
  public async getAll(
    fields?: string[],
    expands?: AnnualProgramExpand[],
    isFromYears = false
  ): Promise<IPaginatedResults<IEnrichedAnnualProgram>> {
    const expand = expands ? expands : undefined;
    const criterias: any = {
      expand,
      fields,
      limit: environment.services.pagination.limitMax
    };
    if (isFromYears) {
      if (this.fromYear === this.toYear) {
        criterias.year = this.fromYear;
      } else {
        criterias.fromYear = this.fromYear;
        criterias.toYear = this.toYear;
      }
    }
    const params = buildHttpParams(criterias);
    const paginatedAnnualPrograms = await this.http
      .get<IPaginatedResults<IEnrichedAnnualProgram>>(environment.apis.planning.annualPrograms, { params })
      .toPromise();
    this.cachedPaginatedAnnualPrograms = paginatedAnnualPrograms;
    return paginatedAnnualPrograms;
  }

  /**
   * Gets cached annual programs, or gets them from the back-end, if no cached annual programs were found
   * @returns annual programs
   */
  public async getCachedAnnualPrograms(
    fields?: string[],
    expands?: AnnualProgramExpand[],
    isFromYears = false
  ): Promise<IPaginatedResults<IEnrichedAnnualProgram>> {
    if (this.cachedPaginatedAnnualPrograms?.items.length) {
      return this.cachedPaginatedAnnualPrograms;
    }
    return this.getAll(fields, expands, isFromYears);
  }

  public clearCachedPaginatedAnnualPrograms(): void {
    this.cachedPaginatedAnnualPrograms = null;
  }

  public getOne(id: string, fields?: string[], expands?: AnnualProgramExpand[]): Promise<IEnrichedAnnualProgram> {
    const expand = expands ? expands : undefined;
    const criterias: any = {
      expand,
      fields
    };
    const params = buildHttpParams(criterias);
    return this.http
      .get<IEnrichedAnnualProgram>(`${environment.apis.planning.annualPrograms}/${id}`, { params })
      .toPromise();
  }

  public async create(annualProgram: IPlainAnnualProgram): Promise<void> {
    const annualprogram = await this.http
      .post<IEnrichedAnnualProgram>(`${environment.apis.planning.annualPrograms}`, annualProgram)
      .toPromise();
    this.annualProgramChangedSubject.next(annualprogram);
  }

  public async update(annualProgramId: string, annualProgram: IPlainAnnualProgram): Promise<void> {
    const annualProg = await this.http
      .put<IEnrichedAnnualProgram>(`${environment.apis.planning.annualPrograms}/${annualProgramId}`, annualProgram)
      .toPromise();
    this.annualProgramChangedSubject.next(annualProg);
    this.updateSelectedAnnualProgram(annualProg);
  }

  public canInteract(annualProgram: IEnrichedAnnualProgram): boolean {
    if (!annualProgram) {
      return false;
    }
    const statuses = ANNUAL_PROGRAM_STATUSES_CAN_CHANGE_PROGRAM_BOOKS.map(s => s as string);
    return statuses.includes(annualProgram.status);
  }

  public canEditAnnualProgram(annualProgram: IEnrichedAnnualProgram): boolean {
    const validStatuses = [AnnualProgramStatus.new, AnnualProgramStatus.programming];
    return validStatuses.includes(annualProgram.status as AnnualProgramStatus);
  }

  public canShareAnnualProgram(annualProgram: IEnrichedAnnualProgram): boolean {
    const validStatuses: string[] = [AnnualProgramStatus.new, AnnualProgramStatus.programming];
    return validStatuses.includes(annualProgram.status);
  }

  public async annualProgramContainsProjects(annualProgramId: string): Promise<boolean> {
    const programBooks = await this.programBookService.getAnnualProgramProgramBooks(annualProgramId, [
      PROGRAM_BOOK_FIELDS.PRIORITYSCENARIOS_ORDEREDPROJECTS_PROJECTID
    ]);
    return !!programBooks?.some(pb =>
      pb?.priorityScenarios?.some(scenario => scenario?.orderedProjects?.items?.length)
    );
  }

  public async delete(annualProgram: IEnrichedAnnualProgram, fromPage: FromPage): Promise<void> {
    const annualProgramDeleted = annualProgram;
    await this.http
      .delete<IEnrichedAnnualProgram>(`${environment.apis.planning.annualPrograms}/${annualProgram.id}`)
      .toPromise();
    if (fromPage === 'AnnualProgramList') {
      this.annualProgramChangedSubject.next(annualProgramDeleted);
    } else if (fromPage === 'AnnualProgramDetails') {
      void this.router.navigate(['annual-programs']);
    }
  }

  public patchYears(fromYear: number, toYear: number): void {
    this.fromYear = fromYear;
    this.toYear = toYear;
    this.annualProgramChangedSubject.next();
  }

  public async getAnnualProgramsFilterByOptions(
    annualProgramfindOptions: IAnnualProgramFindOptions
  ): Promise<IPaginatedResults<IEnrichedAnnualProgram>> {
    const params = buildHttpParams(annualProgramfindOptions);
    const paginatedAnnualPrograms = await this.http
      .get<IPaginatedResults<IEnrichedAnnualProgram>>(environment.apis.planning.annualPrograms, { params })
      .toPromise();
    return paginatedAnnualPrograms;
  }
}
