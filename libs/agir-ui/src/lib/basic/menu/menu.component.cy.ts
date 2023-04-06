import { TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';

describe(MenuComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(MenuComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(MenuComponent,);
  })

})
