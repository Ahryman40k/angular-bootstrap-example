# @villemontreal/maps-angular-lib-app

Librairie pour le développement d'applications cartographiques avec mapbox et angular

## Versions

La librairie est développé avec la version 7 d'angular

Elle a été testée avec les versions 7 et 8.

# Usage

## Installation des librairies requises

```
npm i @turf/turf mapbox-gl @types/mapbox-gl geojson @mapbox/mapbox-gl-draw @agm/core@1.0.0
```

## Installation de la libraire

```
npm i @villemontreal/maps-angular-lib@0.0.2-pre.build.53
```

> Assurez-vous que le fichier `.npmrc` contient la ligne suivante:
> `registry=https://npm.registry.interne.montreal.ca`

## Importation du module

```
...
import { GisComponentsLibModule } from "@villemontreal/maps-angular-lib";


@NgModule({
  ...
  imports: [BrowserModule, GisComponentsLibModule],
  ...
})
export class AppModule {}
```

## Exclure les modules nodes

À cause de mapbox draw qui importe des modules nodejs tels que path et fs, il est nécessaire d'ajuster le fichier `package.json` pour exclure ces modules:

```
"version": "0.0.0",
"browser": {
    "path": false,
    "fs": false,
    "os": false
  },
```

# Affichage de la carte

Dans le fichier `*.component.html`

```html
<vdm-map id="map1" [mapConfig]="mapConfig"></vdm-map>
```

Dans le fichier `*.component.ts`

```typescript
import { IMapConfig } from "@villemontreal/maps-angular-lib";

protected mapConfig: IMapConfig = {
    mapOptions: {
      container: "map1",
      zoom: 15,
      minZoom: 10,
      maxZoom: 20,
      maxBounds: [[-74.15, 45], [-73.05, 46]],
      center: [-73.5542257, 45.497429]
    },

    // Liste ordonnée des couches qui seront affichées sur la carte. Le premier item est affiché "en-dessous", le dernier sur le "dessus". Les styles sont élaborés et diffusés par le centre d'expertise en géomatique. Cette liste est utilisé par la libraire et permet de créer un style mapbox.
    mapStyleDefinition: [
      "greyBasemap",
      "permits",
      "streetTrees",
      "zoningWaste",
      "fireHydrants",
      "basemapLabels"
    ],

    // Permet de spécifier le domaines des styles. Permet de choisir l'environnement (dev, accept ou prod)
    baseUrl: "https://api.accept.montreal.ca",

    // Il est possible de définir des styles mapbox propre à votre application en utilisant cette propriété. Voir https://docs.mapbox.com/mapbox-gl-js/style-spec/. Voir ci-dessous pour plus d'explication sur les couches custom.
    customMapLayers: {},

    // Permet de définir des sources qui seront référencées dans customMapLayers
    customMapSources: {}
  };
```

> Voir https://docs.mapbox.com/mapbox-gl-js/api/#map pour la valeurs permises pour la propriété `mapOptions`

# Gestions des événements

Il est possible de souscrire à des `Observable` émis lors des interactions de l'usager avec la carte.

## Initialisation de la carte - `load`

Avant de pouvoir souscrire aux événement la carte doit être initialisée.

```typescript
  @ViewChild("map1")
  map: MapComponent;

  ...

  public async ngOnInit(): Promise<void> {
    this.map.subscribeEvent("load").subscribe(isLoaded => {
      if (isLoaded) {
        console.log("Loaded");
      }
    });
  }
```

## Subscribe

```typescript
this.map.subscribeEvent('click').subscribe((x: any) => {
  console.log('On a cliqué sur la carte', x);
});
```

Voir la documentation de Mapbox pour les événements disponibles:
Voir https://docs.mapbox.com/mapbox-gl-js/api/#events

D'autres événvements sont aussi offerts. Ils concernent principalement la visiblité des couches.

- selectionChange
- layerVisibilityChange
- featuresHighlighted

