import { ModificationType, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { get, isEmpty, isNil } from 'lodash';

import { GenericEntity } from '../../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { appUtils } from '../../../../utils/utils';
import { NexoFileError } from '../../models/nexoFileError';
import { INexoLogElementProps } from '../nexoLogElement';

export const NO_ID_PROVIDED = 'NO_ID_PROVIDED';
export interface INexoHeaders {
  lineNumber: number;
  status: NexoImportStatus;
  modificationType?: ModificationType;
  errors?: NexoFileError[];
}

export class NexoRow<H extends INexoHeaders> extends GenericEntity<H> {
  public static guard(props: INexoHeaders): IGuardResult {
    return Guard.guard({
      argument: props.lineNumber,
      argumentName: 'lineNumber',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_POSITIVE_INTEGER]
    });
  }

  public static guardResultToNexoFileErrors<NH extends INexoHeaders>(
    guardResult: IGuardResult,
    props: NH,
    id: string
  ): NexoFileError[] {
    if (guardResult.succeeded) {
      return [];
    }
    if (!isEmpty(guardResult.failures)) {
      return guardResult.failures.map(failure =>
        NexoFileError.fromGuardError(failure, { value1: get(props, failure.target) }, props.lineNumber, id)
      );
    }
    return [
      NexoFileError.fromGuardError(guardResult, { value1: get(props, guardResult.target) }, props.lineNumber, id)
    ];
  }

  public static cleanRowValues<R>(jsonRow: R): R {
    const invalidValues = ['null'];
    for (const key of Object.keys(jsonRow)) {
      if (!isNil(jsonRow[key]) && invalidValues.includes(`${jsonRow[key]}`.trim().toLowerCase())) {
        jsonRow[key] = undefined;
      }
      if (key === 'geom') {
        jsonRow[key] = appUtils.stringifiedJSONToJSON(jsonRow[key]);
      }
    }
    return jsonRow;
  }

  constructor(props: H) {
    super(props);
    if (isEmpty(props.errors)) {
      props.errors = [];
    }
  }

  public get lineNumber(): number {
    return this.props.lineNumber;
  }

  public get modificationType(): ModificationType {
    return this.props.modificationType;
  }

  public get status(): NexoImportStatus {
    if (!isEmpty(this.errors)) {
      return NexoImportStatus.FAILURE;
    }
    return NexoImportStatus.SUCCESS;
  }

  public get errors(): NexoFileError[] {
    return this.props.errors;
  }

  public addErrors(errors: NexoFileError[]): void {
    this.props.errors = [...this.props.errors, ...errors];
  }

  protected toNexoLogElementProps(): INexoLogElementProps {
    return {
      importStatus: this.status,
      modificationType: this.modificationType,
      errors: this.errors
    };
  }

  protected stringOrUndefined(value: string): string {
    if (!isNil(value)) {
      return `${value}`;
    }
    return value;
  }

  protected stringOrNull(value: string): string {
    const val = this.stringOrUndefined(value);
    return !isEmpty(val) ? val : null;
  }
}

export const minimalNexoRow: INexoHeaders = {
  lineNumber: 1,
  status: NexoImportStatus.IN_PROGRESS
};
