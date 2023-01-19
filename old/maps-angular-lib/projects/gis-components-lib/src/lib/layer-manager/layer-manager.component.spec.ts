import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LayerManagerComponent } from './layer-manager.component';

import { ILayerManagerConfig } from '../models/layer-manager';
import { LmBootstrapComponent } from './themes/lm-bootstrap/lm-bootstrap.component';
import { LmDefaultComponent } from './themes/lm-default/lm-default.component';

describe('LayerManagerComponent', () => {
  let component: LayerManagerComponent;
  let fixture: ComponentFixture<LayerManagerComponent>;

  const layerManagerConfig: ILayerManagerConfig = {
    theme: 'default-theme',
    layerGroups: [
      {
        label: 'Montréal',
        layerGroups: [
          {
            label: 'Actifs',
            layers: [
              { label: 'Arbres sur rue', logicLayerId: 'streetTrees' },
              { label: 'Bornes fontaines', logicLayerId: 'fireHydrants' }
            ]
          },
          {
            label: 'Permis',
            layers: [{ label: "Permis d'occupation temporaire du territoire", logicLayerId: 'permits' }]
          },
          {
            label: 'Contrats',
            layers: [{ label: 'Contrats de gestion des déchets', logicLayerId: 'zoningWaste' }]
          }
        ]
      },
      {
        label: 'NYC',
        layerGroups: []
      }
    ]
  };

  beforeEach(async(() => {
    void TestBed.configureTestingModule({
      declarations: [LayerManagerComponent, LmDefaultComponent, LmBootstrapComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerManagerComponent);
    component = fixture.componentInstance;
    component.layerManagerConfig = layerManagerConfig;
    fixture.detectChanges();
  });

  xit('should create', () => {
    void expect(component).toBeTruthy();
  });
});
