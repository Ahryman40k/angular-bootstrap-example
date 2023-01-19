export function arrayOfNumbers(from: number, to: number, steps = 1): number[] {
  const n = [];
  for (let i = from; i <= to; i += steps) {
    n.push(i);
  }
  return n;
}
