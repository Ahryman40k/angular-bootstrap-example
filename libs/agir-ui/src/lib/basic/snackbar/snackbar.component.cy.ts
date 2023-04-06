import { TestBed } from '@angular/core/testing';
import { SnackbarComponent } from './snackbar.component';

describe(SnackbarComponent.name, () => {

  beforeEach(() => {
    TestBed.overrideComponent(SnackbarComponent, {
      add: { 
        imports: [],
        providers: []
      }
    }) 
  })

  it('renders', () => {
     cy.mount(SnackbarComponent,);
  })

})
