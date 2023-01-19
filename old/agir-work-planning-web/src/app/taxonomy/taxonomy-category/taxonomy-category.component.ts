import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ITaxonomy, ITaxonomyList } from '@villemontreal/agir-work-planning-lib/dist/src';
import { map, take } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { VdmSelectComponent } from 'src/app/shared/components/vdm-select/vdm-select.component';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

import { TaxonomyCategories } from '../taxonomies/taxonomies.component';
import { TaxonomyGroupTableComponent } from '../taxonomy-group-table/taxonomy-group-table.component';

@Component({
  selector: 'app-taxonomy-category',
  templateUrl: './taxonomy-category.component.html',
  styleUrls: ['./taxonomy-category.component.scss']
})
export class TaxonomyCategoryComponent extends BaseComponent implements OnInit {
  @ViewChild(TaxonomyGroupTableComponent) public table: TaxonomyGroupTableComponent;
  @ViewChild(VdmSelectComponent) public groupSelect: VdmSelectComponent;

  public category: string;
  public groups: ITaxonomyList;

  public selectedGroup: ITaxonomy;

  constructor(private readonly activatedRoute: ActivatedRoute, private readonly taxonomiesService: TaxonomiesService) {
    super();
  }

  public ngOnInit(): void {
    this.activatedRoute.params.pipe(map(p => p.id as string)).subscribe(async id => {
      this.reset();
      await this.categoryChange(id);
    });
  }

  public onGroupChange(group: ITaxonomy): void {
    this.table.initGroup(group);
  }

  private reset(): void {
    if (this.table) {
      this.table.reset();
      this.selectedGroup = null;
      const selectedItem = this.groupSelect.ngSelect.selectedItems;
      selectedItem.forEach(item => this.groupSelect.ngSelect.unselect(item));
    }
  }

  private async categoryChange(category: string): Promise<void> {
    this.category = TaxonomyCategories[category];
    const taxonomies = await this.taxonomiesService
      .group('taxonomyGroup')
      .pipe(take(1))
      .toPromise();
    this.groups = taxonomies.filter(item => item.properties.category === category);
  }
}
