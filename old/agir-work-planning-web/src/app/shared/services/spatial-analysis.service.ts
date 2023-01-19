import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import { IGeometry } from '@villemontreal/agir-work-planning-lib';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { IBorough } from 'src/app/shared/models/spatial-analysis/borough.model';
import { environment } from 'src/environments/environment';

export enum AnalysisLayerIds {
  boroughs = 'terrestrialboroughs'
}

@Injectable({
  providedIn: 'root'
})
export class SpatialAnalysisService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Gets spatial analysis
   * @template T
   * @param method
   * @param params
   * @returns spatial analysis
   */
  public getSpatialAnalysis<T>(method: string, params: any): Promise<IPaginatedResults<T>> {
    return this.http
      .get<IPaginatedResults<T>>(`${environment.apis.spatialAnalysis.url}/${method}`, { params })
      .toPromise();
  }

  // TODO this will also be moved to a backend service. Need to clarify where first.
  /**
   * Gets borough
   * @param geometry
   * @returns borough
   */
  public async getBorough(geometry: IGeometry): Promise<IBorough> {
    const centroid: turf.Feature<turf.Point> = turf.centroid(geometry);
    const boroughData: IPaginatedResults<IBorough> = await this.getSpatialAnalysis<IBorough>('intersect', {
      datasourceId: AnalysisLayerIds.boroughs,
      long: centroid.geometry.coordinates[0],
      lat: centroid.geometry.coordinates[1]
    });
    return boroughData?.items[0];
  }

  /**
   * Gets a centroid that is located on a geomery
   * @param geometry
   * @returns Point Geometry
   */
  public nearestCentroid(geometry: IGeometry): IGeometry {
    // TODO: Return the real centroid. Generate the pin from the server.
    return turf.pointOnFeature(geometry).geometry;
  }

  /**
   * Retrieves the intersection area percentage.
   * Returns an array of 2 percentages of area.
   * First item is the percentage of intersection area of geometry 1 and
   * the second item is the percentage of intersection area of geometry 2 and
   * @param geom1 The first geometry.
   * @param geom2 The second geometry.
   */
  public intersectionAreaPercentage(geom1: IGeometry, geom2: IGeometry): [number, number] {
    const polygon1 = turf.polygon(geom1.coordinates as any);
    const polygon2 = turf.polygon(geom2.coordinates as any);
    const intersection = turf.intersect(polygon1, polygon2);

    return [polygon1, polygon2].map(p => {
      const area = turf.area(p);
      return area && intersection ? (turf.area(intersection) / area) * 100 : 0;
    }) as [number, number];
  }

  /**
   * Returns whether a geomety meet the percentage tolerance of intersection area to one another.
   * @param geom1 The first geometry.
   * @param geom2 The second geometry.
   * @param tolerancePercentage The tolerance percentage.
   */
  public someMeetIntersectionAreaPercentage(geom1: IGeometry, geom2: IGeometry, tolerancePercentage: number): boolean {
    const percs = this.intersectionAreaPercentage(geom1, geom2);
    return percs.some(x => x >= tolerancePercentage);
  }

  public scaleBbox(bbox: turf.BBox, factor: number): turf.BBox {
    const bboxPolygon = turf.bboxPolygon(bbox);
    const scaledPolygon = turf.transformScale(bboxPolygon, factor, { origin: 'center' });
    return turf.bbox(scaledPolygon);
  }

  public bufferBbox(geometry: IGeometry, bufferMeters: number): turf.BBox {
    return turf.bbox(turf.buffer(turf.bboxPolygon(turf.bbox(geometry)), bufferMeters, { units: 'meters' }));
  }

  public geometryContains(geometry: IGeometry, containedGeometries: IGeometry[]): boolean {
    const noMultiGeometryList = this.getNoMultiGeometryList(containedGeometries);
    return noMultiGeometryList.every(noMultiGeometry => turf.booleanContains(geometry, noMultiGeometry));
  }

  public getUnifiedMultiPolygonGeometry(multiPolygon: any): IGeometry {
    if (multiPolygon?.geometry?.type !== 'MultiPolygon') {
      return multiPolygon.geometry.type === 'Polygon' ? (multiPolygon.geometry as IGeometry) : null;
    }

    const polygons = multiPolygon.geometry.coordinates.map(x => turf.buffer(turf.polygon(x), 1, { units: 'meters' }));
    const unified = turf.union(...polygons);
    return unified.geometry.type === 'Polygon' ? (unified.geometry as IGeometry) : null;
  }

  private getNoMultiGeometryList(containedGeometries: IGeometry[]): IGeometry[] {
    const geometries: IGeometry[] = [];
    containedGeometries.forEach(containedGeometry => {
      switch (containedGeometry.type) {
        case 'MultiLineString':
        case 'MultiPoint':
        case 'MultiPolygon':
          geometries.push(
            ...(containedGeometry.coordinates as any[]).map(coord => {
              return {
                type: containedGeometry.type.substring(5),
                coordinates: coord
              } as IGeometry;
            })
          );
          break;
        default:
          geometries.push(containedGeometry);
      }
    });
    return geometries;
  }
}
