import * as turf from '@turf/turf';

export function bboxToHttpParam(bbox: turf.BBox | number[]): string {
  return bbox ? bbox.map(x => x.toFixed(6)).join(',') : undefined;
}
