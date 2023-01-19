# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.5.6] - 2020-11-03

### Changed

- Correction d'un bug dans la fonction isIntersect qui devait retourner false lorsque turf/intersect ne retourne aucune intersection de polygone
- ajout d'une option 'controls: [DrawControls.Trash]' lors de l'utilisation de l'outil de GeometryDrawToolComponent afin pouvoir ajouter des controls de draw
  ```
    this.map1.useTool(
      'geometry-draw-tool',
      ....,
      ....,
      { mode: 'draw_polygon', controls: [DrawControls.Trash] }
    )
  ```

## [Unreleased]

## [2.5.5] - 2020-08-05

### Changed

- Correction d'un bug dans la fonction isLogicLayerVisible

## [2.5.3] - ßß2020-06-28

### Changed

- Amélioration de l'outil de dessin
- Retrait de dépendances inutiles
- Correction à la couche des arbres qui a changé de nom

## [2.5.2] - 2020-06-28

### Changed

- Trois nouvelles options pour le tool multiple selection, unselectableFeature, preSelectedFeature et itemClickedCallback

## [2.5.1] - 2020-05-28

### Changed

- Ajustement à la source du plan d'intervention pour la sécurité

## [2.5.0] - 2020-05-20

### Added

- Support des sprites configurables

## [2.4.1] - 2020-05-15

### Added

- Ajout de la sécurité

### Changed

- Changement à l'interface de MapConfig

## [1.0.0] - 2019-08-19

### Added

- Ajout de la couche "Plan d'intervention 2016"

### Changed

- Les dépendances sont maintenant passées comme 'peerDependencies'

### Removed
