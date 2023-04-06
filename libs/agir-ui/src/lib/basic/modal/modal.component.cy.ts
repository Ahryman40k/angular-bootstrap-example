import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe(ModalComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(ModalComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(ModalComponent,);
  })

})
