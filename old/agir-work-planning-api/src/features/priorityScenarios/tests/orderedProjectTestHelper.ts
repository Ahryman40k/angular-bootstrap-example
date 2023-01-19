import { mergeProperties } from '../../../../tests/utils/testHelper';
import { Audit } from '../../audit/audit';
import { IOrderedProjectProps, OrderedProject } from '../models/orderedProject';

const plainOrderedProject: IOrderedProjectProps = {
  rank: 1,
  initialRank: 1,
  levelRank: 0,
  isManuallyOrdered: false,
  projectId: undefined,
  audit: Audit.fromCreateContext()
};

export function getOrderedProject(props?: Partial<IOrderedProjectProps>): OrderedProject {
  const result = OrderedProject.create(getOrderedProjectProps(props));
  return result.getValue();
}

function getOrderedProjectProps(props?: Partial<IOrderedProjectProps>): IOrderedProjectProps {
  return mergeProperties(
    {
      ...plainOrderedProject
    },
    props
  );
}
