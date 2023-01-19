import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IMenuItem } from 'src/app/shared/forms/menu-active/menu-active.component';

export enum TaxonomyCategories {
  agir = 'Agir',
  annualProgram = 'Programmations annuelles',
  asset = 'Actifs',
  intervention = 'Interventions',
  programBook = 'Carnets de programmations',
  project = 'Projets',
  infoRtu = 'Info RTU'
}

@Component({
  selector: 'app-taxonomies',
  templateUrl: './taxonomies.component.html',
  styleUrls: ['./taxonomies.component.scss']
})
export class TaxonomiesComponent extends BaseComponent implements OnInit {
  public menu: IMenuItem[] = [
    {
      key: 'agir',
      label: 'Agir',
      link: ['agir']
    },
    {
      key: 'annualProgram',
      label: 'Programmations annuelles',
      link: ['annualProgram']
    },
    {
      key: 'programBook',
      label: 'Carnets de programmations',
      link: ['programBook']
    },
    {
      key: 'project',
      label: 'Projets',
      link: ['project']
    },
    {
      key: 'intervention',
      label: 'Interventions',
      link: ['intervention']
    },
    {
      key: 'infoRtu',
      label: 'Info-RTU',
      link: ['infoRtu']
    },
    {
      key: 'asset',
      label: 'Actifs',
      link: ['asset']
    }
  ];

  constructor() {
    super();
  }
}
