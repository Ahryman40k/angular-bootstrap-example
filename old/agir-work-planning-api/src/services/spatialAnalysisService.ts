import booleanContains from '@turf/boolean-contains';
import booleanCrosses from '@turf/boolean-crosses';
import intersect from '@turf/intersect';
import {
  along,
  area,
  booleanEqual,
  booleanPointInPolygon,
  buffer,
  centroid,
  distance,
  Feature,
  feature,
  FeatureCollection,
  featureCollection,
  Geometries,
  GeometryTypes,
  length,
  lineIntersect,
  lineSlice,
  LineString,
  lineString,
  MultiLineString,
  MultiPolygon,
  nearestPointOnLine,
  Point,
  point,
  pointOnFeature,
  Polygon,
  polygon,
  polygonToLineString,
  Position,
  union
} from '@turf/turf';
import {
  IBorough,
  IEnrichedIntervention,
  IEnrichedProject,
  IFeature,
  IFeatureCollection,
  IGeometry,
  ILineString,
  IPoint,
  IPolygon,
  RoadNetworkType
} from '@villemontreal/agir-work-planning-lib';
import { IFeature as IFeatureWFS, IGetFeatureResponse, WFSService } from '@villemontreal/core-utils-geo-nodejs-lib';
import { Geometry } from 'geojson';
import { flatten, flattenDepth, isEmpty, isNil, omit, round, size, uniq } from 'lodash';
import * as superagent from 'superagent';

import { configs } from '../../config/configs';
import { constants, EntityType } from '../../config/constants';
import { Result } from '../shared/logic/result';
import { createLogger } from '../utils/logger';
import { createServerError } from '../utils/utils';
import { assetService } from './assetService';
import { ALMOST_IN_AREA, SRS_IN, UNIT_SYSTEM } from './spatialAnalysisService/spatialAnalysisConst';
import { AnalysisLayerIds } from './spatialAnalysisService/spatialAnalysisEnum';
import {
  IBufferOptions,
  IIntersectedFeaturesOptions,
  IPaginatedResults,
  IRoadSection,
  ISpatialAnalysisStreetResponse,
  IStreetSpatialAnalysis
} from './spatialAnalysisService/spatialAnalysisInterface';
import { IRoadNetwork } from './spatialAnalysisService/spatialAnalysisType';
import { userService } from './userService';
import { workAreaService } from './workAreaService';

const logger = createLogger('SpatialAnalysisService');

/**
 * TODO: APOC-8743  this class must be deleted or refactored
 * some casts are wrong and IFeatureWFS should be used instead of IFeature
 */
class SpatialAnalysisService {
  constructor(private readonly wfsService: WFSService) {}

  /**
   * Gets borough
   * @param geometry
   * @returns borough
   */
  public async getBorough(geometry: IGeometry): Promise<IBorough> {
    try {
      const newCentroid: Feature<Point> = centroid(geometry);
      const response = await superagent
        .get(`${configs.spatialAnalysis.spatial.url}/intersect`)
        .query({
          datasourceId: AnalysisLayerIds.boroughs,
          long: newCentroid.geometry.coordinates[0],
          lat: newCentroid.geometry.coordinates[1]
        })
        .send();
      const boroughData: IPaginatedResults<IBorough> = response.body;
      return boroughData.items[0];
    } catch (error) {
      throw createServerError(error);
    }
  }

  /**
   * Gets features intersecting a geometry work area
   * @param geometry
   * @param sourceFeatures
   * @returns intersecting features
   */
  public getIntersectingWorkArea(geometry: IGeometry, sourceFeatures: IFeature[]): IFeature[] {
    const newPolygon = polygon(geometry.coordinates as IPolygon);
    const features = [];
    for (const sourceFeature of sourceFeatures) {
      if (sourceFeature.properties.workArea) {
        const workAreaPolygon = polygon(sourceFeature.properties.workArea.geometry.coordinates);
        if (this.booleanIntersects(newPolygon, workAreaPolygon)) {
          features.push(sourceFeature);
        }
      }
    }
    return features;
  }

