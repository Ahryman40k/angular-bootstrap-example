import { TestBed } from '@angular/core/testing';
import { BreadcrumbComponent } from './breadcrumb.component';

describe(BreadcrumbComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(BreadcrumbComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(BreadcrumbComponent,);
  })

})
