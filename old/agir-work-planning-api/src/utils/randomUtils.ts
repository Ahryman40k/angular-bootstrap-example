/**
 * Generates a random number between 2 numbers included.
 * @param min The minimum value included.
 * @param max  The maximum value included.
 */
export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
