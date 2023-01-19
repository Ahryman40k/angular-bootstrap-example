import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { NavigationEnd, Router, RouterLinkActive } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IMenuItem } from 'src/app/shared/models/menu/menu-item';

@Component({
  selector: 'app-menu-group',
  templateUrl: './menu-group.component.html',
  styleUrls: ['./menu-group.component.scss']
})
export class MenuGroupComponent extends BaseComponent {
  @Input() public menuItems: IMenuItem[];

  @ViewChildren('childrenLinksActive')
  public set childrenLinksActive(v: QueryList<RouterLinkActive>) {
    if (this.routerActiveLinks) {
      return;
    }
    this.routerActiveLinks = v.toArray();
    this.updateChildrenLinks();
  }

  private routerActiveLinks: RouterLinkActive[];

  public hasActiveChildrenLink = false;
  public _childrenLinksActive: QueryList<RouterLinkActive>;

  constructor(private readonly router: Router) {
    super();
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => this.updateChildrenLinks());
  }

  public updateChildrenLinks(): void {
    setTimeout(() => {
      this.hasActiveChildrenLink = this.routerActiveLinks.some(x => x.isActive);
    });
  }
}
