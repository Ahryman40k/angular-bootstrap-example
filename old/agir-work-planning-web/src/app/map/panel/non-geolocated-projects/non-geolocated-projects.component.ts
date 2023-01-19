import { Component } from '@angular/core';
import { IEnrichedProject, ProjectExpand } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, sortBy } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { PROJECT_SEARCH_FIELDS_PARAMS } from 'src/app/shared/models/projects/search-fields-params';
import { ProjectMenuService } from 'src/app/shared/services/project-menu.service';
import { ProjectService } from 'src/app/shared/services/project.service';

@Component({
  selector: 'app-non-geolocated-projects',
  templateUrl: './non-geolocated-projects.component.html',
  styleUrls: ['./non-geolocated-projects.component.scss']
})
export class NonGeolocatedProjectsComponent extends BaseComponent {
  public isLoading = true;

  public projectsWithAnnualPrograms$ = combineLatest(
    this.projectService.projectChanged$.pipe(startWith(null)),
    this.projectService.filter$.pipe(startWith(null))
  ).pipe(
    switchMap(() =>
      this.searchNonGeolocatedProjects().pipe(
        switchMap(projects =>
          this.projectMenuService.getCompatibleAnnualProgramBooks(projects).finally(() => (this.isLoading = false))
        )
      )
    ),
    takeUntil(this.destroy$)
  );

  constructor(
    private readonly projectService: ProjectService,
    private readonly projectMenuService: ProjectMenuService
  ) {
    super();
  }

  private searchNonGeolocatedProjects(): Observable<IEnrichedProject[]> {
    const nonGeolocatedFilter = cloneDeep(this.projectService.filter);
    nonGeolocatedFilter.isGeolocated = false;
    nonGeolocatedFilter.expand = [ProjectExpand.programBook];
    nonGeolocatedFilter.fields = PROJECT_SEARCH_FIELDS_PARAMS.join(',');
    return this.projectService.searchProjects(nonGeolocatedFilter).pipe(
      map(x => x.items),
      map(x => sortBy(x, 'id'))
    );
  }
}
