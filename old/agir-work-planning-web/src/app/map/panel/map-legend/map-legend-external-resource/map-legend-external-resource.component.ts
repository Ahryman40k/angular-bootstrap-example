import { Component, OnInit } from '@angular/core';
import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-map-legend-external-resource',
  templateUrl: './map-legend-external-resource.component.html'
})
export class MapLegendExternalResourceComponent extends BaseComponent implements OnInit {
  public externalResource$: Observable<ITaxonomy[]>;

  constructor(private readonly taxonomiesService: TaxonomiesService) {
    super();
  }

  public ngOnInit(): void {
    this.initTaxonomies();
  }

  private initTaxonomies(): void {
    this.externalResource$ = this.taxonomiesService.group(this.TaxonomyGroup.externalResource).pipe(take(1));
  }
}
