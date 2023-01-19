import { mergeProperties } from '../../../../tests/utils/testHelper';
import { IInputDrmProjectProps, InputDrmProject } from '../models/drm/inputDrmNumber';

const inputDrmProject: IInputDrmProjectProps = {
  projectIds: ['P00001'],
  isCommonDrmNumber: false
};

export function getInputDrmNumberProps(plain?: Partial<IInputDrmProjectProps>): IInputDrmProjectProps {
  return mergeProperties(inputDrmProject, plain);
}

export function getInputDrmNumber(props?: Partial<IInputDrmProjectProps>): InputDrmProject<IInputDrmProjectProps> {
  return InputDrmProject.create(getInputDrmNumberProps(props)).getValue();
}
