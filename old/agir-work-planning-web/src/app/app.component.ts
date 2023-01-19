import { Component, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { NotificationsService } from './shared/notifications/notifications.service';

const ROUTERS_WITHOUT_HEADER: string[] = ['window', 'unauthorized'];
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public title = 'agir-work-planning-web';
  public isHeaderVisible = true;
  constructor(
    private readonly mtlAuthenticationService: MtlAuthenticationService,
    public ngbDatepickerConfig: NgbDatepickerConfig,
    private readonly notificationsService: NotificationsService,
    private readonly router: Router
  ) {
    ngbDatepickerConfig.outsideDays = 'hidden';
    ngbDatepickerConfig.navigation = 'arrows';
  }

  public ngOnInit(): void {
    if (environment.authentificationConfig.activation && !this.mtlAuthenticationService.getState()) {
      this.login();
    }
    this.setHeaderVisibility();
  }

  public setHeaderVisibility(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationStart)).subscribe((event: NavigationStart) => {
      this.isHeaderVisible = ROUTERS_WITHOUT_HEADER.every(el => !event.url.split('/').includes(el));
    });
  }

  private login(): void {
    try {
      this.mtlAuthenticationService.login();
    } catch (error) {
      this.notificationsService.showError("Service d'authentification indisponible");
    }
  }
}
