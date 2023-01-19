import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AnnualProgramExpand } from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IGlobalFavorite } from 'src/app/shared/models/favorite/global-favorite';
import { IGlobalLabel } from 'src/app/shared/models/filters/global-filter-label';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { GlobalFavoriteService } from 'src/app/shared/services/filters/global-favorite.service';
import { GlobalFilterLabelService } from 'src/app/shared/services/filters/global-filter-label.service';
import { GlobalLayerLabelService } from 'src/app/shared/services/layer/global-layer-label.service';
import { MapNavigationService, MapOutlet } from 'src/app/shared/services/map-navigation.service';

import { defaultAnnualProgramFields } from '../../../../../program-book/program-book-fields';
import { DeleteFavoriteModalComponent } from '../delete-favorite-modal/delete-favorite-modal.component';

@Component({
  selector: 'app-selected-favorite',
  templateUrl: './selected-favorite.component.html',
  styleUrls: ['./selected-favorite.component.scss']
})
export class SelectedFavoriteComponent extends BaseComponent implements OnInit {
  public selectedFavorite: IGlobalFavorite;
  public favoriteLabel$: Observable<IGlobalLabel[]>;
  public favoriteLabelsControl = new FormControl();
  public isLoading = true;

  constructor(
    private readonly dialogsService: DialogsService,
    private readonly globalFavoriteService: GlobalFavoriteService,
    private readonly globalFilterLabelService: GlobalFilterLabelService,
    private readonly globalLayerLabelService: GlobalLayerLabelService,
    private readonly mapNavigationService: MapNavigationService,
    private readonly annualProgramService: AnnualProgramService,
    private readonly route: ActivatedRoute
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initFilterLabels();
  }

  private initFilterLabels(): void {
    this.annualProgramService
      .getAll(defaultAnnualProgramFields, [AnnualProgramExpand.programBooks])
      .then(annualProgram => {
        const programBooks = flatten(annualProgram.items.map(a => a.programBooks));
        const filterLabels$ = this.globalFilterLabelService.createFilterLabelsObservable(
          programBooks,
          this.destroy$,
          this.route.params.pipe(
            switchMap(favorite => this.globalFavoriteService.getOne(favorite.id)),
            tap(favorite => (this.selectedFavorite = favorite)),
            map(favorite => favorite?.filter)
          )
        );
        const layerLabels$ = this.globalLayerLabelService.createLayerLabelsObservable(
          this.destroy$,
          this.route.params.pipe(
            switchMap(favorite => this.globalFavoriteService.getOne(favorite.id)),
            tap(favorite => (this.selectedFavorite = favorite)),
            map(favorite => favorite?.layer)
          )
        );
        this.favoriteLabel$ = combineLatest(filterLabels$, layerLabels$).pipe(
          takeUntil(this.destroy$),
          map(([filter, layer]) => [...filter, ...layer])
        );
        this.favoriteLabel$.subscribe(favorite => {
          this.favoriteLabelsControl.setValue(favorite.map(l => l.key));
        });
        this.isLoading = false;
      })
      .catch(() => undefined);
  }

  public selectFavorite(): void {
    this.globalFavoriteService.selectFavorite(this.selectedFavorite);
    void this.mapNavigationService.navigateTo(MapOutlet.leftPanel, ['current']);
  }

  public async deleteFavorite(): Promise<void> {
    const modal = this.dialogsService.showModal(DeleteFavoriteModalComponent);
    modal.componentInstance.favorite = this.selectedFavorite;
    await modal.result;
  }
}
