import { ErrorHandler, inject, Injectable, NgZone } from '@angular/core';

@Injectable()
export class AgirErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    this.zone.run(() => {
      // call a snack !
    });
    console.warn('fait chier', error);
  }
}
