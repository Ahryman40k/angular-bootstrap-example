import { Injectable } from '@angular/core';
import { cloneDeep, isEmpty, isEqual, remove } from 'lodash';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { IGlobalFavorite, IGlobalFavoriteProps, initFavorite } from '../../models/favorite/global-favorite';
import { NotificationsService } from '../../notifications/notifications.service';
import { GlobalLayerService } from '../global-layer.service';
import { UserLocalStorageService } from '../user-local-storage.service';
import { UserPreferenceService } from '../user-preference.service';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from './global-filter.service';

const globalFilterFavoriteStorageKey = 'global-filter-favorite-storage-key';
const favoriteFilterName = 'favorite-filters';
@Injectable({
  providedIn: 'root'
})
export class GlobalFavoriteService {
  private readonly selectedFavoriteSubject = new BehaviorSubject<IGlobalFavorite>(null);
  public readonly selectedFavorite$ = this.selectedFavoriteSubject.asObservable();

  private readonly favoritesChangedSubject = new Subject();
  public readonly favoritesChanged$ = this.favoritesChangedSubject.asObservable();

  private favorites: IGlobalFavorite[];

  constructor(
    private readonly globalFilterService: GlobalFilterService,
    private readonly globalLayerService: GlobalLayerService,
    private readonly notificationsService: NotificationsService,
    private readonly userLocalStorage: UserLocalStorageService,
    private readonly userPreferenceService: UserPreferenceService
  ) {
    this.selectedFavoriteSubject.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(x => void this.saveFavorite(x));
    void this.initSelectedFavorite();
  }

  private async initSelectedFavorite(): Promise<void> {
    const favorite = await this.userLocalStorage.get<IGlobalFavorite>(globalFilterFavoriteStorageKey);
    if (favorite) {
      this.selectedFavoriteSubject.next(favorite);
    }
  }

  private async saveFavorite(favorite: IGlobalFavorite): Promise<void> {
    await this.userLocalStorage.set(globalFilterFavoriteStorageKey, favorite);
  }

  public create(favorite: IGlobalFavorite): Promise<void> {
    return this.getAll()
      .pipe(
        switchMap(favorites => {
          favorites.push(favorite);
          return this.userPreferenceService.set(favoriteFilterName, favorites);
        }),
        tap(() => this.favoritesChangedSubject.next())
      )
      .toPromise();
  }

  public delete(favorite: IGlobalFavorite): Promise<void> {
    return this.getAll()
      .pipe(
        switchMap(favorites => {
          remove(favorites, f => f.createdAt === favorite.createdAt);
          return this.userPreferenceService.set(favoriteFilterName, favorites);
        }),
        tap(() => this.favoritesChangedSubject.next())
      )
      .toPromise();
  }

  public getAll(): Observable<IGlobalFavorite[]> {
    if (this.favorites) {
      return of(this.favorites);
    }
    return this.userPreferenceService.get<IGlobalFavorite[]>(favoriteFilterName).pipe(
      map(favorites => favorites || []),
      map(favorites => {
        this.favorites = favorites.map(favorite => initFavorite(favorite));
        return this.favorites;
      })
    );
  }

  public getOne(id: string): Observable<IGlobalFavorite> {
    return this.getAll().pipe(map(favorites => favorites?.find(f => f.id === id)));
  }

  public async update(favorite: IGlobalFavorite): Promise<void> {
    return this.getAll()
      .pipe(
        switchMap(favorites => {
          const favoriteToUpdate = favorites.find(f => f.id === favorite.id);
          if (favoriteToUpdate) {
            favoriteToUpdate.filter = favorite.filter;
            favoriteToUpdate.layer = favorite.layer;
          }
          return this.userPreferenceService.set(favoriteFilterName, favorites);
        }),
        tap(() => this.favoritesChangedSubject.next())
      )
      .toPromise();
  }

  public selectFavorite(favorite: IGlobalFavorite): void {
    this.selectedFavoriteSubject.next(favorite);
    if (favorite) {
      this.globalFilterService.filter = cloneDeep(favorite.filter);
      this.globalLayerService.layer = cloneDeep(favorite.layer);
    }
  }

  public getSelectedFavorite(): IGlobalFavorite {
    return this.selectedFavoriteSubject.value;
  }

  public async submitFavoriteToUpdate(favorite: IGlobalFavoriteProps): Promise<void> {
    if (isEmpty(this.globalFilterService.filter) && isEmpty(this.globalLayerService.layer)) {
      return this.notificationsService.showError('Le favori ne peut pas contenir aucun filtre et aucune couche');
    }

    if (
      isEqual(this.globalFilterService.filter, favorite.filter) &&
      isEqual(this.globalLayerService.layer, favorite.layer)
    ) {
      return;
    }

    const updatedFavorite: IGlobalFavorite = initFavorite({
      name: favorite.name,
      filter: this.globalFilterService.filter,
      layer: this.globalLayerService.layer,
      createdAt: favorite.createdAt
    });
    await this.update(updatedFavorite);
    this.selectFavorite(updatedFavorite);
    this.notificationsService.showSuccess('Le favori a bien été modifié');
  }

  public cancelUpdate(): void {
    this.globalFilterService.filter = this.getSelectedFavorite().filter;
    this.globalLayerService.layer = this.getSelectedFavorite().layer;
  }
}
