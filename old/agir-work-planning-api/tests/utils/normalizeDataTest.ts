import * as _ from 'lodash';

class NormalizeDataTest {
  private readonly possiblePropertiesId: string[] = ['annualProgramId', 'programBookId'];
  /**
   * Normalizes the ID of document by converting _id:ObjectId to id:string which can be used for get(:id)
   * @param data
   * @returns {T[]|Object|[Object]|T}
   */
  public normalizeData<T>(data: any): any {
    const d = this.normalizeId<T>(data);
    if (_.isArray(d)) {
      return d.map(x => (x ? this.normalize<T>(x) : x));
    }
    return d ? this.normalize<T>(d) : d;
  }

  private normalizeId<T>(data: any): any {
    if (data != null) {
      if (_.isArray(data)) {
        for (let i = 0; i < (data as T[]).length; i++) {
          this.normalizeId<T>(data[i]);
        }
      } else if (_.isObject(data)) {
        for (const p in data) {
          if (p === '_id') {
            (data as any).id = (data as any)._id.toString();
            delete (data as any)._id;
          } else if (data[p] && this.possiblePropertiesId.includes(p)) {
            data[p] = data[p].toString();
          } else {
            this.normalizeId<T>(data[p]);
          }
        }
      }
    }
    return data;
  }

  /**
   * Normalizes the data.
   * Override this function to apply any data adjustments.
   * @param data The data
   */
  protected normalize<T>(data: T): T {
    return data;
  }
}

export let normalizeDataTest = new NormalizeDataTest();
