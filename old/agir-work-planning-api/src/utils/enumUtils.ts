export function enumValues<T>(e: any): T[] {
  return Object.keys(e).map(i => e[i]);
}