  /**
   * Gets features by its identifier.
   * @param sourceLayerIds The source layer ID in the following format: "namespace:layer". e.g. "montreal:trees-on-street"
   * @param idKey The identifier key to lookup. e.g. 'id' or 'idGcaf'
   * @param assetIds The feature's IDs.
   */
  public async getFeaturesByIds(
    assetIds: string[],
    idKey: string,
    sourceLayerIds: string[]
  ): Promise<Result<IFeature[]>> {
    const cqlFilter = assetIds.map(featureId => `${idKey}=${featureId}`).join(' or ');
    return this.searchFeatures(cqlFilter, sourceLayerIds);
  }

  /**
   * Searches for features.
   * @param cql The CQL query.
   * @param sourceLayerIds The source layer IDs
   */
  public async searchFeatures(cqlFilter: string, sourceLayerIds: string[]): Promise<Result<IFeature[]>> {
    try {
      const result = await this.wfsService.cql(`${cqlFilter}`, sourceLayerIds, userService.currentUser.accessToken);
      return Result.ok(result?.features as IFeature[]);
    } catch (error) {
      return Result.fail(error);
    }
  }
  /**
   * Searches for features by source layer IDs .
   * @param layerIds The source layer IDs
   */
  public async getFeaturesBylayerId(layerIds: string[]): Promise<Result<IFeatureWFS[]>> {
    try {
      const result = await this.wfsService.getFeatureByLayerIds(layerIds);
      return Result.ok(result?.features);
    } catch (error) {
      return Result.fail(error);
    }
  }
  /**
   * Gets layer nearby features
   * param geometry
   * param layerId
   * returns layer nearby features
   */
  public async getLayerNearbyFeatures(geometry: IGeometry, ...layerIds: string[]): Promise<IFeature[]> {
    const response = await this.wfsService.dWithin(
      geometry as any,
      configs.spatialAnalysis.wfs.baseCoordinatesSrs,
      layerIds,
      +configs.spatialAnalysis.wfs.dWithinMeterTolerance,
      userService.currentUser.accessToken
    );
    return response.features as IFeature[];
  }

  /**
   * Gets layer intersecting features
   * param geometry
   * param layerId
   * returns layer intersecting features
   */
  public async getLayerIntersectingFeatures(geometry: IGeometry, ...layerIds: string[]): Promise<FeatureCollection> {
    const response = await this.wfsService.intersect(
      geometry as any,
      configs.spatialAnalysis.wfs.baseCoordinatesSrs,
      layerIds,
      userService.currentUser.accessToken
    );
    return featureCollection(response.features);
  }

  /**
   * Gets suggested name by the longest roadSection
   * @param roadSections
   * @returns suggestedStreetName
   */
  public getSuggestedName(roadSections: IFeatureCollection): string {
    let suggestedStreetName = '';
    let currentDistance = 0;
    if (!roadSections) {
      return suggestedStreetName;
    }
    roadSections.features.forEach((roadSectionsFeature: any) => {
      const geom = roadSectionsFeature.geometry as IGeometry;
      const coord = geom.coordinates as number[][];
      const line = lineString(coord);
      const newAlong = length(line, { units: 'meters' });
      if (newAlong > currentDistance) {
        suggestedStreetName = roadSectionsFeature.properties.name;
        currentDistance = newAlong;
      }
    });
    return suggestedStreetName;
  }

  /**
   * Retrieves the nearest feature from the source feature
   * 1. Retrieves the points of the source feature
   * 2. Loops trough all the source points and features
   * 3. Determines the distance between all features and points
   * 4. Returns the closest feature
   * @param sourceFeature The feature to find from.
   * @param features The features
   * @param maxDistance The maximum distance in meters.
   * @returns feature The nearest feature.
   */
  public nearestFeature(sourceFeature: IFeature, features: IFeature[], maxDistance?: number): IFeature {
    const sourcePoints = this.pointsFromFeature(sourceFeature);

    let d = -1;
    let result: IFeature;

    for (const sourcePoint of sourcePoints) {
      for (const currentFeature of features) {
        let line: Feature<LineString>;
        if (currentFeature.geometry.type === 'Polygon') {
          const poly = polygon((currentFeature.geometry as any).coordinates);
          line = polygonToLineString(poly);
        } else {
          line = currentFeature as Feature<LineString>;
        }
        const nearestPoint = nearestPointOnLine(line, sourcePoint, { units: 'meters' });
        if (
          (d === -1 || nearestPoint.properties.dist < d) &&
          (!maxDistance || nearestPoint.properties.dist <= maxDistance)
        ) {
          d = nearestPoint.properties.dist;
          result = currentFeature;
        }
      }
    }

    return result;
  }
  /**
   * Retrieves the features that intersect with the source feature.
   * Applies a buffer on the source feature and return a list of the features that
   * touches the source one.
   * @param sourceFeature The source feature
   * @param nearbyFeatures The nearby features
   * @param distance The distance of the buffer in meters
   */
  public intersectedFeatures(
    sourceFeature: IFeature,
    nearbyFeatures: IFeature[],
    options: IIntersectedFeaturesOptions = {
      bufferDistance: constants.spatialAnalysis.INTERSECTED_FEATURES_BUFFER_DISTANCE
    }
  ): IFeature[] {
    const results: IFeature[] = [];
    const bufferedFeature = buffer(sourceFeature, options.bufferDistance, { units: 'meters' });
    for (const nearbyFeature of nearbyFeatures) {
      if (this.booleanIntersects(bufferedFeature, nearbyFeature as Feature<any>)) {
        results.push(nearbyFeature);
      }
    }
    return results;
  }

