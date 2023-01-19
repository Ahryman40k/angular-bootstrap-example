import { Injectable } from '@angular/core';
import booleanContains from '@turf/boolean-contains';
import {
  IEnrichedProgramBook,
  ILocalizedText,
  ITaxonomy,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, takeUntil } from 'rxjs/operators';

import { IKeyValue } from 'src/app/map/config/layers/utils';
import { IGlobalFilter } from '../../models/filters/global-filter';
import { globalFilterCorrespondences } from '../../models/filters/global-filter-correspondence';
import { IGlobalLabel } from '../../models/filters/global-filter-label';
import { GlobalFilterShownElement } from '../../models/filters/global-filter-shown-element';
import { UserService } from '../../user/user.service';
import { AnnualProgramService } from '../annual-program.service';
import { TaxonomiesService } from '../taxonomies.service';
import { GlobalFilterService } from './global-filter.service';

@Injectable({ providedIn: 'root' })
export class GlobalFilterLabelService {
  private readonly shownElementsPemissions: IKeyValue<Permission> = {
    [GlobalFilterShownElement.projects]: Permission.PROJECT_ZONE_READ,
    [GlobalFilterShownElement.partnerProjects]: Permission.PARTNER_PROJECT_READ,
    [GlobalFilterShownElement.linkedCityProjects]: Permission.RTU_PROJECT_READ,
    [GlobalFilterShownElement.boroughProjects]: Permission.RTU_PROJECT_READ,
    [GlobalFilterShownElement.interventions]: Permission.INTERVENTION_ZONE_READ
  };

  constructor(
    private readonly globalFilterService: GlobalFilterService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly annualProgramService: AnnualProgramService,
    private readonly userService: UserService
  ) {}

  public createFilterLabelsObservable(
    programBooks: IEnrichedProgramBook[],
    destroy$: Observable<unknown>,
    filter$?: Observable<IGlobalFilter>
  ): Observable<IGlobalLabel[]> {
    return combineLatest(
      filter$ ? filter$ : this.globalFilterService.filter$.pipe(takeUntil(destroy$), distinctUntilChanged()),
      this.taxonomiesService.taxonomies.pipe(takeUntil(destroy$))
    ).pipe(
      takeUntil(destroy$),
      map(([selectedFilter, taxonomies]) => this.buildCurrentSelection(selectedFilter, taxonomies, programBooks)),
      shareReplay()
    );
  }

  private buildCurrentSelection(
    filter: IGlobalFilter,
    taxonomies: ITaxonomy[],
    programBooks: IEnrichedProgramBook[]
  ): IGlobalLabel[] {
    const filterLabels: IGlobalLabel[] = [];
    for (const key in filter) {
      if (!filter.hasOwnProperty(key) || isNil(filter[key])) {
        continue;
      }
      const value = filter[key] instanceof Array ? filter[key] : [filter[key]];
      const correspondence = globalFilterCorrespondences.find(x => x.key === key);
      if (!value || !correspondence) {
        continue;
      }
      if (correspondence.customMapper) {
        filterLabels.push(...correspondence.customMapper(value, taxonomies, this.globalFilterService.filter));
        continue;
      }

      if (correspondence.taxonomyGroup) {
        filterLabels.push(
          ...this.getLableFromTaxonomies(key as keyof IGlobalFilter, value, correspondence.taxonomyGroup, taxonomies)
        );
      } else {
        if (key === 'programBooks') {
          for (const item of value) {
            const programBook = programBooks.find(pb => pb.id === item);
            if (!programBook) {
              continue;
            }
            filterLabels.push({
              key: `${key}.${item}`,
              label: this.formatTemplate(correspondence.template, programBook.name)
            });
          }
        } else if (key === 'shownElements') {
          value
            .filter(v => {
              return this.userService.currentUser.hasPermission(this.shownElementsPemissions[v]);
            })
            .forEach(v => {
              filterLabels.push({
                key: `${key}.${v}`,
                label: this.formatTemplate(correspondence.template, this.getLabelCorrespondance(v))
              });
            });
        } else if (key === 'decisionRequired') {
          filterLabels.push(
            ...value.map(el => {
              return { key: `${key}.${el}`, label: this.formatTemplate(correspondence.template, el) };
            })
          );
        } else if (correspondence.template) {
          filterLabels.push(
            ...value.map(el => {
              return { key: `${key}.${el}`, label: this.formatTemplate(correspondence.template, `${el}`) };
            })
          );
        }
      }
    }
    return filterLabels;
  }

  private getLableFromTaxonomies(
    key: keyof IGlobalFilter,
    values: string[],
    group: TaxonomyGroup,
    taxonomies: ITaxonomy[]
  ) {
    return values.map(item => {
      return {
        key: `${key}.${item}`,
        label: taxonomies.find(t => t.group === group && t.code === item)?.label
      };
    });
  }

  private getLabelCorrespondance(value: string): string {
    switch (value) {
      case GlobalFilterShownElement.projects:
        return 'Projets';
      case GlobalFilterShownElement.interventions:
        return 'Interventions';
      case GlobalFilterShownElement.partnerProjects:
        return 'Projets partenaires';
      case GlobalFilterShownElement.linkedCityProjects:
        return 'Projets villes liées';
      case GlobalFilterShownElement.boroughProjects:
        return 'Projets arrondissements';
      default:
        return '';
    }
  }

  private formatTemplate(template: ILocalizedText, value: string | boolean): ILocalizedText {
    let { fr, en } = template;
    if (typeof value === 'boolean') {
      const translateBoolean = {
        fr: value ? 'oui' : 'non',
        en: value ? 'yes' : 'no'
      };
      fr = fr.replace('{value}', translateBoolean.fr);
      en = en.replace('{value}', translateBoolean.en);
    } else {
      fr = fr.replace('{value}', value);
      en = en.replace('{value}', value);
    }
    return { fr, en };
  }
}
