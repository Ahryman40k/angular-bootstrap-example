import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

const colorWhite = '#ffffff';
const colorLightBlue = '#e3f3f1';

const hoverOpacity = '0.85';
const regularOpacity = '1';
@Directive({
  selector: '[appDragDropFile]'
})
export class DragDropFileDirective {
  @Output() public onFileDropped = new EventEmitter<any>();

  @HostBinding('style.background-color') public background = colorWhite;
  @HostBinding('style.opacity') public opacity = regularOpacity;

  // Dragover listener
  @HostListener('dragover', ['$event']) public onDragOver(evt): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = colorLightBlue;
    this.opacity = hoverOpacity;
  }

  // Dragleave listener
  @HostListener('dragleave', ['$event']) public onDragLeave(evt): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = colorWhite;
    this.opacity = regularOpacity;
  }

  // Drop listener
  @HostListener('drop', ['$event']) public ondrop(evt): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = colorWhite;
    this.opacity = regularOpacity;
    const files = evt.dataTransfer.files;
    if (files.length > 0) {
      this.onFileDropped.emit(files);
    }
  }
}
