export interface ITool {
  toolName: string;
  showOkCancel: boolean;
  isEditTool: boolean;
  start(options: any, doneCallBack: (e: any) => void);
  cancel();
  done();
  onMapLoaded(): void;
}
