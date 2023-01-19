import { ErrorCodes, IDate, IGeometryType } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as GJV from 'geojson-validation';
import { flatten, isBoolean, isEmpty, isNil } from 'lodash';

import { configs } from '../../../config/configs';
import { MomentUtils } from '../../utils/moment/momentUtils';
import { ErrorCode } from '../domainErrors/errorCode';

export interface IGuardMethod<T> {
  guard(props: T): IGuardResult;
}

export interface IGuardResult {
  succeeded: boolean;
  code?: ErrorCodes | ErrorCode;
  target?: string;
  message?: string;
  failures?: IGuardResult[];
}

export interface IGuardArgument {
  argument: any;
  argumentName: string;
  guardType?: GuardType[];
  values?: any[];
}

export enum GuardType {
  NULL_OR_UNDEFINED,
  VALID_DATE,
  VALID_LANGUAGE,
  VALID_UUID,
  VALID_ORDER_BY_VALUE,
  VALID_NUMBER,
  IS_ARRAY,
  IS_BOOLEAN,
  IS_ONE_OF,
  MAX_LENGTH,
  MIN_LENGTH,
  IS_POSITIVE_INTEGER,
  IS_ZERO_OR_POSITIVE_NUMBER,
  IS_ZERO_OR_POSITIVE_INTEGER,
  EMPTY_ARRAY,
  EMPTY_STRING,
  PREVENT_EMPTY_STRING,
  GREATER_THAN_OR_EQUAL,
  LOWER_THAN_OR_EQUAL,
  IN_RANGE,
  IS_NOT_FORBIDDEN_VALUE,
  IS_COMMA_SEPARATED,
  VALID_REGEX,
  VALID_YEAR,
  IS_BEFORE,
  IS_SAME_OR_BEFORE,
  VALID_PROJECT_ID,
  VALID_INTERVENTION_ID,
  VALID_FILE_SIZE,
  VALID_GEOMETRY,
  AT_LEAST_ONE,
  VALID_POLYGON,
  VALID_ASSET_ID,
  VALID_SUBMISSION_NUMBER,
  VALID_RTU_PROJECT_ID,
  IS_CONDITIONAL_MANDATORY
}

export class Guard {
  public static error(argumentName: string, errorCode: ErrorCode | ErrorCodes, errorMessage: string): IGuardResult {
    return {
      succeeded: false,
      target: argumentName,
      code: errorCode,
      message: errorMessage
    };
  }

  public static errorNotFound(arg: IGuardArgument, message?: string): IGuardResult {
    let notFoundMessage = `${arg.argument} was not found`;
    if (message) {
      notFoundMessage = message;
    }
    return this.error(arg.argumentName, ErrorCode.NOT_FOUND, notFoundMessage);
  }

  public static errorForbidden(arg: IGuardArgument, message?: string): IGuardResult {
    const forbiddenMessage = message ? message : `${arg.argument} is a forbidden value`;
    return this.error(arg.argumentName, ErrorCode.FORBIDDEN, forbiddenMessage);
  }

  public static combine(guardResults: IGuardResult[]): IGuardResult {
    const guardResult: IGuardResult = { succeeded: true, failures: [] };
    for (const result of guardResults) {
      if (!result.succeeded) {
        guardResult.succeeded = false;
        guardResult.message = `${guardResult.message ? '\n' : ''}${result.message}`;
        Guard.flattenFailures(result).forEach(failure => {
          if (!guardResult.failures.includes(failure)) {
            guardResult.failures.push(failure);
          }
        });
      }
    }
    return guardResult;
  }
  public static guard(arg: IGuardArgument): IGuardResult {
    const results: IGuardResult[] = [];
    let guardUndefined = { succeeded: true };
    let runAllGuards = false;
    if (arg.guardType.includes(GuardType.NULL_OR_UNDEFINED)) {
      guardUndefined = this.againstNullOrUndefined(arg.argument, arg.argumentName);
      if (!guardUndefined.succeeded) {
        return guardUndefined;
      }
      runAllGuards = true;
    } else {
      runAllGuards = true;
    }
    if (runAllGuards) {
      results.push(...this.getGuardResultFromType(arg));
    }
    return Guard.combine(results);
  }