> TODO : Documenter les événements en lien avec les couches

## Modes d'interaction

La notion de mode d'interaction permet de regrouper, sous une même appelation, un ensemble de souscriptions aux observables.

Un exemple permet d'illustrer cela facilement.

Supposons que l'on souhaite avoir deux comportements différents lorsqu'on clique sur la carte.

- Sur le clic, on affiche la coordonnée
- Sur le clic, on ajoute une géomtrie à l'endroit cliqué.

```typescript
  public afficherCoordonnees(evenement) {
     ...
  }

  public ajouterPoint(evenement) {
     ...
  }

  public ajouterGrosPoint(evenement) {
     ...
  }

  public showInConsole(evenement) {
     ...
  }

  public async ngOnInit(): Promise<void> {
    this.map.subscribeEvent("load").subscribe(isLoaded => {
      if (isLoaded) {
        this.map.subscribeEvent("click", "mode-affichage").subscribe(afficherCoordonnees);

        // Il est possible d'ajouter un plusieurs événements dans le même mode d'interaction
        this.map.subscribeEvent("click", "mode-ajout").subscribe(ajouterPoint);
        this.map.subscribeEvent("dblclick", "mode-ajout").subscribe(ajouterGrosPoint);

        // En n'indiquant pas de mode d'interaction, l'événement sera déclenché peu importe le mode d'interaction
        this.map.subscribeEvent("click").subscribe(showInConsole);

      }
    });
  }

  public onClickAfficherCoordonnees(event: any) {
    this.map.interactionMode = "mode-affichage";
  }

  public onClickAjouterPoint(event: any) {
    this.map.interactionMode = "mode-ajout";
  }
```

## Accès aux couches à accès restreint

Certaines couches géomatiques sont à accès restreint pour des raisons de sécurité ou de confidentialité.

L'accès à ces couches exigera un jeton d'accès d'employé.

Voici comment configurer la carte pour passer le jeton d'accès

```typescript
import { IMapConfig } from "@villemontreal/maps-angular-lib";

protected mapConfig: IMapConfig = {
    mapOptions: {
      ...
    },
    mapStyleDefinition: [
      "greyBasemap",
      ...
    ],
    customMapSources: {},

    // La fonction ci-dessous sera appelée à chaque fois qu'une couche sécurisée est demandée.
    // On ajoute une en-tête http d'autorisation avec le jeton d'accès
    authRequestCallback: (url: string, resourceType: mapboxgl.ResourceType): any => {
      // For more info, see https://docs.mapbox.com/mapbox-gl-js/api/ look for transformRequest
      return {
        url,
        headers: { Authorization: 'Bearer ' + authService.getToken() }
      };
      }
  };
```

# Les outils

# Autres fonctionnalités à documenter

## Identification par couche logique

Permet la réutilisation des couches géomatiques de manières uniformes

## Mise en surbrillance (Highlight)

Mise en surbrillance d'objets géomatiques à partir de leur ID. Il est possible de mettre en surbrillance des objets qui n'ont jamais été téléchargés dans une couche vectorielle

## Gestionnaire de couches

Permet d'afficher une structure arborescente pour changer la visibilité des couches

## Sélection

Permet de sélectionner des objets géomatiques à partir d'un clic ou d'une analyse spatiales

## Possibilité d'afficher plusieurs cartes sur une même page

Permet de faire des mini-cartes pour la mise en contexte

# Développement

Cette section décrit comment contributer à cette librairie

## Test local (show case)

```
npm run serve
```

## Les commandes du ng-cli

```
  ng g component --project=gis-components-lib tools/lgnlat-viewer-tool
```

# Documentation générée par ng-cli

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Doc about lib creation

https://angular.io/guide/creating-libraries#refactoring-parts-of-an-app-into-a-library
https://blog.angularindepth.com/creating-a-library-in-angular-6-87799552e7e5
https://blog.angularindepth.com/angular-workspace-no-application-for-you-4b451afcc2ba
