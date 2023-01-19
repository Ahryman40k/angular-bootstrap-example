import { concat, includes, uniq } from 'lodash';

class ArrayUtils {
  public firstNOfArrays(arrays: any[][], n: number): any[] {
    const results = [];
    for (let i = 0; i < n; i++) {
      if (results.length === n) {
        break;
      }
      for (const array of arrays) {
        if (results.length === n) {
          break;
        }
        const e = array[i];
        if (e !== undefined) {
          results.push(e);
        }
      }
    }
    return results;
  }

  /**
   * for group an array of objects by propertie
   * @param {any[]} list  list of objects [{key1:value,key2:value},{key1:value,key2:value},{key1:value,key2:value}]
   * @param {(item:any) => string} keyGetter (item)=>item.key1
   * @return {*}  {*}
   * @memberof ArrayUtils
   *
   * Input => exemple list of foods
   * list = [
   *         {"foodName":"Steak Burrito Bowl", "foodType":"Burrito Bowl", "calories":600},
   *         {"foodName":"Chicken Burrito Bowl", "foodType":"Burrito Bowl", "calories":630},
   *        {"foodName":"Chicken Corn Tortilla Taco", "foodType":"Taco", "protein":"chicken", "calories":650}
   *   ]
   * arrayUtils.groupBy(list,(item)=>item.foodType)
   * OutPut
   * ======
   * [{"key": "Burrito Bowl",
   * "value": [
   *   {"foodName": "Steak Burrito Bowl", "foodType": "Burrito Bowl","calories": 600},
   *   { "foodName": "Chicken Burrito Bowl", "foodType": "Burrito Bowl","calories": 630}
   * ]
   * },
   * { "key": "Taco",
   *  "value": [
   *   { "foodName": "Chicken Corn Tortilla Taco", "foodType": "Taco", "protein": "chicken","calories": 650}
   * ]
   * }
   * ]
   */
  public groupBy(list: any[], keyGetter: (item: any) => string): any {
    const mapArray = new Map();
    list.forEach(item => {
      const key = keyGetter(item);
      const collection = mapArray.get(key);
      if (!collection) {
        mapArray.set(key, [item]);
      } else {
        collection.push(item);
      }
    });
    return mapArray;
  }

  public mergeArrays<T>(source: T[], destination: T[]): T[] {
    return uniq(concat(source || [], destination || []));
  }

  // source includes destination
  // each element of the destination exists in the source
  public includes<T>(source: T[], destination: T[]): boolean {
    return destination.every(el => includes(source, el));
  }
}

export const arrayUtils = new ArrayUtils();
