/**
 * Library constants
 */
export class Constants {
  /**
   * Privileges related constants
   * GDA Gestion Des Acces
   */
  get GDA() {
    return {
      DOMAIN_CODE_GESTION_TERRITOIRE: 'TERRITORY',
      APPLICATION_CODE_AGIR_PLANING: 'AGIR-PLANNING'
    };
  }
}

export const constants: Constants = new Constants();
