import { Component, OnInit } from '@angular/core';
import { ITool } from '../../models/tools/tool.model';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

@Component({
  selector: 'vdm-ok-cancel',
  templateUrl: './ok-cancel.component.html',
  styleUrls: ['./ok-cancel.component.css']
})
export class OkCancelComponent extends MapEventListener implements OnInit {
  public okCancelVisible: boolean = false;
  public toolName: string = '';
  public usageDescription: string;

  constructor() {
    super();
  }

  public onMapLoaded() {
    this.targetMap.subscribeEvent('toolChange').subscribe((e: ITool) => this.onToolChange(e));
  }

  public onToolChange(event: any) {
    const tool: ITool = event.tool;
    this.okCancelVisible = tool.showOkCancel;
    this.toolName = tool.toolName;
    this.usageDescription = event.usageDescription;
  }

  public onDone() {
    this.targetMap.currentTool.done();
  }

  public onCancel() {
    this.targetMap.currentTool.cancel();
  }
}
