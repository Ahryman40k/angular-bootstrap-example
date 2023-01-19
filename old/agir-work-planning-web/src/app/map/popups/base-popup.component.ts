import { Subject } from 'rxjs';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

export abstract class BasePopupComponent extends BaseComponent {
  protected initializedSubject = new Subject();
  public initialized$ = this.initializedSubject.asObservable();
  public isInitialized = false;

  constructor() {
    super();
    this.initialized$.subscribe(() => (this.isInitialized = true));
  }

  public abstract init(...args: any): void;
}
