import { AllGeoJSON, Feature, LineString, MultiLineString, MultiPolygon, Point, Polygon } from '@turf/helpers';
import simplify from '@turf/simplify';
import {
  bbox,
  bboxPolygon,
  buffer,
  centroid,
  feature,
  featureCollection,
  lineSplit,
  lineString,
  multiLineString,
  multiPolygon,
  nearestPoint,
  nearestPointOnLine,
  pointGrid,
  polygon,
  union
} from '@turf/turf';
import { AssetGeometryType, IFeature, IGeometry } from '@villemontreal/agir-work-planning-lib';
import geojsonPathFinder = require('geojson-path-finder');

import { constants } from '../../config/constants';
import { assetService } from './assetService';
import { BUFFER_PROJECT_AREA_DISTANCE_METERS } from './projectWorkAreaService';
import { spatialAnalysisService } from './spatialAnalysisService';
import { AnalysisLayerIds } from './spatialAnalysisService/spatialAnalysisEnum';

const SIMPLIFICATION_TOLERANCE = 0.000003;
const BUFFERED_MULTI_POLYGON_BBOX_METERS = 200;
const BUFFER_LINK_METERS = 0.05;
export const BUFFER_INTERVENTION_AREA_METERS = 1;
export const GEOJSON_PATH_FINDER_PRECISION_LEVEL = 5;
// Its multiply by two because otherwise many times the shortestpath will not be found
export const GEOJSON_PATH_FINDER_PRECISION = (1 / Math.pow(10, GEOJSON_PATH_FINDER_PRECISION_LEVEL)) * 2;
class WorkAreaService {
  public simplifyWorkArea<T extends AllGeoJSON>(geojson: T): T {
    if (!geojson) {
      return geojson;
    }
    return simplify(geojson, { tolerance: SIMPLIFICATION_TOLERANCE, highQuality: true });
  }

  /**
   * Generate a work area for project based on multiple polygons.
   *
   * Retrieves the surrounding roads and find the shortest path between
   * all polygons. From that path, we retrieve the road sections that intersects
   * with the path.
   * @param polygons The polygons.
   * @returns Promise of the generated work area.
   */
  public async generateWorkAreaFromPolygons(polygons: Polygon[], bufferSize: number): Promise<Feature<Polygon>> {
    // Union features
    const newUnion = union(...polygons.map(p => polygon(p.coordinates)));

    // If the union is a polygon, return the buffered project area
    if (newUnion.geometry.type === 'Polygon') {
      return this.bufferArea(newUnion, bufferSize);
    }

    // Turn the union multiPolygon to multiple polygons
    const unionPolygons = spatialAnalysisService
      .multiPolygonToPolygons(newUnion as Feature<MultiPolygon>)
      .map(p => p.geometry);

    // Generate bbox
    const newMultiPolygon = multiPolygon(unionPolygons.map(x => x.coordinates));
    const bufferedMultiPolygonBbox = buffer(bboxPolygon(bbox(newMultiPolygon)), BUFFERED_MULTI_POLYGON_BBOX_METERS, {
      units: 'meters'
    });
    const newBbox = bboxPolygon(bbox(bufferedMultiPolygonBbox)).geometry;

    // Retrieve pavement features and road sections from bbox
    const roadSectionsFs = await this.getRoadSections(newBbox);
    spatialAnalysisService.round(roadSectionsFs, GEOJSON_PATH_FINDER_PRECISION_LEVEL);
    if (!roadSectionsFs || !roadSectionsFs.length) {
      return null; // If no features have been found, we return a null work area.
    }

    // Get points from polygons and road sections
    const points = this.getRoadSectionsPoints(unionPolygons, roadSectionsFs);

    // Get shortest path on road network
    const shortestPath = this.getShortestPath(roadSectionsFs, points);

    // Get pavements from path
    const pavement = await this.getPavement(shortestPath, 0);

    // Unifies pavement and polygons
    let unified = spatialAnalysisService.union(
      ...[...(pavement ? [pavement] : []), ...unionPolygons.map(p => feature(p))]
    );
    unified = this.linkMultiPolygon(unified);

    // Add buffer to project geometry
    return this.bufferArea(unified, bufferSize);
  }

