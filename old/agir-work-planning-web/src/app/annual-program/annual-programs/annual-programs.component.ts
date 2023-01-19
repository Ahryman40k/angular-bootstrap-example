import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IEnrichedAnnualProgram, ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { concat } from 'lodash';
import { take } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IMenuItem } from 'src/app/shared/forms/menu-active/menu-active.component';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

import { CollapseComponent } from '../../shared/components/collapse/collapse.component';
import { AnnualProgramModalComponent } from '../annual-program-modal/annual-program-modal.component';

@Component({
  selector: 'app-annual-programs',
  templateUrl: './annual-programs.component.html',
  styleUrls: ['./annual-programs.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AnnualProgramsComponent extends BaseComponent implements OnInit {
  public annualPrograms: IEnrichedAnnualProgram[];
  public annualProgramGroups: IGroup<number, IEnrichedAnnualProgram>[];
  public executorsList: ITaxonomy[];

  public menuItems: IMenuItem[] = [];

  @ViewChild('listContainer')
  public listContainer: ElementRef<HTMLDivElement>;
  @ViewChildren('collapse')
  public collapsePanels: QueryList<CollapseComponent>;

  constructor(
    private readonly dialogsService: DialogsService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
    super();
  }
  public ngOnInit(): any {
    this.taxonomiesService
      .group(this.TaxonomyGroup.executor)
      .pipe(take(1))
      .subscribe(executors => {
        this.executorsList = executors;
        (this.executorsList = concat(
          this.executorsList.filter(e => e.code !== 'other'),
          this.executorsList.find(e => e.code === 'other')
        )),
          (this.menuItems = this.executorsList.map(executor => ({
            key: executor.code,
            label: executor.label.fr,
            link: ['executor/' + executor.code]
          })));
        this.navigateToFirstItem(this.menuItems[0].link);
      });
  }

  public create(): void {
    const modal = this.dialogsService.showModal(AnnualProgramModalComponent);
    modal.componentInstance.buttonLabel = 'Ajouter';
    modal.componentInstance.title = 'Ajouter une programmation annuelle';
  }

  public navigateToFirstItem(route): void {
    const routeSplit: string[] = this.router.routerState.snapshot.url.split('/');
    if (this.menuItems.length) {
      if (routeSplit.length <= 2) {
        void this.router.navigate(['annual-programs/' + route]);
      }
    }
  }
}
