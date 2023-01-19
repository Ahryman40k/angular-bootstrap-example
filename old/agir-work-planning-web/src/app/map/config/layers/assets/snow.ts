import { Layer } from 'mapbox-gl';

import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteSymbolLayers } from '../utils';

// Icones to be integrated , to be confirmed by BA
// feuaveccont2: "CHSLD",
// feuaveccont3: "Caserne de pompier",
// feuaveccont4: "Centre d'appels 311",
// feuaveccont5: "Centre d'opération d'urgence (COU)",
// feuaveccont6: "Centre de communication d'urgence",
// feuaveccont7: "Centre de coordination des mesures d'urgence",
// feuaveccont8: "Centre de distribution et de traitement de produits sanguin",
// feuaveccont9: "Centre de recherche",
// feuaveccont14: "Centre de sécurité civile",
// feuaveccont15: "Centre hospitalier",
// feuaveccont16: "Centre intégré MTQ",
// feuaveccont17: "Centre opérationnel",
// feuaveccont19: "Clos de voirie",
// feuaveccont20: "Garage STM",
// feuaveccont21: "Info-Santé - Bureau",
// feuaveccont22: "Lieu SPVM",
// feuaveccont23: "Maison de naissance",
// feuaveccont24: "Poste autoroutier Sûreté du Québec",
// feuaveccont25: "Poste de quartier (SPVM)",
// feuaveccont26: "Quartier général des incendies",
// feuaveccont27: "Réseau de la santé - Autre",
// feuaveccont28: "STM - Autre",
// feuaveccont29: "Site de surface",
// feuaveccont31: "Sécurité Publique",
// feuaveccont32: "Sûreté du Québec",

export const sensitiveSite: Layer[] = [
  ...createCompleteSymbolLayers(MapLayers.SENSITIVES_SITES, MapLayersSources.NEIGE, mapStyleConfig.asset.sensitiveSite)
];

export const sewerDrop: Layer[] = [
  ...createCompleteSymbolLayers(MapLayers.SEWER_DROP, MapLayersSources.NEIGE, mapStyleConfig.asset.sewerDrop)
];