  public async getPolygonsFromGeometries(geometries: IGeometry[]): Promise<Polygon[]> {
    const polygons: Polygon[] = [];

    for (const geometry of geometries) {
      let poly: Polygon = null;
      if (this.isPolygon(geometry)) {
        poly = geometry;
      }
      if (this.isGeometryPoint(geometry)) {
        poly = (await this.generateWorkAreaFromPoint(geometry))?.geometry;
      }
      if (this.isGeometryLineString(geometry)) {
        poly = (await this.generateWorkAreaFromLineString(geometry))?.geometry;
      }
      polygons.push(poly);
    }

    return polygons;
  }

  public async getPolygonFromGeometries(geometries: IGeometry[]): Promise<Feature<Polygon | MultiPolygon>> {
    const listFeatures: Feature<Polygon>[] = geometries.map(geometry => {
      if (['Polygon', 'MultiPolygon'].includes(geometry.type)) {
        return feature(geometry) as Feature<Polygon>;
      }
      return assetService.getDefaultWorkArea(geometry) as Feature<Polygon>;
    });

    // Add buffer to project geometry
    const workArea = buffer(union(...listFeatures), BUFFER_PROJECT_AREA_DISTANCE_METERS, { units: 'meters' });
    return workAreaService.simplifyWorkArea(workArea);
  }

  private isPolygon(geometry: IGeometry): geometry is Polygon {
    return geometry.type === AssetGeometryType.Polygon;
  }

  private isGeometryPoint(geometry: IGeometry): geometry is Point {
    return geometry.type === AssetGeometryType.Point;
  }
  private isGeometryLineString(geometry: IGeometry): geometry is LineString {
    return geometry.type === AssetGeometryType.LineString;
  }

  private async getRoadSections(geometry: IGeometry): Promise<Feature<LineString>[]> {
    return (await spatialAnalysisService.getLayerNearbyFeatures(geometry, AnalysisLayerIds.roadSections)) as Feature<
      LineString
    >[];
  }

  private getRoadSectionsPoints(polygons: Polygon[], lines: Feature<LineString>[]): Feature<Point>[] {
    return polygons.map(p => {
      const grid = pointGrid(bbox(p), 0.33, { mask: p, units: 'meters' });
      const newCentroid = centroid(p);
      let currentNearestPoint: Feature<Point> = nearestPoint(newCentroid, grid);
      const nearest = spatialAnalysisService.nearestFeature(currentNearestPoint, lines) as Feature<LineString>;
      currentNearestPoint = nearestPointOnLine(nearest, currentNearestPoint);
      const newLines = lineSplit(nearest, currentNearestPoint);
      lines.splice(lines.indexOf(nearest), 1, ...newLines.features);

      spatialAnalysisService.round([currentNearestPoint], GEOJSON_PATH_FINDER_PRECISION_LEVEL);
      spatialAnalysisService.round(newLines.features, GEOJSON_PATH_FINDER_PRECISION_LEVEL);
      return currentNearestPoint;
    });
  }

  private getShortestPath(lines: Feature<LineString>[], points: Feature<Point>[]): Feature<MultiLineString> {
    const pathFinder = new geojsonPathFinder(featureCollection(lines), {
      precision: GEOJSON_PATH_FINDER_PRECISION
    });
    const paths: Feature<LineString>[] = [];
    for (let i = 1; i < points.length; i++) {
      const result = pathFinder.findPath(points[i - 1], points[i]);
      if (result && result.path.length > 1) {
        paths.push(lineString(result?.path));
      }
    }
    return multiLineString(paths.map(x => x.geometry.coordinates));
  }

  /**
   * Applies project area distance buffer on a polygon or multiPolygon
   * @param incomingPolygon The polygon.
   * @returns Polygon of the generated buffered area.
   */
  private bufferArea(incomingPolygon: Feature<Polygon | MultiPolygon>, bufferSize: number): Feature<Polygon> {
    return buffer(incomingPolygon, bufferSize, {
      units: 'meters'
    }) as Feature<Polygon>;
  }

