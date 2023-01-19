import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ILayerGroup, IMapConfig, ISources } from 'gis-components-lib';
import { MapComponent } from './map.component';

const customMapLayersMock: ILayerGroup = {
  geotraficLayersGrey: [
    {
      id: 'waze-jams',
      type: 'line',
      source: 'ovniReports',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'eventSourceId', 'waze'], ['==', 'eventType', 2]],
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#D9414D',
        'line-width': {
          base: 1.55,
          stops: [[12, 1.35], [14, 5], [18, 35]]
        }
      }
    },
    {
      id: 'waze-alerts',
      type: 'circle',
      source: 'ovniReports',
      filter: ['all', ['==', '$type', 'Point'], ['==', 'eventSourceId', 'waze'], ['==', 'eventType', 0]],
      paint: {
        'circle-radius': {
          base: 1.75,
          stops: [[10, 2], [12, 4], [22, 180]]
        },
        'circle-color': '#F7A853'
      }
    }
  ]
};

const customMapSourcesMock: ISources = {
  ovniReports: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [] as any
    }
  }
};

const mapConfigMock: IMapConfig = {
  mapOptions: {
    container: 'not_used',
    zoom: 10.2,
    minZoom: 10,
    maxZoom: 18,
    maxBounds: [[-74.15, 45], [-73.05, 46]],
    center: [-73.7, 45.55]
  },
  mapStyleDefinition: ['greyBasemap', 'geotraficLayersGrey'],
  customMapSources: customMapSourcesMock,
  customMapLayers: customMapLayersMock,
  baseUrl: 'https://api.accept.montreal.ca'
};

@Component({
  selector: 'vdm-mock-test',
  template: `
    <vdm-map id="map-tester-component" [mapConfig]="mapConfig"></vdm-map>
  `
})
class MockTestComponent {
  public mapConfig: IMapConfig = mapConfigMock;
}

describe('MapComponent', () => {
  let component: MockTestComponent;
  let fixture: ComponentFixture<MockTestComponent>;
  beforeEach(async(() => {
    void TestBed.configureTestingModule({
      declarations: [MapComponent, MockTestComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MockTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
