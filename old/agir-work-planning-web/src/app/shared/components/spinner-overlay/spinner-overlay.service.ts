import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerOverlayService {
  private messageSubject = new Subject<string>();
  private defaultMessage = 'Chargement en cours';
  public message$ = this.messageSubject.asObservable();

  public show(message?: string): void {
    this.messageSubject.next(message || this.defaultMessage);
  }

  public hide(): void {
    this.messageSubject.next(null);
  }
}