  /**
   * Gets the work area of the project.
   * Retrieves all the nearby pavement sections and intersections.
   * @param incomingFeature The feature representing the asset.
   * @returns Promise of the final work area.
   */
  public async getPavement(
    incomingFeature: Feature,
    bufferDistance = BUFFER_PROJECT_AREA_DISTANCE_METERS
  ): Promise<Feature<Polygon>> {
    const pavementFs = await spatialAnalysisService.getLayerNearbyFeatures(
      incomingFeature.geometry as IGeometry,
      AnalysisLayerIds.pavementSections,
      AnalysisLayerIds.intersections
    );

    // If no features have been found, we return a null work area.
    if (!pavementFs || !pavementFs.length) {
      return null;
    }

    // When the asset is a point we retrieve the nearest road or intersection.
    if (incomingFeature.geometry.type === 'Point') {
      return null;
    }
    // We retrieve all the features (pavement sections and intersections) that touch the asset.
    const sourceFeatures: IFeature[] = spatialAnalysisService.intersectedFeatures(
      incomingFeature as IFeature,
      pavementFs,
      {
        bufferDistance: constants.spatialAnalysis.INTERSECTED_FEATURES_BUFFER_DISTANCE,
        minIntersectionArea: null
      }
    );

    // If no features found, we return null cause is not normal
    if (!sourceFeatures || !sourceFeatures.length) {
      return null;
    }

    let workArea = assetService.combineWorkAreaFeatures(sourceFeatures, pavementFs) as Feature<Polygon>;
    // convert multipolygon to polygon
    if (workArea && workArea.geometry.type.toString() === 'MultiPolygon') {
      workArea = spatialAnalysisService.multiPolygonToPolygon(workArea) as Feature<Polygon>;
    }

    // Add buffer to project geometry
    workArea = buffer(workArea, bufferDistance, { units: 'meters' });
    return workArea;
  }

  public async generateWorkAreaFromPoint(point: Point): Promise<Feature<Polygon>> {
    const newBuffer = buffer(point, 8, { units: 'meters' });
    return workAreaService.getPavement(newBuffer);
  }

  public async generateWorkAreaFromLineString(incomingLineString: LineString): Promise<Feature<Polygon>> {
    return workAreaService.getPavement(feature(incomingLineString));
  }

  public async generateWorkAreaFromMultiLineString(
    incomingMultiLineString: MultiLineString
  ): Promise<Feature<Polygon>> {
    const multiLineWorkAreas: Feature<Polygon>[] = [];
    for (const coordinate of incomingMultiLineString.coordinates) {
      const newLineString = lineString(coordinate); // Creates LineStrings from every coordinates of the MultiLineString
      const lineStringWorkArea = await workAreaService.getPavement(newLineString); // Retrieve the touched pavements from that LineString
      multiLineWorkAreas.push(lineStringWorkArea);
    }
    const newUnion = spatialAnalysisService.union(...multiLineWorkAreas); // Make a union with all work areas generated
    if (newUnion.geometry.type === 'MultiPolygon') {
      // Convert the multipolygon generated into a polygon
      return spatialAnalysisService.multiPolygonToPolygon(newUnion as IFeature) as Feature<Polygon>;
    }
    return newUnion as Feature<Polygon>;
  }

  public linkMultiPolygon(
    incomingMultiPolygon: Feature<Polygon | MultiPolygon, { [name: string]: any }>
  ): Feature<Polygon> {
    if (incomingMultiPolygon.geometry.type !== 'MultiPolygon') {
      return incomingMultiPolygon as Feature<Polygon>;
    }

    return spatialAnalysisService.linkMultiPolygon(incomingMultiPolygon as Feature<MultiPolygon>, BUFFER_LINK_METERS, {
      units: 'meters'
    });
  }

  public async getWorkAreaFromGeometries(geometries: IGeometry[]): Promise<Feature<Polygon>> {
    const polygons = await workAreaService.getPolygonsFromGeometries(geometries);
    return workAreaService.generateWorkAreaFromPolygons(polygons, BUFFER_INTERVENTION_AREA_METERS);
  }
}

export const workAreaService = new WorkAreaService();
