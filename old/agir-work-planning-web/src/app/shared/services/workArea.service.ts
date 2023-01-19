import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import { IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';

const SIMPLIFICATION_TOLERANCE = 0.000005;

@Injectable({
  providedIn: 'root'
})
export class WorkAreaService {
  public simplify(workArea: IGeometry): IGeometry {
    return turf.simplify(workArea, { tolerance: SIMPLIFICATION_TOLERANCE, highQuality: true });
  }
}
