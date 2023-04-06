import { TestBed } from '@angular/core/testing';
import { CheckboxGroupComponent } from './checkbox-group.component';

describe(CheckboxGroupComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(CheckboxGroupComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(CheckboxGroupComponent, {
           componentProperties: {
               id:  null,
          }
       });
  })

})
