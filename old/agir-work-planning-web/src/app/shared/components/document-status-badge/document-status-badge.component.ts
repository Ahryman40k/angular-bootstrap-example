import { Component, HostBinding, Input } from '@angular/core';
import { DocumentStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

@Component({
  selector: 'app-document-status-badge',
  templateUrl: 'document-status-badge.component.html',
  styleUrls: ['document-status-badge.component.scss']
})
export class DocumentStatusBadgeComponent {
  @Input() public documentStatus: DocumentStatus;
  @HostBinding('class.badge') public classBadge = true;
  @HostBinding('class.badge-warning-light') public get classBadgeWarningLight(): boolean {
    return this.documentStatus === DocumentStatus.pending;
  }
  @HostBinding('class.badge-danger-light') public get classBadgeDangerLight(): boolean {
    return this.documentStatus === DocumentStatus.refused;
  }
  @HostBinding('class.badge-success-light') public get classBadgeSuccessLight(): boolean {
    return this.documentStatus === DocumentStatus.validated;
  }

  public get classIcon(): string {
    return this.documentStatusDictionary[this.documentStatus].icon;
  }

  public get documentStatusLabel(): string {
    return this.documentStatusDictionary[this.documentStatus].label;
  }

  private readonly documentStatusDictionary: { [key: string]: { icon: string; label: string } } = {};

  constructor() {
    this.documentStatusDictionary[DocumentStatus.pending] = {
      icon: 'icon-clock',
      label: 'En attente validation planificateurs'
    };
    this.documentStatusDictionary[DocumentStatus.validated] = {
      icon: 'icon-check-circle',
      label: 'Validé par les planificateurs'
    };
    this.documentStatusDictionary[DocumentStatus.refused] = {
      icon: 'icon-x-circle',
      label: 'Refusé par les planificateurs'
    };
  }
}
