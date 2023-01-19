import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private _currentRouteLastSegment: string;

  /**
   * Gets current route last segment
   */
  public get currentRouteLastSegment(): string {
    return this._currentRouteLastSegment;
  }

  constructor(private readonly router: Router, private readonly activatedRoute: ActivatedRoute) {
    this.createRouteLastSegment();
  }

  /**
   * Clears the specified outlet.
   * Retrieves the current route and finds the matching URL parts.
   * Replaces within the URL parts the specified outlet, then navigates to the newly built URL.
   * @param outletName the name of the outlet
   * @returns the navigation promise
   */
  public async clearOutlet(outletName: string): Promise<boolean> {
    let url = this.router.url;
    const urlNamedOutletParts = url.match(/\(.*\)/);
    if (!urlNamedOutletParts) {
      return false;
    }
    for (const urlNamedOutletPart of urlNamedOutletParts) {
      let newUrlOutlets = '(';
      const urlOutlets = urlNamedOutletPart.replace(/[\(\)]/gm, '').split('//');
      for (const urlOutlet of urlOutlets) {
        if (!urlOutlet.startsWith(outletName)) {
          newUrlOutlets += urlOutlet;
        }
      }
      newUrlOutlets += ')';
      url = url.replace(urlNamedOutletPart, newUrlOutlets);
    }
    return this.router.navigateByUrl(url);
  }

  /**
   * Subscribes on changes in the url,
   * creates the current route last segment (ex: decisions),
   * sets it to _currentRouteLastSegment
   */
  public createRouteLastSegment(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map(route => {
          let r = route;
          while (r.firstChild) {
            r = r.firstChild;
          }
          return r;
        }),
        mergeMap(route => route.url)
      )
      .subscribe(paramAsMap => (this._currentRouteLastSegment = paramAsMap[0]?.path));
  }
}
