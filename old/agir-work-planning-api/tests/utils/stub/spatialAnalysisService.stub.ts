import { IFeature, IFeatureCollection, RoadNetworkType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IGetFeatureResponse } from '@villemontreal/core-utils-geo-nodejs-lib';
import { Geometry } from 'geojson';
import sinon = require('sinon');

import { getRoadSections } from '../../../src/features/asset/tests/assetTestHelper';
import { spatialAnalysisService } from '../../../src/services/spatialAnalysisService';
import { ISpatialAnalysisStreetResponse } from '../../../src/services/spatialAnalysisService/spatialAnalysisInterface';
import { IRoadNetwork } from '../../../src/services/spatialAnalysisService/spatialAnalysisType';

class SpatialAnalysisServiceStub {
  private analyzeStubEntity: sinon.SinonStub<[Geometry], Promise<ISpatialAnalysisStreetResponse>>;
  private wfsServiceIntersectStubEntity: sinon.SinonStub<
    [Geometry, string, string[], string?],
    Promise<IGetFeatureResponse>
  >;
  private getRoadNetworkTypeStubEntity: sinon.SinonStub<[IFeature], Promise<IRoadNetwork>>;
  private getRoadNetworkTypeFromRoadSectionsStubEntity: sinon.SinonStub<[IFeatureCollection], Promise<IRoadNetwork>>;

  public get analyzeStub() {
    return this.analyzeStubEntity;
  }

  public initAnalyzeStub(
    sandbox: sinon.SinonSandbox,
    response?: Partial<ISpatialAnalysisStreetResponse>,
    isRestoreServiceBeforeInit: boolean = false
  ): sinon.SinonStub<[Geometry], Promise<ISpatialAnalysisStreetResponse>> {
    if (isRestoreServiceBeforeInit) {
      this.analyzeStubEntity.restore();
    }
    const spatialAnalysisResponse = {} as ISpatialAnalysisStreetResponse;
    spatialAnalysisResponse.roadNetworkTypeId = response?.roadNetworkTypeId || RoadNetworkType.local;
    spatialAnalysisResponse.roadSections = response?.roadSections || getRoadSections();
    spatialAnalysisResponse.streetName = response?.streetName || 'streetName';
    spatialAnalysisResponse.streetFrom = response?.streetFrom || 'streetFrom';
    spatialAnalysisResponse.streetTo = response?.streetTo || 'streetTo';
    this.analyzeStubEntity = sandbox.stub(spatialAnalysisService, 'analyze').resolves(spatialAnalysisResponse);
    return this.analyzeStubEntity;
  }

  public get wfsServiceIntersectStub() {
    return this.wfsServiceIntersectStubEntity;
  }

  public initWfsServiceIntersectStub(
    sandbox: sinon.SinonSandbox,
    wfsResponses?: IGetFeatureResponse,
    isRestoreServiceBeforeInit: boolean = false
  ): sinon.SinonStub<[Geometry, string, string[], string?], Promise<IGetFeatureResponse>> {
    if (isRestoreServiceBeforeInit) {
      this.wfsServiceIntersectStubEntity.restore();
    }
    this.wfsServiceIntersectStubEntity = sandbox
      // tslint:disable-next-line:no-string-literal
      .stub(spatialAnalysisService['wfsService'], 'intersect')
      .resolves(wfsResponses ? wfsResponses : (getRoadSections() as IGetFeatureResponse));
    return this.wfsServiceIntersectStubEntity;
  }

  public init(sandbox: sinon.SinonSandbox) {
    this.initAnalyzeStub(sandbox);
    this.initGetRoadNetworkTypeStub(sandbox, RoadNetworkType.arterialLocal, false);
    this.initGetRoadNetworkTypeFromRoadSectionsStub(sandbox, RoadNetworkType.arterialLocal, false);
    this.initWfsServiceIntersectStub(sandbox);
  }

  public get getRoadNetworkTypeStub() {
    return this.getRoadNetworkTypeStubEntity;
  }

  public initGetRoadNetworkTypeStub(
    sandbox: sinon.SinonSandbox,
    roadNetworkTypeId: IRoadNetwork = RoadNetworkType.local,
    isRestoreServiceBeforeInit: boolean = false
  ): sinon.SinonStub<[IFeature], Promise<IRoadNetwork>> {
    if (isRestoreServiceBeforeInit) {
      this.getRoadNetworkTypeStubEntity.restore();
    }
    this.getRoadNetworkTypeStubEntity = sandbox
      .stub(spatialAnalysisService, 'getRoadNetworkType')
      .resolves(roadNetworkTypeId);
    return this.getRoadNetworkTypeStubEntity;
  }

  public get getRoadNetworkTypeFromRoadSectionsStub() {
    return this.getRoadNetworkTypeFromRoadSectionsStubEntity;
  }

  public initGetRoadNetworkTypeFromRoadSectionsStub(
    sandbox: sinon.SinonSandbox,
    roadNetworkTypeId: IRoadNetwork = RoadNetworkType.local,
    isRestoreServiceBeforeInit: boolean = false
  ): sinon.SinonStub<[IFeatureCollection], Promise<IRoadNetwork>> {
    if (isRestoreServiceBeforeInit) {
      this.getRoadNetworkTypeFromRoadSectionsStubEntity.restore();
    }
    this.getRoadNetworkTypeFromRoadSectionsStubEntity = sandbox
      .stub(spatialAnalysisService, 'getRoadNetworkTypeFromRoadSections')
      .resolves(roadNetworkTypeId);
    return this.getRoadNetworkTypeFromRoadSectionsStubEntity;
  }
}
export const spatialAnalysisServiceStub = new SpatialAnalysisServiceStub();
