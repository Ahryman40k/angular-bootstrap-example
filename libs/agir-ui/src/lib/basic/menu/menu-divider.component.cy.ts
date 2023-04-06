import { TestBed } from '@angular/core/testing';
import { MenuDividerComponent } from './menu-divider.component';

describe(MenuDividerComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(MenuDividerComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(MenuDividerComponent,);
  })

})
