import { TestBed } from '@angular/core/testing';
import { TagComponent } from './tag.component';

describe(TagComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(TagComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(TagComponent, {
           componentProperties: {
               type:  'neutral',
               variant:  'light',
               hiddenText:  'Étiquette',
          }
       });
  })

})
