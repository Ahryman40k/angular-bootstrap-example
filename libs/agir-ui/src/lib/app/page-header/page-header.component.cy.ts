import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from '../../basic/button/button.component';
import { IconComponent } from '../../basic/icon/icon.component';
import { PageHeaderComponent } from './page-header.component';

describe(PageHeaderComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(PageHeaderComponent, {
      add: { 
        imports: [ ButtonComponent, IconComponent],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(PageHeaderComponent, {
           componentProperties: {
               title:  "On n'a pas trouve de titre !",
          }
       });
  })

})
