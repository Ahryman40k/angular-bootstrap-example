import { TestBed } from '@angular/core/testing';
import { createOutputSpy } from 'cypress/angular';
import { AlertComponent } from './alert.component';

describe(AlertComponent.name, () => {
  beforeEach(() => {
    TestBed.overrideComponent(AlertComponent, {
      add: {
        imports: [],
        providers: [],
      },
    });
  });

  type TestDescriptor = {
    name: string;
    type: 'emergency' | 'danger' | 'info' | 'success' | 'warning';
    dismissible: boolean;
    icon: string;
  };

  const tests: TestDescriptor[] = [
    { name: 'informative', type: 'info', dismissible: false, icon: 'info' },
    { name: 'informative', type: 'info', dismissible: true, icon: 'info' },
    { name: 'danger', type: 'danger', dismissible: false, icon: 'error' },
    { name: 'danger', type: 'danger', dismissible: true, icon: 'error' },
    { name: 'success', type: 'success', dismissible: false, icon: 'check-circle' },
    { name: 'success', type: 'success', dismissible: true, icon: 'check-circle' },
    { name: 'emergency', type: 'emergency', dismissible: false, icon: 'emergency' },
    { name: 'emergency', type: 'emergency', dismissible: true, icon: 'emergency' },
    { name: 'warning', type: 'warning', dismissible: false, icon: 'warning' },
    { name: 'warning', type: 'warning', dismissible: true, icon: 'warning' },

  ]
  
  tests.forEach((t) =>
    it(`should render ${t.name} alert`, () => {
      cy.mount(AlertComponent, {
        componentProperties: {
          type: t.type,
          dismissible: t.dismissible,
          dismiss: createOutputSpy('dismissEventSpy'),
        },
      });
      cy.get('div[role="alert"]').should('be.visible');
      cy.get(`vdm-icon.vdm-icon-${t.icon}`).should('be.visible');

      if (t.dismissible) {
        cy.get('vdm-icon.vdm-icon-x').should('be.visible').click();
        cy.get('@dismissEventSpy').should('have.been.called', 1);
      } else {
        cy.get('vdm-icon.vdm-icon-x').should('not.exist');
      }
    })
  );


});
