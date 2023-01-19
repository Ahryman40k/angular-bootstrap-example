import { Subject } from 'rxjs';

const MOUSE_RIGHT_CLICK_BUTTON = 2;

type MapboxMouseEvent = mapboxgl.MapMouseEvent & mapboxgl.EventData;

export class RightClickMapTool {
  private lastCoordinates: { x: number; y: number } = null;
  private readonly rightClickSubject = new Subject<MapboxMouseEvent>();
  public rightClick$ = this.rightClickSubject.asObservable();

  constructor(private readonly map: mapboxgl.Map) {}

  public activate(): void {
    this.map.on('mousedown', this.mousedownListener);
    this.map.on('mouseup', this.mouseupListener);
  }

  public deactivate(): void {
    this.map.off('mousedown', this.mousedownListener);
    this.map.off('mouseup', this.mouseupListener);
  }

  private readonly mousedownListener = (ev: MapboxMouseEvent) => {
    if (!this.isRightButton(ev)) {
      return;
    }
    this.lastCoordinates = {
      x: ev.originalEvent.x,
      y: ev.originalEvent.y
    };
  };

  private readonly mouseupListener = (ev: MapboxMouseEvent) => {
    if (this.isRightButton(ev) && this.isRightClickTriggered(ev.originalEvent.x, ev.originalEvent.y)) {
      this.rightClickSubject.next(ev);
    }
    this.lastCoordinates = null;
  };

  private isRightButton(ev: MapboxMouseEvent): boolean {
    return ev.originalEvent.button === MOUSE_RIGHT_CLICK_BUTTON;
  }

  private isRightClickTriggered(x: number, y: number): boolean {
    return this.lastCoordinates && this.lastCoordinates.x === x && this.lastCoordinates.y === y;
  }
}