  /**
   * Takes two polygons and finds if they intersect one another.
   * @param polygon1 The first polygon.
   * @param polygon2 The second polygon.
   * @returns Whether the geometries intersects one another.
   */
  // prettier-ignore
  public booleanIntersects(polygon1: Feature<Polygon | MultiPolygon>, polygon2: Feature<Polygon | MultiPolygon>): boolean;
  /**
   * Takes a polygon and a line string to find if they intersect one another.
   * @param polygon1 The polygon.
   * @param polygon2 The line string.
   * @returns Whether the geometries intersects one another.
   */
  // prettier-ignore
  // tslint:disable-next-line:unified-signatures
  public booleanIntersects(poly: Feature<Polygon | MultiPolygon>, _lineString: Feature<LineString>): boolean;
  /**
   * Takes a polygon and a point to find if they intersect one another.
   * @param polygon1 The polygon.
   * @param polygon2 The point.
   * @returns Whether the geometries intersects one another.
   */
  // prettier-ignore
  // tslint:disable-next-line:unified-signatures
  public booleanIntersects(poly: Feature<Polygon | MultiPolygon>, incomingPoint: Feature<Point>): boolean;
  public booleanIntersects(poly: Feature<Polygon | MultiPolygon>, incomingFeature: Feature<any>): boolean {
    const geometryList = this.mapGeometryAsGeometryList(incomingFeature.geometry);
    const geometryType = incomingFeature.geometry.type as GeometryTypes;
    const polyGeometryList = this.mapGeometryAsGeometryList(poly.geometry);
    switch (geometryType) {
      case 'Polygon':
      case 'MultiPolygon':
        return geometryList
          .map((geom: Polygon) => {
            return polyGeometryList.some((myPoly: Polygon) => !!intersect(myPoly, polygon(geom.coordinates)));
          })
          .every(x => x);
      case 'MultiLineString':
      case 'LineString':
        return geometryList
          .map((geom: LineString) => {
            return polyGeometryList.some(
              (myPoly: Polygon) =>
                booleanContains(myPoly, lineString(geom.coordinates)) ||
                booleanCrosses(myPoly, lineString(geom.coordinates))
            );
          })
          .every(x => x);
      case 'MultiPoint':
      case 'Point':
        return geometryList
          .map((geom: Point) => {
            return polyGeometryList.some((myPoly: Polygon) => booleanContains(myPoly, point(geom.coordinates)));
          })
          .every(x => x);
      default:
        throw new Error('ArgumentOutOfRange: This geometry type is not supported: ' + geometryType);
    }
  }

  public mapGeometryAsGeometryList(geometry: IGeometry): IGeometry[] {
    let geometries: IGeometry[];

    switch (geometry.type) {
      case 'MultiLineString':
      case 'MultiPoint':
      case 'MultiPolygon':
        geometries = (geometry.coordinates as any[]).map(coord => {
          return {
            type: geometry.type.substring(5),
            coordinates: coord
          } as IGeometry;
        });
        break;
      default:
        geometries = [geometry];
    }
    return geometries;
  }

