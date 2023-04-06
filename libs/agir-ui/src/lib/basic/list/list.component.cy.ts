import { TestBed } from '@angular/core/testing';
import { ListItemComponent } from './list.component';

describe(ListItemComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(ListItemComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(ListItemComponent,);
  })

})
