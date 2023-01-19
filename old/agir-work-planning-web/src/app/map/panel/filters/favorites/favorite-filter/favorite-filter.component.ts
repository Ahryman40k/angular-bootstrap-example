import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { orderBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IGlobalFavorite } from 'src/app/shared/models/favorite/global-favorite';
import { GlobalFavoriteService } from 'src/app/shared/services/filters/global-favorite.service';
import { MapNavigationService, MapOutlet } from 'src/app/shared/services/map-navigation.service';

@Component({
  selector: 'app-favorite-filter',
  templateUrl: './favorite-filter.component.html',
  styleUrls: ['./favorite-filter.component.scss']
})
export class FavoriteFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public favorites$: Observable<IGlobalFavorite[]>;
  public favorites: IGlobalFavorite[];
  public isOrderedAsc = false;
  public isLoading = true;

  constructor(
    private readonly fb: FormBuilder,
    private readonly globalFavoriteService: GlobalFavoriteService,
    private readonly mapNavigationService: MapNavigationService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initFavorite();
    this.initForm();
  }

  private initFavorite(): void {
    this.favorites$ = this.globalFavoriteService.favoritesChanged$.pipe(
      takeUntil(this.destroy$),
      startWith(null),
      switchMap(() => this.globalFavoriteService.getAll()),
      map(favorites => orderBy(favorites, f => f.createdAt, 'desc'))
    );
    this.favorites$.subscribe(x => {
      this.favorites = x;
      this.isLoading = false;
    });
  }

  private initForm(): void {
    const favorite = this.globalFavoriteService.getSelectedFavorite();
    this.form = this.fb.group({
      selectedFavorite: favorite?.id
    });
    if (favorite) {
      const args = ['favorite', favorite.id];
      void this.mapNavigationService.navigateTo(MapOutlet.leftPanel, args);
    }
  }

  public orderByDate(): void {
    this.favorites = orderBy(this.favorites, f => f.createdAt, this.isOrderedAsc ? 'asc' : 'desc');
    this.isOrderedAsc = !this.isOrderedAsc;
  }
}