  /**
   * Unifies features but wraps the turf function to log the invalid features.
   * It is a known limitation of TurfJS.
   * https://github.com/Turfjs/turf/issues/1575
   * @param features
   */
  public union(...features: Feature<Polygon>[]): Feature<Polygon | MultiPolygon> {
    try {
      return union(...features);
    } catch (error) {
      if (error.name === 'TopologyException') {
        logger.warning(
          {
            error,
            features
          },
          'A topology exception has been thrown. A feature might be invalid.'
        );
        // Try a second time with buffered polygons (buffer is 25 cm).
        return union(
          ...features.map(f => buffer(f, constants.spatialAnalysis.UNION_FAILURE_BUFFER_METERS, { units: 'meters' }))
        );
      }
      throw error;
    }
  }

  private pointsFromFeature<G extends IGeometry>(incomingFeature: Feature<G>): Feature<Point>[] {
    let points: Feature<Point>[];
    switch (incomingFeature.geometry.type) {
      case 'Point':
        points = [point(incomingFeature.geometry.coordinates as IPoint)];
        break;
      case 'LineString':
        const newLineString = lineString(incomingFeature.geometry.coordinates as ILineString);
        points = this.pointsFromFeatureLineString(newLineString);
        break;
      case 'MultiLineString':
        const multiLineString = incomingFeature as Feature<MultiLineString>;
        points = flatten(
          multiLineString.geometry.coordinates.map(x => this.pointsFromFeatureLineString(lineString(x)))
        );
        break;
      case 'Polygon':
        const poly = polygon(incomingFeature.geometry.coordinates as IPolygon);
        const polyLineString = polygonToLineString(poly);
        points = this.pointsFromFeatureLineString(polyLineString);
        break;
      default:
        throw new Error('ArgumentOutOfRange: This feature type is not supported: ' + incomingFeature.geometry.type);
    }
    return points;
  }

  private pointsFromFeatureLineString(lineStringFeature: Feature<LineString>): Feature<Point>[] {
    const points: Feature<Point>[] = [];
    let lastPoint: Feature<Point>;
    do {
      const newPoint = along(lineStringFeature, points.length, { units: 'meters' });
      lastPoint = lastPoint && booleanEqual(newPoint, lastPoint) ? undefined : newPoint;
      if (lastPoint) {
        points.push(lastPoint);
      }
    } while (lastPoint);
    return points;
  }

  public multiPolygonToPolygon(sourceFeature: IFeature): IFeature {
    const polygons = (sourceFeature.geometry.coordinates as any).map((x: any) =>
      buffer(polygon(x), 1, { units: 'meters' })
    );
    const unified = this.union(...polygons);
    return unified.geometry.type === 'Polygon' ? unified : polygons[0];
  }

  public multiPolygonToPolygons(multiPolygon: Feature<MultiPolygon>): Feature<Polygon>[] {
    const coordinates = !isNil(multiPolygon.geometry.coordinates[0][0][0][0])
      ? ((flattenDepth(multiPolygon.geometry.coordinates, 1) as unknown) as Position[][])
      : ((multiPolygon.geometry.coordinates as unknown) as Position[][]);
    return coordinates.map(coord => polygon([coord as any]));
  }

  public round(features: Feature<IGeometry>[], precision: number): void {
    const coordinates = features.map(x => x.geometry.coordinates);
    this.roundNumbers(coordinates, precision, 1 / Math.pow(10, precision));
  }

  private roundNumbers(numbers: any[], precision: number, epsilon: number): void {
    for (let i = 0; i < numbers.length; i++) {
      let n = numbers[i];
      if (n instanceof Array) {
        this.roundNumbers(n, precision, epsilon);
      } else {
        n = Math.round(n / epsilon) * epsilon;
        numbers[i] = n;
      }
    }
  }

  /**
   * Links a multi-polygon all together to create a single polygon.
   * @param multiPolygon The multi-polygon to create a single polygon from.
   * @param linkBufferRadius The buffer radius for the links.
   * @param linkBufferOptions The buffer options for the links.
   */
  public linkMultiPolygon(
    multiPolygon: Feature<MultiPolygon>,
    linkBufferRadius: number,
    linkBufferOptions: IBufferOptions
  ): Feature<Polygon> {
    const polygons = this.multiPolygonToPolygons(multiPolygon);

    const links: Feature<Polygon>[] = [];
    for (let i = 1; i < polygons.length; i++) {
      const newLineString = this.shortestLineStringBetweenFeatures(polygons[i - 1], polygons[i]);
      const bufferedLineString = buffer(newLineString, linkBufferRadius, linkBufferOptions);
      links.push(bufferedLineString);
    }

    return this.union(...[...polygons, ...links]) as Feature<Polygon>;
  }

