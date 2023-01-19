/**
 * Encode a string in base-64.
 * @template str the string to encode
 * @returns String
 */
export function btoa(str: any): string {
  let buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = Buffer.from(str.toString(), 'binary');
  }

  return buffer.toString('base64');
}
