import { Feature, Geometry } from 'geojson';
import { flatten } from 'lodash';
import * as shapefile from 'shapefile';

import * as fileUtils from '../files/utils';

interface IShpReadResult {
  done: boolean;
  value: Feature<
    Geometry,
    {
      [name: string]: any;
    }
  >;
}

export interface IShpPair {
  shp: File;
  dbf: File;
}

export async function readFilePairs<T>(shpPairs: IShpPair[]): Promise<T[]> {
  const jsons = await Promise.all(
    shpPairs.map(async x => {
      const [shp, dbf] = await Promise.all([fileUtils.readArrayBuffer(x.shp), fileUtils.readArrayBuffer(x.dbf)]);
      return read<T>(shp, dbf);
    })
  );
  return flatten(jsons);
}

export async function read<T>(shp: shapefile.Openable, dbf: shapefile.Openable): Promise<T[]> {
  const items: T[] = [];
  await shapefile.open(shp, dbf).then(async source => {
    let r: IShpReadResult;
    do {
      r = await source.read();
      if (!r.done) {
        items.push(r.value as any);
      }
    } while (!r.done);
  });

  return items;
}