  /**
   * Finds the shortest line string between 2 features.
   * @param feature1 The first feature.
   * @param feature2 The second feature.
   */
  public shortestLineStringBetweenFeatures(
    feature1: Feature<Geometries>,
    feature2: Feature<Geometries>
  ): Feature<LineString> {
    const feature1Positions = this.featurePositions(feature1);
    const feature2Positions = this.featurePositions(feature2);

    let shortestLineString: Feature<LineString> = null;
    let shortestLineStringLength: number;
    for (const feature1Position of feature1Positions) {
      for (const feature2Position of feature2Positions) {
        const newDistance = distance(feature1Position, feature2Position);
        if (!shortestLineString || newDistance < shortestLineStringLength) {
          shortestLineStringLength = newDistance;
          shortestLineString = lineString([feature1Position, feature2Position]);
        }
      }
    }

    return shortestLineString;
  }

  /**
   * Retrieves all the positions from a feature.
   * @param incomingFeature The feature.
   */
  public featurePositions(incomingFeature: Feature<Geometries>): Position[] {
    switch (incomingFeature.geometry.type) {
      case 'Point':
        return [incomingFeature.geometry.coordinates];
      case 'LineString':
        return incomingFeature.geometry.coordinates;
      case 'MultiLineString':
        return flatten(incomingFeature.geometry.coordinates);
      case 'Polygon':
        return flatten(incomingFeature.geometry.coordinates);
      case 'MultiPolygon':
        return flatten(flatten(incomingFeature.geometry.coordinates));
      default:
        throw new Error(`Unsupported geometry type: "${incomingFeature.geometry.type}"`);
    }
  }

  /**
   * Finds the middle point of a polygon.
   * Returns the centroid if it's in the geometry,
   * otherwise returns a point inside the polygon nearest to the centroid.
   * @param poly The polygon that we need to fid the middle point for.
   */
  public middlePoint(poly: Polygon | MultiPolygon): Position {
    const newCentroid = centroid(poly);
    if (booleanPointInPolygon(newCentroid, feature(poly))) {
      return newCentroid.geometry.coordinates;
    }
    return pointOnFeature(poly).geometry.coordinates;
  }

  /**
   * Get roadNetworkTypeId
   * @param workArea
   * @returns IRoadNetworkType | null
   */
  public async getRoadNetworkType(workArea: IFeature): Promise<IRoadNetwork> {
    if (!workArea) {
      return null;
    }
    const roadSections = await assetService.getRoadSections(workArea);
    const roadSectionsIds = roadSections.features.map(f => f.properties.id);
    const arterialRoadSectionsIds = await this.getArterialRoadSectionsIds(roadSectionsIds);
    return this.getRoadNetworkTypeFromIds(roadSectionsIds, arterialRoadSectionsIds);
  }

  public async getRoadNetworkTypeFromRoadSections(roadSections: IFeatureCollection) {
    const roadSectionsIds = roadSections.features.map(f => f.properties.id);
    const arterialRoadSectionsIds = await this.getArterialRoadSectionsIds(roadSectionsIds);
    return this.getRoadNetworkTypeFromIds(roadSectionsIds, arterialRoadSectionsIds);
  }

  private getRoadNetworkTypeFromIds(roadSectionsIds: string[], arterialRoadSectionsIds: string[]): IRoadNetwork {
    if (size(roadSectionsIds) > 0) {
      const arterialCount = size(uniq(roadSectionsIds).filter(id => uniq(arterialRoadSectionsIds).includes(id)));
      const localCount = size(roadSectionsIds) - arterialCount;
      if (localCount > 0 && arterialCount === 0) {
        return RoadNetworkType.local;
      }
      if (localCount === 0 && arterialCount > 0) {
        return RoadNetworkType.arterial;
      }
      return RoadNetworkType.arterialLocal;
    }
    return RoadNetworkType.offRoadNetwork;
  }

  private async getArterialRoadSectionsIds(roadSectionsIds: string[]): Promise<string[]> {
    if (!isEmpty(roadSectionsIds)) {
      const response = await this.wfsService.getByIds(
        roadSectionsIds,
        [AnalysisLayerIds.arterialNetwork],
        userService.currentUser.accessToken
      );
      const arterialRoadSections = featureCollection(response.features) as IFeatureCollection;
      if (arterialRoadSections) {
        return arterialRoadSections.features.map(f => f.properties.id);
      }
    }
    return null;
  }

