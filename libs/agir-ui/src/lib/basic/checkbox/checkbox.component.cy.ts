import { TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

describe(CheckboxComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(CheckboxComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(CheckboxComponent, {
           componentProperties: {
               id:  null,
               ariaLabel:  '',
               brandBorder:  false,
               inline:  false,
               name:  '',
               hiddenLabel:  false,
               checked:  false,
               disabled:  false,
               required:  false,
               indeterminate:  false,
          }
       });
  })

})
