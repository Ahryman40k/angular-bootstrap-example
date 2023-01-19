export class MomentError extends Error {
  public code: string;
  public target: string;
  constructor(message: string, code = '', target = 'value') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.target = target;
  }
}
