import { TestBed } from '@angular/core/testing';
import { RadioComponent } from './radio.component';

describe(RadioComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(RadioComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(RadioComponent,);
  })

})
