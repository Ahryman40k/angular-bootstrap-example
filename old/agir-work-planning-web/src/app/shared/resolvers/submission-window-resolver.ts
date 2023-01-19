import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { ISubmission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { SubmissionProjectService } from '../services/submission-project.service';

@Injectable({ providedIn: 'root' })
export class SubmissionWindowResolver implements Resolve<ISubmission> {
  constructor(private readonly submissionProjectService: SubmissionProjectService) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ISubmission> {
    return this.submissionProjectService.getSubmissionById(route.paramMap.get('id'));
  }
}
