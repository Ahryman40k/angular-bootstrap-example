import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe(AvatarComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(AvatarComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(AvatarComponent, {
           componentProperties: {
               profileName:  'Avatar du profil',
               color:  'background-color-1',
          }
       });
  })

})
