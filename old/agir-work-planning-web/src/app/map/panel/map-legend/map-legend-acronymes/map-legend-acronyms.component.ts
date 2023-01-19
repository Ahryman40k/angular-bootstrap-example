import { Component, OnInit } from '@angular/core';
import { ITaxonomyList, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { sortBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

export interface IAcronymLabel {
  acronym: string;
  label: string;
}
@Component({
  selector: 'app-map-legend-acronyms',
  templateUrl: './map-legend-acronyms.component.html'
})
export class MapLegendAcronymsComponent extends BaseComponent implements OnInit {
  public programTypes$: Observable<ITaxonomyList>;

  public internalRequestors: IAcronymLabel[] = [
    {
      acronym: 'ARR',
      label: 'Arrondissement'
    },
    {
      acronym: 'DAGP',
      label: 'Division aménagement et grands projets'
    },
    {
      acronym: 'DDPIR',
      label: 'Division dévelopement de projets et intégration des réseaux'
    },
    {
      acronym: 'DEEU',
      label: `Direction de l'épuration des eaux usées`
    },
    {
      acronym: 'DEIGD',
      label: 'Division exploitation, innovation et gestion des déplacements'
    },
    {
      acronym: 'DEP',
      label: `Direction de l'eau potable`
    },
    {
      acronym: 'DGARC',
      label: 'Division gestion des actifs routiers et cyclable'
    },
    {
      acronym: 'DRE',
      label: `Direction des réseaux d'eau`
    },
    {
      acronym: 'DSAD',
      label: `Division sécurité et aménagement durable`
    },
    {
      acronym: 'SGPI',
      label: `Service de la gestion et de la planification immobilière`
    },
    {
      acronym: 'SIRR',
      label: `Service des infrastrutures du réseau routier`
    },
    {
      acronym: 'SUM',
      label: `Service de l'urbanisme et de la mobilité`
    }
  ];

  public externalRequestors: IAcronymLabel[] = [
    {
      acronym: 'ARTM',
      label: 'Autorité régionale de transport métropolitain'
    },
    {
      acronym: 'CN',
      label: `Canadien National`
    },
    {
      acronym: 'CP',
      label: `Canadien Pacific`
    },
    {
      acronym: 'CSEM',
      label: `Commission des service électriques de Montréal`
    },
    {
      acronym: 'HQ',
      label: `Hydro-Québec (Trans-énergie)`
    },
    {
      acronym: 'MTQ',
      label: `Ministère des transports de Québec`
    },
    {
      acronym: 'REM',
      label: `Réseau express métropolitain`
    },
    {
      acronym: 'STM',
      label: `Société de transport de Montréal`
    },
    {
      acronym: 'SPJCCI',
      label: `Société des Ponts Jacques-Cartier et Champlain incorporée`
    }
  ];

  constructor(private readonly taxonomiesService: TaxonomiesService) {
    super();
  }

  public ngOnInit(): void {
    this.initProgramTypes();
  }

  private initProgramTypes(): void {
    this.programTypes$ = this.taxonomiesService.group(TaxonomyGroup.programType).pipe(
      takeUntil(this.destroy$),
      map(programTypes => {
        const programTypesWithAcronym = programTypes.filter(programType => programType.properties?.acronym);
        return sortBy(programTypesWithAcronym, pt => pt.properties.acronym.fr);
      })
    );
  }
}
