import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe(ButtonComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(ButtonComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(ButtonComponent, {
           componentProperties: {
               displayType:  'utility',
               level:  'primary',
               size:  'medium',
               loading:  false,
               reversed:  false,
               loadingSpinnerAriaLabel:  'chargement',
               fullWidth:  false,
          }
       });
  })

})
