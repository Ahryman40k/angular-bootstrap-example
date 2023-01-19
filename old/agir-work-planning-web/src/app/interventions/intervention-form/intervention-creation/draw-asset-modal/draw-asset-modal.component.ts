import { Component, EventEmitter, Output } from '@angular/core';
import { DrawMode } from 'src/app/shared/services/map-tool.service';

@Component({
  selector: 'app-draw-asset-modal',
  templateUrl: './draw-asset-modal.component.html',
  styleUrls: ['./draw-asset-modal.component.scss']
})
export class DrawAssetModalComponent {
  public DrawMode = DrawMode;

  @Output() public clickEvent = new EventEmitter();

  public closeModal(drawMode: DrawMode): void {
    this.clickEvent.emit(drawMode);
  }
}