  public async analyze(geometry: Geometry): Promise<ISpatialAnalysisStreetResponse> {
    const wfsResponses = await this.wfsService.intersect(geometry, SRS_IN, [
      AnalysisLayerIds.roadSections,
      AnalysisLayerIds.arterialNetwork
    ]);
    if (!wfsResponses) {
      return null;
    }
    const spatialAnalysisResponse: ISpatialAnalysisStreetResponse = {};
    spatialAnalysisResponse.roadSections = this.getRoadSectionsFromWfsResponses(wfsResponses);
    spatialAnalysisResponse.roadNetworkTypeId = this.getRoadNetworkTypeFromWfsResponses(wfsResponses);
    const suggestedMainStreet = await this.getSuggestedMainStreetFromWfsResponses(wfsResponses, geometry);
    spatialAnalysisResponse.streetName = suggestedMainStreet?.shortName || null;
    spatialAnalysisResponse.streetFrom = suggestedMainStreet?.fromShortName || null;
    spatialAnalysisResponse.streetTo = suggestedMainStreet?.toShortName || null;
    return spatialAnalysisResponse;
  }

  private getRoadSectionsFromWfsResponses(wfsResponses: IGetFeatureResponse): IFeatureCollection {
    return this.getLayerFeaturesFromResponse(wfsResponses, AnalysisLayerIds.roadSections);
  }

  private getRoadNetworkTypeFromWfsResponses(wfsResponses: IGetFeatureResponse): string {
    const arterialRoadSections = this.getLayerFeaturesFromResponse(wfsResponses, AnalysisLayerIds.arterialNetwork);
    const roadSections = this.getLayerFeaturesFromResponse(wfsResponses, AnalysisLayerIds.roadSections);
    const roadSectionsIds = roadSections.features.map(f => f.properties.id);
    const arterialRoadSectionsIds = arterialRoadSections.features.map(f => f.properties.id);
    return this.getRoadNetworkTypeFromIds(roadSectionsIds, arterialRoadSectionsIds);
  }

  private async getSuggestedMainStreetFromWfsResponses(
    wfsResponses: IGetFeatureResponse,
    areaGeometry: Geometry
  ): Promise<IStreetSpatialAnalysis> {
    const roadSections = this.getLayerFeaturesFromResponse(wfsResponses, AnalysisLayerIds.roadSections);
    const roadSectionsAlmostInArea = this.generateRoadSectionsAlmostInArea(roadSections, areaGeometry as Polygon);
    const arterialRoadSections = this.getLayerFeaturesFromResponse(wfsResponses, AnalysisLayerIds.arterialNetwork);
    const orderedRoadSection = this.orderRoadSection(roadSectionsAlmostInArea);
    const streetSummary = await this.buildStreetSummary(
      orderedRoadSection,
      arterialRoadSections,
      areaGeometry as Polygon
    );
    return this.getSuggestedMainStreet(streetSummary);
  }

  private makeNodeIdFromSectionStart(section: IRoadSection): string {
    return `${section.name.trim()}_${section.fromName.trim()}`;
  }

  private makeNodeIdFromSectionEnd(section: IRoadSection): string {
    return `${section.name.trim()}_${section.toName.trim()}`;
  }

