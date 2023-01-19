import { Injectable } from '@angular/core';

const BROWSER_WINDOW_SELF_TARGET = '';

@Injectable({ providedIn: 'root' })
export class BrowserWindowService {
  /**
   * Closes the browser's window.
   * If the window cannot be closed (e.g. opened by user), then we return false.
   */
  public close(): boolean {
    if (window.name === BROWSER_WINDOW_SELF_TARGET) {
      return false;
    }
    window.close();
  }
}
