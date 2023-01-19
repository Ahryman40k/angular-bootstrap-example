import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { IGlobalFavorite, IGlobalFavoriteProps, initFavorite } from 'src/app/shared/models/favorite/global-favorite';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { GlobalFavoriteService } from 'src/app/shared/services/filters/global-favorite.service';
import { GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

@Component({
  selector: 'app-save-favorite-modal',
  templateUrl: './save-favorite-modal.component.html'
})
export class SaveFavoriteModalComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public submitting = false;
  public favorites: IGlobalFavorite[];

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly globalLayerService: GlobalLayerService,
    private readonly globalFavoriteService: GlobalFavoriteService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    await this.initUserFavorites();
    this.initForm();
  }

  private async initUserFavorites(): Promise<void> {
    this.favorites = await this.globalFavoriteService.getAll().toPromise();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [
        null,
        [
          Validators.required,
          Validators.maxLength(40),
          Validators.minLength(1),
          CustomValidators.favoritesDuplicate(this.favorites)
        ]
      ]
    });
  }

  public cancel(): void {
    this.form.reset();
    this.activeModal.close();
  }

  private async createFavorite(): Promise<void> {
    const favorite: IGlobalFavorite = initFavorite({
      name: this.form.value.name,
      filter: this.globalFilterService.filter,
      layer: this.globalLayerService.layer,
      createdAt: new Date().toISOString()
    });
    await this.globalFavoriteService.create(favorite);
    this.globalFavoriteService.selectFavorite(favorite);
    this.notificationsService.showSuccess('Favori enregistré avec succès');
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    try {
      this.submitting = true;
      await this.createFavorite();
      this.activeModal.close();
    } finally {
      this.submitting = false;
    }
  }
}
