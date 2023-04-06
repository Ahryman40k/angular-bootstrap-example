import { TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe(BadgeComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(BadgeComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(BadgeComponent, {
           componentProperties: {
               type:  '',
          }
       });
  })

})
