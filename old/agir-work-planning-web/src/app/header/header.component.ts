import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { filter } from 'rxjs/operators';

import { BaseComponent } from '../shared/components/base/base.component';
import { UserService } from '../shared/user/user.service';

enum AgirLabels {
  PLANIFICATION = 'Planification',
  PRE_PLANIFICATION = 'Pré-Planification'
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent extends BaseComponent implements OnInit {
  public set item(item: any) {
    void this.router.navigate(item.route, { relativeTo: this.activatedRoute });
  }
  @Input() public menuShown = false;
  public showTaxonomyLink = false;
  public showRtuTransmissionsLink = false;
  public selectedAgirItemLabel: string;

  public agirItems = [
    {
      label: AgirLabels.PRE_PLANIFICATION,
      route: '/pre-planification'
    },
    {
      label: AgirLabels.PLANIFICATION,
      route: '/'
    }
  ];

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly mtlAuthenticationService: MtlAuthenticationService,
    private readonly router: Router,
    public userService: UserService
  ) {
    super();
    this.userService
      .hasPermission(Permission.TAXONOMY_WRITE)
      .then(permission => (this.showTaxonomyLink = permission))
      .catch(() => undefined);
    this.userService
      .hasPermissions(Permission.RTU_IMPORT_LOG_READ, Permission.RTU_EXPORT_LOG_READ)
      .then(permission => (this.showRtuTransmissionsLink = permission))
      .catch(() => undefined);
  }

  public ngOnInit(): void {
    this.router.events.pipe(filter((rs): rs is NavigationEnd => rs instanceof NavigationEnd)).subscribe(event => {
      this.selectedAgirItemLabel = event.url.includes('/pre-planification')
        ? AgirLabels.PRE_PLANIFICATION
        : AgirLabels.PLANIFICATION;
    });
  }

  public onItemSelected(label: string): void {
    this.selectedAgirItemLabel = label;
  }

  public logout(): void {
    setTimeout(() => {
      this.mtlAuthenticationService.logout();
    });
  }
}
