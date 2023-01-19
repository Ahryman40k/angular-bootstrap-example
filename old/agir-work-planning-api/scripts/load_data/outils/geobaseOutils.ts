import { Feature, LineString } from '@turf/helpers';
import * as turf from '@turf/turf';

import * as fs from 'fs';

const data: string = fs.readFileSync('./scripts/load_data/outils/geobaselight.json', 'utf8');
const parsedData = JSON.parse(data);
// tslint:disable-next-line:no-console
console.log(`geobase chargée. ${parsedData.features.length} objets`);

interface ITroncon extends Feature {
  properties: {
    ID_TRC: number;
  };
}

/**
 *
 * Ce programme utilise la géobase des données ouvertes.
 * Source: http://donnees.ville.montreal.qc.ca/dataset/984f7a68-ab34-4092-9204-4bdfcca767c5/resource/9d3d60d8-4e7f-493e-8d6a-dcd040319d8d/download/geobase.json
 *
 * Les tronçons chargés en mémoire par id.
 */
class Geobase {
  private readonly features: ITroncon[] = [];
  private readonly commenceA = {};
  private readonly ids = {};

  constructor(geobaseList: any) {
    this.features = geobaseList.features;
    geobaseList.features.forEach((troncon: any) => {
      // Création d'un index par id
      this.ids[troncon.properties.ID_TRC] = troncon;

      this.ajouterTronconAIndexDeNoeud(troncon);
    });
  }

  /**
   * Permet la création d'un index qui permet de retrouver les tronçons qui commencent
   * à un certain noeud
   */
  private ajouterTronconAIndexDeNoeud(element: any) {
    const cleDebut = this.getFirstPointKey(element);

    if (!this.commenceA[cleDebut]) {
      this.commenceA[cleDebut] = [];
    }
    this.commenceA[cleDebut].push(element);
  }

  /**
   *
   * @param troncon
   */
  private getFirstPointKey(troncon: any) {
    return this.keyFromPoint(troncon.geometry.coordinates[0]);
  }

  private getLastPointKey(troncon: any) {
    return this.keyFromPoint(troncon.geometry.coordinates[troncon.geometry.coordinates.length - 1]);
  }

  /**
   *
   * @param points Un point représenter par une liste de 2 élements
   */
  private keyFromPoint(points: any[]) {
    return `${points[0].toString()}_${points[1].toString()}`;
  }

  /**
   * Choisi un troncon au hasard et returne nbTroncon qui y sont attachés
   * @param nbPoint
   */
  public obtenirTronconsContigues(nbPoint: number): ITroncon[] {
    const path: ITroncon[] = [];
    let troncon: ITroncon = this.getRandomFeature();

    for (let i = 0; i < nbPoint; i++) {
      path.push(troncon);
      const endPoint = this.getLastPointKey(troncon);
      if (this.commenceA[endPoint]) {
        troncon = this.commenceA[endPoint][0] as ITroncon;
      } else {
        return path;
      }
    }
    return path;
  }

  /**
   * Choisi un troncon au hasard et retourne des tronçons qui y sont attachés pour une distance
   * d'au moins *distance* metres
   * @param distance en mètres
   */
  public obtenirTronconsContiguesDistance(distance: number): ITroncon[] {
    const path: ITroncon[] = [];
    let troncon: ITroncon = this.getRandomFeature();
    let totalLength = 0;
    while (troncon) {
      path.push(troncon);
      const l = turf.length(troncon as any, { units: 'meters' }); // e.g: 20 km
      totalLength += l;
      if (totalLength > distance) {
        return path;
      }

      const endPoint = this.getLastPointKey(troncon);

      if (this.commenceA[endPoint]) {
        troncon = this.commenceA[endPoint][0] as ITroncon;
      } else {
        return path;
      }
    }
    return path;
  }

  /**
   * Retourne un feature LineString à partir d'une liste de troncons
   * @param troncons Une liste de tronçon de la géobase
   */
  public fusionner(troncons: ITroncon[]): Feature<LineString> {
    const f: Feature<LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [] as any[]
      },
      properties: {}
    };

    let nbTroncon = 0;
    for (const troncon of troncons) {
      let nbP = 0;
      for (const p of (troncon.geometry as any).coordinates) {
        if (nbTroncon === 0 || nbP > 0) {
          // console.log(p);
          f.geometry.coordinates.push(p);
        }
        nbP++;
      }
      nbTroncon++;
    }
    return f;
  }

  /**
   * Retourne un tronçon au hazard
   */
  public getRandomFeature(): ITroncon {
    return this.features[Math.floor(Math.random() * this.features.length)];
  }

  /**
   * Divise une LineString en points séparés par une égale distance.
   *
   * @param aFeature Un feature de type LineString
   * @param speedKMH La vitesse du véhicule
   * @param intervalEntreCapture
   */
  public pointsAlong(aFeature: any, speedKMH: number, intervalEntreCapture: number) {
    const longueur = turf.length(aFeature as any, { units: 'meters' }); // e.g: 20 km
    const speedMH = speedKMH * 1000; // à 50 km/h
    const dureeH = longueur / speedMH;
    const dureeS = dureeH * 3600;
    const nbDeMorceau = dureeS / intervalEntreCapture;

    const featureCollection = turf.lineChunk(aFeature, longueur / nbDeMorceau, { units: 'meters' });
    const points = featureCollection.features.map((lineFeat, index) => {
      return {
        type: 'Feature',
        properties: {
          secondOffset: index
        },
        geometry: {
          type: 'Point',
          coordinates: lineFeat.geometry.coordinates[0]
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features: points
    };
  }

  /**
   *
   * @param aFeature
   * @param nbPerSqMeter
   */
  public randomPointsAroundLines(aFeature: any, nbPerSqMeter: number) {
    const polygon = turf.buffer(aFeature, 30, { units: 'metres' });
    const bb = turf.bbox(polygon);
    const aream2 = turf.area(polygon);
    let points = turf.randomPoint(aream2 * nbPerSqMeter, { bbox: bb });
    points = turf.pointsWithinPolygon(points, polygon);
    return points;
  }
}

export const geobase = new Geobase(parsedData);
