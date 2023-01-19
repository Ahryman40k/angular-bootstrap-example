import { ApplicationRef, ComponentFactoryResolver, ComponentRef, Injectable, Injector, Type } from '@angular/core';

export interface IDynamicComponentResult<T> {
  componentRef: ComponentRef<T>;
  html: HTMLDivElement;
}

@Injectable({
  providedIn: 'root'
})
export class DynamicComponentService {
  private compRef: ComponentRef<any>;

  constructor(
    private readonly injector: Injector,
    private readonly resolver: ComponentFactoryResolver,
    private readonly appRef: ApplicationRef
  ) {}

  public injectComponent<T>(
    component: Type<T>,
    injector?: Injector,
    ...classNames: string[]
  ): IDynamicComponentResult<T> {
    // Resolve the Component and Create
    const compFactory = this.resolver.resolveComponentFactory(component);
    this.compRef = compFactory.create(injector || this.injector);

    // Attach to Application
    this.appRef.attachView(this.compRef.hostView);

    // Create Wrapper Div and Inject Html
    const div = document.createElement('div');
    if (classNames) {
      div.classList.add(...classNames);
    }
    div.appendChild(this.compRef.location.nativeElement);

    // Return the Rendered DOM Element
    return {
      componentRef: this.compRef,
      html: div
    };
  }
}
