import { Component, OnInit } from '@angular/core';
import {
  ExternalReferenceType,
  IAsset,
  IDesignData,
  IEnrichedIntervention
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { WindowService } from 'src/app/shared/services/window.service';

@Component({
  selector: 'app-intervention-conception-data',
  templateUrl: './intervention-conception-data.component.html',
  styleUrls: ['./intervention-conception-data.component.scss']
})
export class InterventionConceptionDataComponent extends BaseComponent implements OnInit {
  get nexoReferenceNumber(): string {
    const nexoNumberfield = this.intervention?.externalReferenceIds.find(
      e => e.type === this.externalReferenceType.nexoReferenceNumber
    );
    return nexoNumberfield.value;
  }
  public externalReferenceType = ExternalReferenceType;

  public intervention: IEnrichedIntervention;

  public noResultMessage: string = "Aucune donnée de conception n'a été entrée";
  constructor(public windowService: WindowService, private readonly interventionService: InterventionService) {
    super();
  }

  public ngOnInit() {
    this.windowService.intervention$
      .pipe(takeUntil(this.destroy$), takeUntil(this.interventionService.interventionChanged$))
      .subscribe(intervention => {
        this.intervention = intervention;
      });
  }

  public hasAuditPropertyOrEmpty(asset: IAsset): boolean {
    return (
      (Object.keys(asset.assetDesignData).length === 1 && asset.assetDesignData.hasOwnProperty('audit')) ||
      isEmpty(asset.assetDesignData)
    );
  }

  public hasAssetDesignData(): IAsset {
    return this.intervention?.assets?.find(asset => asset.assetDesignData && !this.hasAuditPropertyOrEmpty(asset));
  }
}
