import { async, TestBed } from '@angular/core/testing';
import { StyleManagerService } from './style-manager.service';
import { StyleResolver } from './style-resolver';

describe('StyleManagerService', () => {
  let service: StyleManagerService;

  beforeAll(() => {
    service = TestBed.get(StyleManagerService);
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StyleManagerService],
      providers: [StyleResolver]
    });
  }));

  xit('should be created', () => {
    void expect(service).toBeTruthy();
  });

  // describe('isZoomOutOfBounds', () => {
  //   describe('should return true if current zoom is', () => {
  //     it('smaller than layer min zoom', () => {
  //       // const result = service.isZoomOutOfBounds(
  //       //   'streetTrees',
  //       //   5,
  //       //   10,
  //       //   18,
  //       //   customMapSourcesMock,
  //       //   customMapLayersWithMinZoomMock
  //       // );
  //       // void expect(result).toBe(true);
  //     });

  //     it('greater than layer max zoom', () => {
  //       // const result = service.isZoomOutOfBounds(
  //       //   'streetTrees',
  //       //   25,
  //       //   10,
  //       //   18,
  //       //   customMapSourcesMock,
  //       //   customMapLayersWithMaxZoomMock
  //       // );
  //       // void expect(result).toBe(true);
  //     });

  //     it('smaller than map min zoom (when layer min zoom is not provided)', () => {
  //       // const result = service.isZoomOutOfBounds(
  //       //   'streetTrees',
  //       //   5,
  //       //   10,
  //       //   18,
  //       //   customMapSourcesMock,
  //       //   customMapLayersWithoutMinMaxZoomMock
  //       // );
  //       // void expect(result).toBe(true);
  //     });

  //     it('greater than map max zoom (when layer max zoom is not provided)', () => {
  //       // const result = service.isZoomOutOfBounds(
  //       //   'streetTrees',
  //       //   19,
  //       //   10,
  //       //   18,
  //       //   customMapSourcesMock,
  //       //   customMapLayersWithoutMinMaxZoomMock
  //       // );
  //       // void expect(result).toBe(true);
  //     });
  //   });

  //   describe('should return false if current zoom is', () => {
  //     it('between layer min and max zoom', () => {
  //       // const result = service.isZoomOutOfBounds(
  //       //   'streetTrees',
  //       //   12,
  //       //   10,
  //       //   18,
  //       //   customMapSourcesMock,
  //       //   customMapLayersWithMinMaxZoomMock
  //       // );
  //       // void expect(result).toBe(false);
  //     });

  //     it('between map min and map max zoom (when layer min/max zoom is not provided)', () => {
  //       // const result = service.isZoomOutOfBounds(
  //       //   'streetTrees',
  //       //   13,
  //       //   10,
  //       //   18,
  //       //   customMapSourcesMock,
  //       //   customMapLayersWithoutMinMaxZoomMock
  //       // );
  //       // void expect(result).toBe(false);
  //     });
  //   });
  // });
});