  private orderRoadSection(roadSections: IFeatureCollection): GeoJSON.Feature<any>[][] {
    const nodes: { [key: string]: { roadSectionFeature: IFeature; prevNodeId: string } } = {};

    // Add each node of the street where the id of the node is the 'from' name of the road section
    for (const roadSectionFeature of roadSections?.features) {
      const section = roadSectionFeature.properties as IRoadSection;
      const nodeIdStart = this.makeNodeIdFromSectionStart(section);
      nodes[nodeIdStart] = {
        roadSectionFeature,
        prevNodeId: null
      };
    }

    // Link the previous node to each node (based on 'to' name from the road section)
    for (const roadSectionFeature of roadSections?.features) {
      const section = roadSectionFeature.properties as IRoadSection;
      const nodeIdStart = this.makeNodeIdFromSectionStart(section);
      const nodeIdEnd = this.makeNodeIdFromSectionEnd(section);

      if (nodes[nodeIdEnd]) {
        nodes[nodeIdEnd].prevNodeId = nodeIdStart;
      }
    }

    const overallResult = [];
    // Get the first node where there's previous node
    for (const nodeId of Object.keys(nodes)) {
      if (nodes[nodeId].prevNodeId === null) {
        // We found an start node, link till the end (without cycle)
        const result = [];
        const alreadyVisited = {};
        const currentSection = nodes[nodeId].roadSectionFeature;
        result.push(currentSection);
        alreadyVisited[nodeId] = true;

        let nodeIdEnd = this.makeNodeIdFromSectionEnd(currentSection.properties as IRoadSection);
        let nextNode = nodes[nodeIdEnd];
        while (nextNode && !alreadyVisited[nodeIdEnd]) {
          alreadyVisited[nodeIdEnd] = true;
          result.push(nextNode.roadSectionFeature);
          nodeIdEnd = this.makeNodeIdFromSectionEnd(nextNode.roadSectionFeature.properties as IRoadSection);
          nextNode = nodes[nodeIdEnd];
        }

        overallResult.push(result);
      }
    }
    return overallResult;
  }

  private async buildStreetSummary(
    orderedRoadSection: GeoJSON.Feature<any>[][],
    arterialRoadSections: IFeatureCollection,
    areaPolygon: Polygon
  ): Promise<IStreetSpatialAnalysis[]> {
    const streetSummary: IStreetSpatialAnalysis[] = [];
    // group troncon list in streets
    for (const roadSection of orderedRoadSection) {
      const tempRoadSection = roadSection[0].properties as IRoadSection;
      const tempStreet: IStreetSpatialAnalysis = {
        name: tempRoadSection.name,
        shortName: tempRoadSection.shortName,
        fromName: tempRoadSection.fromName,
        fromShortName: tempRoadSection.fromShortName
      };
      tempStreet.toName = roadSection[roadSection.length - 1].properties.toName;
      tempStreet.toShortName = roadSection[roadSection.length - 1].properties.toShortName;
      const totalLineString = roadSection.reduce((previous, current) => {
        const copy = Object.assign({}, previous);
        (copy.geometry as LineString).coordinates.push(...(current.geometry as LineString).coordinates);
        return copy;
      });
      tempStreet.roadSectionIds = roadSection.map(roadTemp => '' + roadTemp.properties.id);
      tempStreet.lineGeometry = totalLineString.geometry;
      tempStreet.length = round(length(tempStreet.lineGeometry as IFeature, { units: UNIT_SYSTEM }), 2);
      tempStreet.lengthWithWorkArea = this.generateLengthWithWorkArea(tempStreet.lineGeometry, areaPolygon);

      // Find if this one of this roadSectionsId exist in arterial layer - without wfs call
      const arterialRoadSectionsIds = arterialRoadSections.features.map(roadTemp => '' + roadTemp.properties.id);
      tempStreet.isArterial =
        size(uniq(tempStreet.roadSectionIds).filter(id => uniq(arterialRoadSectionsIds).includes(id))) > 0;
      streetSummary.push(tempStreet);
    }
    return streetSummary;
  }

  private generateRoadSectionsAlmostInArea(
    roadSections: IFeatureCollection,
    areaPolygon?: Polygon
  ): IFeatureCollection {
    const features: IFeature[] = [];
    roadSections.features.forEach(roadSectionFeature => {
      const bufferedFeature = buffer(roadSectionFeature, 1, { units: 'metres' });
      const bufferedFeatureArea = area(bufferedFeature);
      const intersectArea = area(intersect(bufferedFeature, areaPolygon));
      if (bufferedFeatureArea > 0 && intersectArea / bufferedFeatureArea > ALMOST_IN_AREA) {
        features.push(roadSectionFeature);
      }
    });
    return Object.assign({}, roadSections, { features });
  }

  private generateLengthWithWorkArea(lineGeometry: any, areaPolygon: Polygon): number {
    const intersectionPoints = lineIntersect(lineGeometry, areaPolygon);
    const intersectionPointsArray = intersectionPoints.features.map(f => {
      return f.geometry.coordinates;
    });
    if (intersectionPointsArray?.length !== 2) {
      return 0;
    }
    const intersection = lineSlice(point(intersectionPointsArray[0]), point(intersectionPointsArray[1]), lineGeometry);
    return round(
      length(intersection, {
        units: UNIT_SYSTEM
      }),
      2
    );
  }

