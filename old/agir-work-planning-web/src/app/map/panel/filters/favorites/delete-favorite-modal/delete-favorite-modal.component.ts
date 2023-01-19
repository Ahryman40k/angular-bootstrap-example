import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IGlobalFavorite } from 'src/app/shared/models/favorite/global-favorite';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { GlobalFavoriteService } from 'src/app/shared/services/filters/global-favorite.service';

@Component({
  selector: 'app-delete-favorite-modal',
  templateUrl: './delete-favorite-modal.component.html'
})
export class DeleteFavoriteModalComponent extends BaseComponent implements OnInit {
  @Input() public favorite: IGlobalFavorite;

  public submitting = false;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly globalFavoriteService: GlobalFavoriteService,
    private readonly notificationService: NotificationsService
  ) {
    super();
  }

  public cancel(): void {
    this.activeModal.close();
  }

  public async submit(): Promise<void> {
    this.submitting = true;
    await this.globalFavoriteService.delete(this.favorite);
    this.globalFavoriteService.selectFavorite(null);
    this.activeModal.close();
    this.notificationService.showSuccess('Favori supprimé avec succès');
  }
}
