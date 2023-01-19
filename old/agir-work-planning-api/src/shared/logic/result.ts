import { isEmpty } from 'lodash';

export class Result<P> {
  public static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, null, value);
  }

  public static fail<T>(error: any): Result<T> {
    return new Result<T>(false, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    let combinedFailures: Result<any>[] = [];
    for (const result of results) {
      if (result.isFailure) {
        combinedFailures = Result.addToCombinedFailures(combinedFailures, result);
      }
    }
    return combinedFailures.length > 0 ? Result.fail(combinedFailures) : Result.ok();
  }

  public static combineForError(result: Result<any>) {
    return Result.combine([result]).error;
  }

  private static addToCombinedFailures(combinedFailures: Result<any>[], newFailedResult: Result<any>): Result<any>[] {
    const errorValue = newFailedResult.errorValue();
    let failuresToAdd: any = [];
    if (!isEmpty(errorValue.failures)) {
      failuresToAdd = errorValue.failures;
    } else if (errorValue instanceof Array) {
      failuresToAdd = errorValue;
    } else {
      failuresToAdd = [errorValue];
    }
    failuresToAdd.forEach((failureToAdd: any) => {
      if (
        !combinedFailures.find(
          (existingFailure: any) =>
            existingFailure.message === failureToAdd.message && existingFailure.target === failureToAdd.target
        )
      ) {
        combinedFailures.push(failureToAdd);
      }
    });
    return combinedFailures;
  }

  public isSuccess: boolean;
  public isFailure: boolean;
  public error: P | string;
  private readonly _value: P;

  public constructor(isSuccess: boolean, error?: P | string, value?: P) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): P {
    if (!this.isSuccess) {
      throw new Error(
        `Can't get the value of an error result. Use 'errorValue' instead. Error is: ${JSON.stringify(
          this.errorValue()
        )}`
      );
    }

    return this._value;
  }

  public errorValue(): P {
    return this.error as P;
  }
}