  private getSuggestedMainStreet(streetSummary: IStreetSpatialAnalysis[]): IStreetSpatialAnalysis {
    if (streetSummary.length === 0) {
      return null;
    }
    return streetSummary.reduce((prev, current) => {
      if (prev.lengthWithWorkArea > current.lengthWithWorkArea) {
        return prev;
      }
      if (prev.lengthWithWorkArea < current.lengthWithWorkArea) {
        return current;
      }
      if (prev.length > current.length) {
        return prev;
      }
      return current;
    });
  }

  private getLayerFeaturesFromResponse(wsfResponses: IGetFeatureResponse, wfsLayerName: string): IFeatureCollection {
    // Remove the prefix 'montreal:' of the wfs layername :  montreal:pavement-sections
    const wfsLayerNamePostfix = wfsLayerName.substring(wfsLayerName.indexOf(':') + 1);
    return {
      type: 'FeatureCollection',
      features: (wsfResponses?.features ?? [])
        .filter(f => f.id.startsWith(wfsLayerNamePostfix))
        .map(f => omit(f, ['geometry_name']))
    } as IFeatureCollection;
  }

  public async generateSpatialAnalysisResponse(simplifiedworkArea: IGeometry): Promise<ISpatialAnalysisStreetResponse> {
    if (!simplifiedworkArea) {
      return null;
    }
    return await spatialAnalysisService.analyze(simplifiedworkArea as Geometry);
  }

  public generateRoadNetworkTypeId(spatialAnalysisResponse: ISpatialAnalysisStreetResponse): string {
    if (!spatialAnalysisResponse) {
      return null;
    }
    return spatialAnalysisResponse.roadNetworkTypeId || null;
  }

  public generateStreetName(spatialAnalysisResponse: ISpatialAnalysisStreetResponse): string {
    if (!spatialAnalysisResponse) {
      return null;
    }
    return spatialAnalysisResponse.streetName || null;
  }

  public generateStreetFrom(spatialAnalysisResponse: ISpatialAnalysisStreetResponse): string {
    if (!spatialAnalysisResponse) {
      return null;
    }
    return spatialAnalysisResponse.streetFrom || null;
  }

  public generateStreetTo(spatialAnalysisResponse: ISpatialAnalysisStreetResponse): string {
    if (!spatialAnalysisResponse) {
      return null;
    }
    return spatialAnalysisResponse.streetTo || null;
  }

  public generateRoadSections(spatialAnalysisResponse: ISpatialAnalysisStreetResponse): IFeatureCollection {
    if (!spatialAnalysisResponse) {
      return null;
    }
    return spatialAnalysisResponse.roadSections || null;
  }

  public async initializeSpatialProperties<T extends IEnrichedIntervention | IEnrichedProject>(
    entityType: EntityType,
    entity: T,
    geometry: IGeometry
  ): Promise<IGeometry> {
    const simplifiedworkArea = workAreaService.simplifyWorkArea(geometry);
    const spatialAnalysisResponse = await spatialAnalysisService.generateSpatialAnalysisResponse(simplifiedworkArea);
    // tslint:disable-next-line:switch-default
    switch (entityType) {
      case EntityType.intervention:
        const intervention: IEnrichedIntervention = entity as IEnrichedIntervention;
        intervention.roadSections = spatialAnalysisService.generateRoadSections(spatialAnalysisResponse);
        intervention.roadNetworkTypeId = spatialAnalysisService.generateRoadNetworkTypeId(spatialAnalysisResponse);
        break;
      case EntityType.project:
        const project: IEnrichedProject = entity as IEnrichedProject;
        project.roadNetworkTypeId = spatialAnalysisService.generateRoadNetworkTypeId(spatialAnalysisResponse); // more information
        break;
    }
    const baseProperties = entity;
    baseProperties.streetName = spatialAnalysisService.generateStreetName(spatialAnalysisResponse);
    baseProperties.streetFrom = spatialAnalysisService.generateStreetFrom(spatialAnalysisResponse);
    baseProperties.streetTo = spatialAnalysisService.generateStreetTo(spatialAnalysisResponse);
    return simplifiedworkArea;
  }
}

export const spatialAnalysisService = new SpatialAnalysisService(new WFSService(configs.spatialAnalysis.wfs.url));