  public static guardBulk(args: IGuardArgument[]): IGuardResult[] {
    return args.map(arg => this.guard(arg));
  }

  // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
  private static getGuardResultFromType(arg: IGuardArgument): IGuardResult[] {
    const results: IGuardResult[] = [];
    if (
      isNil(arg.argument) &&
      !arg.guardType.includes(GuardType.NULL_OR_UNDEFINED) &&
      !arg.guardType.includes(GuardType.EMPTY_STRING)
    ) {
      return [{ succeeded: true }];
    }
    for (const guardType of arg.guardType) {
      switch (guardType) {
        case GuardType.NULL_OR_UNDEFINED:
          results.push(this.againstNullOrUndefined(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_DATE:
          results.push(this.isValidDate(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_LANGUAGE:
          results.push(this.isValidLanguage(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_UUID:
          results.push(this.isValidUUID(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_ORDER_BY_VALUE:
          results.push(this.isValidOrderByValue(arg.argument, arg.argumentName));
          break;
        case GuardType.IS_BOOLEAN:
          results.push(this.isBoolean(arg.argument, arg.argumentName));
          break;
        case GuardType.IS_ONE_OF:
          results.push(this.isOneOf(arg.argument, arg.values, arg.argumentName));
          break;
        case GuardType.MAX_LENGTH:
          results.push(this.maxLength(arg.argumentName, arg.argument, arg.values[0]));
          break;
        case GuardType.MIN_LENGTH:
          results.push(this.minLength(arg.argumentName, arg.argument, arg.values[0]));
          break;
        case GuardType.IS_POSITIVE_INTEGER:
          results.push(this.isZeroOrPositiveInteger(arg.argument, arg.argumentName, true));
          break;
        case GuardType.IS_ZERO_OR_POSITIVE_INTEGER:
          results.push(this.isZeroOrPositiveInteger(arg.argument, arg.argumentName));
          break;
        case GuardType.IS_ARRAY:
          results.push(this.againstIsArray(arg.argument, arg.argumentName));
          break;
        case GuardType.EMPTY_ARRAY:
          results.push(this.againstEmptyArray(arg.argument, arg.argumentName));
          break;
        case GuardType.EMPTY_STRING:
          results.push(this.againstEmptyString(arg.argument, arg.argumentName));
          break;
        case GuardType.PREVENT_EMPTY_STRING:
          results.push(this.preventEmptyString(arg.argument, arg.argumentName));
          break;
        case GuardType.GREATER_THAN_OR_EQUAL:
          results.push(this.isGreaterThanOrEqual(arg.argument, arg.values[0], arg.argumentName));
          break;
        case GuardType.LOWER_THAN_OR_EQUAL:
          results.push(this.isLowerThanOrEqual(arg.argument, arg.values[0], arg.argumentName));
          break;
        case GuardType.IN_RANGE:
          results.push(this.inRange(arg.argument, arg.values[0], arg.values[1], arg.argumentName));
          break;
        case GuardType.IS_NOT_FORBIDDEN_VALUE:
          results.push(this.isForbiddenValue(arg.argument, arg.values, arg.argumentName));
          break;
        case GuardType.IS_COMMA_SEPARATED:
          results.push(this.isValidCommaSeparatedParam(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_REGEX:
          results.push(this.isValidAgainstRegex(arg.argument, arg.argumentName, arg.values[0]));
          break;
        case GuardType.VALID_YEAR:
          results.push(this.isValidYear(arg.argument, arg.argumentName));
          break;
        case GuardType.IS_BEFORE:
          results.push(this.isBefore(arg.argument, arg.values[0], arg.argumentName));
          break;
        case GuardType.IS_SAME_OR_BEFORE:
          results.push(this.isSameOrBefore(arg.argument, arg.values[0], arg.argumentName));
          break;
        case GuardType.VALID_PROJECT_ID:
          results.push(this.isValidProjectId(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_INTERVENTION_ID:
          results.push(this.isValidInterventionId(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_FILE_SIZE:
          results.push(this.isValidFileSize(arg.argument, arg.argumentName, arg.values[0]));
          break;
        case GuardType.VALID_GEOMETRY:
          results.push(this.isValidGeometry(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_POLYGON:
          results.push(this.isValidPolygon(arg.argument, arg.argumentName));
          break;
        case GuardType.IS_ZERO_OR_POSITIVE_NUMBER:
          results.push(this.isZeroOrPositiveNumber(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_NUMBER:
          results.push(this.isNumber(arg.argument, arg.argumentName));
          break;
        case GuardType.AT_LEAST_ONE:
          results.push(this.atLeastOne(arg.argument, arg.argumentName, arg.values));
          break;
        case GuardType.VALID_ASSET_ID:
          results.push(this.isValidAssetId(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_SUBMISSION_NUMBER:
          results.push(this.isValidSubmissionNumber(arg.argument, arg.argumentName));
          break;
        case GuardType.VALID_RTU_PROJECT_ID:
          results.push(this.isValidRtuProjectId(arg.argument, arg.argumentName));
          break;
        case GuardType.IS_CONDITIONAL_MANDATORY:
          results.push(this.isConditionalMandatory(arg.argument, arg.argumentName, arg.values));
          break;
        default:
          break;
      }
    }
    return results;
  }

  public static hasAtLeastOneSucceded(guardResults: IGuardResult[]): IGuardResult {
    const guardResult: IGuardResult = { succeeded: true, failures: [] };
    const results: IGuardResult[] = guardResults.filter(g => g.succeeded);
    if (!results.length) {
      guardResult.succeeded = false;
      guardResult.message = `One of the following elements is mandatory`;
      for (const result of guardResults) {
        Guard.flattenFailures(result).forEach(failure => {
          if (!guardResult.failures.includes(failure)) {
            guardResult.failures.push(failure);
          }
        });
      }
    }

    return guardResult;
  }

  private static againstNullOrUndefined(argument: any, argumentName: string): IGuardResult {
    if (argument === null || argument === undefined) {
      return this.error(argumentName, ErrorCodes.MissingValue, `${argumentName} is null or undefined`);
    }
    return { succeeded: true };
  }

  private static isValidLanguage(argument: any, argumentName: string): IGuardResult {
    // find a way to retrieve from index.d.ts instead of hard coding here
    if (!['fr-CA', 'en-CA', 'F'].includes(argument)) {
      return this.error(
        argumentName,
        ErrorCodes.InvalidInput,
        `${argumentName} is not valid, it should be 'fr-CA' or 'en-CA'`
      );
    }
    return { succeeded: true };
  }

  private static againstIsArray(argument: any, argumentName: string): IGuardResult {
    const againstUndefined = Guard.againstNullOrUndefined(argument, argumentName);
    if (!againstUndefined.succeeded) {
      return againstUndefined;
    }
    if (!(argument instanceof Array)) {
      return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} must be an array`);
    }
    return { succeeded: true };
  }

  private static againstEmptyArray(argument: any, argumentName: string): IGuardResult {
    if (isNil(argument)) {
      return { succeeded: true };
    }
    const againstIsArray = this.againstIsArray(argument, argumentName);
    if (!againstIsArray.succeeded) {
      return againstIsArray;
    }
    if (argument.length === 0) {
      return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} is empty`);
    }
    return { succeeded: true };
  }

  private static againstEmptyString(argument: string, argumentName: string): IGuardResult {
    if (isNil(argument)) {
      return { succeeded: true };
    }
    if (typeof argument !== 'string') {
      return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} must be a string`);
    }
    const trimmedArgument = argument.trim();
    if (trimmedArgument.length === 0) {
      return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} is empty`);
    }
    return { succeeded: true };
  }

  private static preventEmptyString(argument: string, argumentName: string): IGuardResult {
    if (typeof argument === 'string') {
      const trimmedArgument = argument.trim();
      if (!trimmedArgument.length) {
        return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} is empty`);
      }
    }
    return { succeeded: true };
  }

  private static isNumber(argument: any, argumentName: string): IGuardResult {
    if (!isNaN(argument)) {
      return { succeeded: true };
    }
    let isInFactANumber = false;
    try {
      if (!isNaN(Number(argument))) {
        isInFactANumber = true;
      }
    } catch (error) {
      isInFactANumber = false;
    }
    return isInFactANumber
      ? { succeeded: true }
      : this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} is not a number`);
  }

  private static isZeroOrPositiveNumber(argument: any, argumentName: string, strictlyPositive = false): IGuardResult {
    const result = this.isNumber(argument, argumentName);
    if (!result.succeeded) {
      return result;
    }
    const isPositive = strictlyPositive ? argument > 0 : argument >= 0;
    const errorMessage = strictlyPositive
      ? `${argumentName} is not a positive number`
      : `${argumentName} is not zero or a positive number`;
    return isPositive ? { succeeded: true } : this.error(argumentName, ErrorCodes.InvalidInput, errorMessage);
  }

  private static isZeroOrPositiveInteger(argument: any, argumentName: string, strictlyPositive = false): IGuardResult {
    const isNumberResult = this.isNumber(argument, argumentName);
    if (!isNumberResult.succeeded) {
      return isNumberResult;
    }
    const isPositive = this.isZeroOrPositiveNumber(argument, argumentName, strictlyPositive);
    if (!isPositive.succeeded) {
      return isPositive;
    }
    if (!Number.isInteger(Number(argument))) {
      const errorMessage = strictlyPositive
        ? `${argumentName} is not a positive integer`
        : `${argumentName} is not zero or a positive integer`;
      return this.error(argumentName, ErrorCodes.InvalidInput, errorMessage);
    }
    return { succeeded: true };
  }

  private static isOneOf(value: any, validValues: any[], argumentName: string): IGuardResult {
    if (!value) {
      return { succeeded: true };
    }
    let isValid = false;
    const valuesToCheck = Array.isArray(value) ? value : [value];
    isValid = isNil(valuesToCheck.map(toCheck => validValues.includes(toCheck)).find(result => !result));

    return isValid
      ? { succeeded: true }
      : this.error(
          argumentName,
          ErrorCodes.InvalidInput,
          `${argumentName} isn't oneOf the correct values in ${JSON.stringify(validValues)}. Got "${value}".`
        );
  }

  private static isForbiddenValue(value: any, forbiddenValues: any[], argumentName: string): IGuardResult {
    let isForbidden = false;
    for (const invalidValue of forbiddenValues) {
      if (value === invalidValue) {
        isForbidden = true;
      }
    }

    if (!isForbidden) {
      return { succeeded: true };
    }
    return !isForbidden
      ? { succeeded: true }
      : this.error(
          argumentName,
          ErrorCode.FORBIDDEN,
          `${argumentName} is a forbidden value among ${JSON.stringify(forbiddenValues)}. Got "${value}".`
        );
  }

  private static inRange(num: number, min: number, max: number, argumentName: string): IGuardResult {
    const isNumberResult = this.isNumber(num, argumentName);
    if (!isNumberResult.succeeded) {
      return isNumberResult;
    }
    return num >= min && num <= max
      ? { succeeded: true }
      : this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} is not within range ${min} to ${max}.`);
  }

  private static isGreaterThan(argument: any, value: number, argumentName: string, canBeEqual = false): IGuardResult {
    const isPositiveIntegerResult = this.isZeroOrPositiveInteger(argument, argumentName);
    if (!isPositiveIntegerResult.succeeded) {
      return isPositiveIntegerResult;
    }
    if (argument >= value && canBeEqual) {
      return { succeeded: true };
    }
    if (argument > value && !canBeEqual) {
      return { succeeded: true };
    }
    const message = canBeEqual ? 'is not greater than or equal to' : 'is not equal to';
    return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} ${message} ${value}`);
  }

  private static isGreaterThanOrEqual(argument: any, value: number, argumentName: string): IGuardResult {
    return this.isGreaterThan(argument, value, argumentName, true);
  }

  private static isLowerThan(argument: any, value: number, argumentName: string, canBeEqual = false): IGuardResult {
    const isPositiveIntegerResult = this.isZeroOrPositiveInteger(argument, argumentName);
    if (!isPositiveIntegerResult.succeeded) {
      return isPositiveIntegerResult;
    }
    if (argument <= value && canBeEqual) {
      return { succeeded: true };
    }
    if (argument < value && !canBeEqual) {
      return { succeeded: true };
    }
    const message = canBeEqual ? 'is not lower than or equal to' : 'is not equal to';
    return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} ${message} ${value}`);
  }

  private static isLowerThanOrEqual(argument: any, value: number, argumentName: string): IGuardResult {
    return this.isLowerThan(argument, value, argumentName, true);
  }

  private static againstRegex(
    argument: any,
    argumentName: string,
    regex: RegExp,
    errorCode: ErrorCodes = ErrorCodes.InvalidInput
  ): IGuardResult {
    return regex.test(argument)
      ? { succeeded: true }
      : this.error(argumentName, errorCode, `${argumentName} has a bad format`);
  }

  private static isValidUUID(argument: any, argumentName: string): IGuardResult {
    const mongoIdRegex = /^[a-f\d]{24}$/i;
    return this.againstRegex(argument, argumentName, mongoIdRegex);
  }

  private static isValidAgainstRegex(argument: any, argumentName: string, regex: RegExp): IGuardResult {
    return this.againstRegex(argument, argumentName, regex);
  }

  private static isValidYear(argument: any, argumentName: string): IGuardResult {
    const yearRegex = /^(19|20)\d{2}$/;
    return this.againstRegex(argument, argumentName, yearRegex);
  }

  private static isBefore(argument: any, value: IDate, argumentName: string, canBeSame = false): IGuardResult {
    const guard = Guard.combine([this.isValidDate(argument, argumentName), this.isValidDate(value, 'date to compare')]);
    if (!guard.succeeded) {
      return guard;
    }
    if (MomentUtils.lte(argument, value) && canBeSame) {
      return { succeeded: true };
    }
    if (MomentUtils.lt(argument, value) && !canBeSame) {
      return { succeeded: true };
    }
    const message = canBeSame ? 'is not before or the same as' : 'is not the same as';
    return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} ${message} date to compare`);
  }

  private static isSameOrBefore(argument: any, value: IDate, argumentName: string): IGuardResult {
    return this.isBefore(argument, value, argumentName, true);
  }

  private static isValidProjectId(argument: any, argumentName: string): IGuardResult {
    const projectIdRegex = /^P\d{5}$/;
    return this.againstRegex(argument, argumentName, projectIdRegex);
  }

  private static isValidInterventionId(argument: any, argumentName: string): IGuardResult {
    const interventionIdRegex = /^I\d{5}$/;
    return this.againstRegex(argument, argumentName, interventionIdRegex);
  }

  private static isValidAssetId(argument: any, argumentName: string): IGuardResult {
    const projectIdRegex = /\d+$/;
    return this.againstRegex(argument, argumentName, projectIdRegex);
  }

  private static isValidSubmissionNumber(argument: any, argumentName: string): IGuardResult {
    const projectIdRegex = /^[5-9]{1}\d{5}$/;
    return this.againstRegex(argument, argumentName, projectIdRegex);
  }

  private static isValidRtuProjectId(argument: any, argumentName: string): IGuardResult {
    // TO BE DEFINED IF THERE IS A COMMON FORMAT
    return { succeeded: true };
  }

  private static isValidGeometry(argument: any, argumentName: string): IGuardResult {
    return GJV.isGeometryObject(argument)
      ? { succeeded: true }
      : this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} has an invalid geometry`);
  }

  private static isValidPolygon(argument: any, argumentName: string): IGuardResult {
    const validTypes: IGeometryType[] = ['MultiPolygon', 'Polygon'];
    if (!argument || !validTypes.includes(argument.type)) {
      return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} must be a valid polygon`);
    }
    return this.isValidGeometry(argument, argumentName);
  }

  private static isValidCommaSeparatedParam(argument: string, argumentName: string): IGuardResult {
    const result: IGuardResult = { succeeded: true, failures: [] };
    if (/^[+,-]{1}$/.test(argument) && /^[,]$/.test(argument)) {
      result.succeeded = false;
      result.target = argumentName;
      result.code = ErrorCodes.InvalidInput;
      result.message = `${argumentName} must be comma separated values`;
    }
    return result;
  }

  private static isValidOrderByValue(argument: string, argumentName: string): IGuardResult {
    const result: IGuardResult = this.againstRegex(argument, argumentName, /.*[-,+]$/);
    if (!result.succeeded) {
      result.message = `${argumentName} must end with + for ASC order, - for DESC order`;
    }
    return result;
  }

  private static isValidDate(argument: any, argumentName: string): IGuardResult {
    if (MomentUtils.isValid(argument)) {
      return { succeeded: true };
    }
    return Guard.error(
      argumentName,
      ErrorCodes.InvalidInput,
      `Date is invalid, should be YYYY-MM-DDTHH:mm:ss.sssZ. Got ${argument}`
    );
  }

  private static isBoolean(argument: any, argumentName: string): IGuardResult {
    if (isBoolean(argument)) {
      return { succeeded: true };
    }
    return this.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} is not boolean`);
  }

  private static minLength(valueName: string, value: string | string[], minLength: number): IGuardResult {
    const valueLength = this.getValueLength(value);
    return valueLength >= minLength
      ? { succeeded: true }
      : Guard.error(
          valueName,
          ErrorCodes.InvalidInput,
          `${valueName} must have a minimum length of ${minLength}, now has a length of ${valueLength}`
        );
  }

  private static maxLength(valueName: string, value: string | string[], maxLength: number): IGuardResult {
    const valueLength = this.getValueLength(value);
    return valueLength <= maxLength
      ? { succeeded: true }
      : Guard.error(
          valueName,
          ErrorCodes.InvalidInput,
          `${valueName} must have a maximum length of ${maxLength}, now has a length of ${valueLength}`
        );
  }

  // check if the given object have at least one of the keys with a value
  private static atLeastOne(obj: any, valueName: string, keys: string[]): IGuardResult {
    const definedValues = keys.filter(key => !isNil(obj[key]));
    if (isEmpty(definedValues)) {
      return Guard.error(
        valueName,
        ErrorCodes.MissingValue,
        `Must have a value for at least one of following fields: ${keys.join(',')}`
      );
    }
    return { succeeded: true };
  }

  // if one of the given field is defined, then all the others must be defined
  private static isConditionalMandatory(obj: any, valueName: string, keys: string[]): IGuardResult {
    if (keys.some(key => !isNil(obj[key]))) {
      return Guard.combine(
        keys.map(key => {
          return Guard.guard({
            argument: obj[key],
            argumentName: key,
            guardType: [GuardType.NULL_OR_UNDEFINED]
          });
        })
      );
    }
    return { succeeded: true };
  }

  private static getValueLength(value: string | string[]): number {
    let valueLength: number;
    if (!value) {
      valueLength = 0;
    } else if (Array.isArray(value)) {
      valueLength = value.length;
    } else if (typeof value === 'object') {
      valueLength = 0;
    } else {
      valueLength = value.trim().length;
    }
    return valueLength;
  }

  private static isValidFileSize(
    argument: number,
    argumentName: string,
    fileName: string,
    maxSize?: number
  ): IGuardResult {
    const guardUndefined = this.againstNullOrUndefined(argument, argumentName);
    if (!guardUndefined.succeeded) {
      return guardUndefined;
    }
    const isNumberResult = this.isNumber(argument, argumentName);
    if (!isNumberResult.succeeded) {
      return isNumberResult;
    }
    if (argument <= 0) {
      return Guard.error(argumentName, ErrorCode.EMPTY_FILE, `${fileName ? fileName : 'File'} is empty`);
    }
    const maximum = maxSize ? maxSize : configs.storageObject.maxByteWeight;
    const isLowerThanResult = this.isLowerThan(argument, maximum, argumentName, true);
    if (!isLowerThanResult.succeeded) {
      isLowerThanResult.message = `${argumentName} file size is too large. Max is ${configs.storageObject.maxByteWeight}`;
    }
    return isLowerThanResult;
  }

  private static flattenFailures(guardResult: IGuardResult): IGuardResult[] {
    if (guardResult.failures) {
      const nestedArray = guardResult.failures.map(failure => Guard.getChildFailures(failure));
      return flatten(nestedArray);
    }
    return [guardResult];
  }

  private static getChildFailures(guardResult: IGuardResult): IGuardResult[] {
    return [guardResult, ...this.flattenFailures(guardResult)];
  }
}
