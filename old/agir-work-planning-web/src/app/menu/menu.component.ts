import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { environment } from 'src/environments/environment';
import { IMenuItem } from '../shared/models/menu/menu-item';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  @Output() public close = new EventEmitter();
  public contentShown = false;
  public menuItems: IMenuItem[] = [
    {
      icon: 'icon-map',
      title: 'Afficher la carte',
      link: '/'
    },
    {
      icon: 'icon-upload',
      title: 'Import de données',
      link: '/import',
      permission: Permission.IMPORT_WRITE
    },
    {
      icon: 'icon-plan',
      title: 'Programmations annuelles',
      link: '/annual-programs/',
      permission: Permission.ANNUAL_PROGRAM_READ
    }
  ];

  constructor(private readonly router: Router) {}
  public getGdaRoute(): string {
    return `${environment.externalUrls.gdaUrl}/home`;
  }

  public ngOnInit(): void {
    // Use timeout to trigger animation
    setTimeout(() => {
      this.contentShown = true;
    }, 100);
  }

  public onClose(): void {
    this.contentShown = false;
    // Use timeout to trigger animation
    setTimeout(() => {
      this.close.emit();
    }, 200);
  }

  public navigateTo(link: string): void {
    void this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      void this.router.navigate([link]);
      this.onClose();
    });
  }
}
