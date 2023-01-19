/**
 * Contains all prototypes for arrays
 */

interface IGroup<K, T> {
  key: K;
  items: T[];
}

interface IJoinStringsOptions {
  ignoreTrim?: boolean;
}

/**
 * Definitions of prototypes
 */
// tslint:disable-next-line: interface-name
interface Array<T> {
  /**
   * Groups items by a common key.
   * @param keySelector Method that select the value to be the key.
   */
  groupBy<K>(keySelector: (item: T) => K): IGroup<K, T>[];
  joinStrings(separator: string, options?: IJoinStringsOptions): string;
}

/**
 * Implementation of prototypes
 */
Array.prototype.groupBy = function<T, K>(this: [], keySelector: (item: T) => K): IGroup<K, T>[] {
  const groups: IGroup<K, T>[] = [];
  this.forEach(item => {
    const key = keySelector(item);
    const group = groups.find(x => x.key === key);
    if (!group) {
      groups.push({ key, items: [item] });
    } else {
      group.items.push(item);
    }
  });
  return groups;
};
Array.prototype.joinStrings = function(this: [], separator: string, options?: IJoinStringsOptions): string {
  return this.filter(x => x !== undefined && x !== null && x !== '')
    .map((x: string) => {
      let v = x.toString();
      if (!options?.ignoreTrim) {
        v = v.trim();
      }
      return v;
    })
    .join(separator);
};
