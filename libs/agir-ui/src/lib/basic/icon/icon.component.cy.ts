import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe(IconComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(IconComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(IconComponent, {
           componentProperties: {
               color:  'default',
               size:  'x-small',
               svgIcon:  '',
               title:  '',
          }
       });
  })

})
