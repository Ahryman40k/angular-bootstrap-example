import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

export enum BroadcastEvent {
  interventionCreated = 'interventionCreated',
  interventionUpdated = 'interventionUpdated',
  projectCreated = 'projectCreated',
  projectUpdated = 'projectUpdated',
  fromYearUpdated = 'fromYearUpdated'
}
export enum BroadcastEventException {
  projectUpdate = 'projectUpdate',
  projectCreate = 'projectCreate',
  interventionCreate = 'interventionCreate',
  interventionEdit = 'interventionEdit',
  opportunityNoticeResponseInterventionCreation = 'opportunityNoticeResponseInterventionCreation'
}
@Injectable({
  providedIn: 'root'
})
export class WindowBroadcastService {
  private readonly broadcastChannel = new BroadcastChannel('agir-planification-channel');

  private readonly messageSubject = new Subject<any>();
  public message$ = this.messageSubject.asObservable();

  constructor() {
    this.broadcastChannel.onmessage = ev => {
      this.messageSubject.next(ev.data);
    };
  }

  public observable<T>(id: BroadcastEvent, takeUntil$: Observable<any> = null): Observable<T> {
    let obs = this.messageSubject.asObservable();
    obs = obs.pipe(filter(x => x.id === id));
    if (takeUntil$) {
      obs = obs.pipe(takeUntil(takeUntil$));
    }
    return obs.pipe(map(x => x.data as T));
  }

  public publish<T>(id: BroadcastEvent, data: T = null): void {
    const eventData = { id, data };
    this.broadcastChannel.postMessage(eventData);
    this.messageSubject.next(eventData);
  }
}
