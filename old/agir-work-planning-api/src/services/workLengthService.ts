import booleanContains from '@turf/boolean-contains';
import {
  AllGeoJSON,
  Feature,
  feature,
  length as turfLength,
  lineSplit,
  lineString,
  MultiPolygon,
  Polygon,
  polygon,
  polygonToLine,
  Position
} from '@turf/turf';
import {
  AssetGeometryType,
  IAsset,
  IFeatureCollection,
  IGeometry,
  ILength,
  ILineString
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { LengthUnit } from '../features/length/models/length';
import { spatialAnalysisService } from './spatialAnalysisService';

class WorkLengthService {
  public getAssetLength(asset: IAsset, interventionArea: IGeometry): ILength {
    let length: ILength;

    switch (asset.geometry?.type) {
      case AssetGeometryType.LineString:
        length = this.getLineStringLength(asset.geometry.coordinates as ILineString, interventionArea);
        break;
      case AssetGeometryType.MultiLineString:
        length = this.getMultiLineStringLength(asset.geometry.coordinates as ILineString[], interventionArea);
        break;
      case AssetGeometryType.Polygon:
        length = asset.roadSections
          ? this.getPolygonLength(interventionArea, asset.roadSections)
          : this.getLengthFromPolygon(interventionArea, asset.geometry as Polygon);
        break;
      default:
        length = {
          value: 0,
          unit: LengthUnit.meter
        };
    }
    return length;
  }

  private getLengthFromPolygon(interventionArea: IGeometry, poly: Polygon): ILength {
    return this.getLineStringLength(polygonToLine(poly).geometry.coordinates, interventionArea);
  }

  private getLineStringLength(assetGeometryCoordinates: ILineString, interventionArea: IGeometry): ILength {
    const length = this.getLineLengthInPolygonOrFullLength(assetGeometryCoordinates, interventionArea);
    return {
      value: length,
      unit: LengthUnit.meter
    };
  }

  private getMultiLineStringLength(assetGeometryCoordinates: ILineString[], interventionArea: IGeometry): ILength {
    let length = 0;
    for (const coordinatesLine of assetGeometryCoordinates) {
      length += this.getLineLengthInPolygonOrFullLength(coordinatesLine, interventionArea);
    }
    return {
      value: length,
      unit: LengthUnit.meter
    };
  }

  private getPolygonLength(interventionArea: IGeometry, roadSections: IFeatureCollection): ILength {
    let length = 0;
    const roadSectionsLineStrings = roadSections.features.map(f => f.geometry.coordinates as ILineString);
    for (const roadSectionsLineString of roadSectionsLineStrings) {
      length += this.getLineLengthInPolygon(roadSectionsLineString, interventionArea);
    }
    return {
      value: length,
      unit: LengthUnit.meter
    };
  }

  private getLineLengthInPolygon(assetGeometryCoordinates: ILineString, interventionArea: IGeometry): number {
    let length = 0;
    const line = lineString(assetGeometryCoordinates as any);
    let features: Feature<Polygon>[];
    if (interventionArea.type === 'MultiPolygon') {
      features = spatialAnalysisService.multiPolygonToPolygons(feature(interventionArea) as Feature<MultiPolygon>);
    } else {
      features = [polygon(interventionArea.coordinates as Position[][])];
    }
    features.forEach(interventionAreaFeature => {
      if (!booleanContains(interventionAreaFeature, line)) {
        const lineSplitResult = lineSplit(line, interventionAreaFeature);
        lineSplitResult.features.forEach(d => {
          if (booleanContains(interventionAreaFeature, feature(d.geometry))) {
            length += this.getLengthMeters(d.geometry);
          }
        });
      } else {
        length = this.getLengthMeters(line);
      }
    });
    return length;
  }

  private getLineLengthInPolygonOrFullLength(
    assetGeometryCoordinates: ILineString,
    interventionArea: IGeometry
  ): number {
    let length = this.getLineLengthInPolygon(assetGeometryCoordinates, interventionArea);
    if (!length) {
      const line = lineString(assetGeometryCoordinates as any);
      length = this.getLengthMeters(line);
    }
    return length;
  }

  private getLengthMeters(geometry: AllGeoJSON): number {
    return turfLength(geometry, { units: 'meters' });
  }
}
export const workLengthService = new WorkLengthService();
