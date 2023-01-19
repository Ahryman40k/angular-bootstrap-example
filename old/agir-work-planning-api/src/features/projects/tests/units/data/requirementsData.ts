import { RequirementTargetType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Audit } from '../../../../audit/audit';
import { Author } from '../../../../audit/author';
import { Requirement } from '../../../../requirements/models/requirement';
import { RequirementItem } from '../../../../requirements/models/requirementItem';

const audit: Audit = Audit.create({
  createdAt: new Date().toISOString(),
  createdBy: Author.create({
    userName: 'test',
    displayName: 'test'
  }).getValue()
}).getValue();

export function getRequirementsData(projectIds: any): Requirement[] {
  return [
    Requirement.create({
      audit,
      typeId: 'programmation',
      subtypeId: 'coordinationObstacles',
      text: 'Il faut de la coordination.',
      items: [
        RequirementItem.create({
          id: projectIds.project1,
          type: RequirementTargetType.project
        }).getValue()
      ]
    }).getValue(),
    Requirement.create({
      audit,
      typeId: 'programmation',
      subtypeId: 'coordinationWork',
      text: 'Il faut plus de coordination.',
      items: [
        RequirementItem.create({
          id: projectIds.project1,
          type: RequirementTargetType.project
        }).getValue()
      ]
    }).getValue(),
    Requirement.create({
      audit,
      typeId: 'other',
      subtypeId: 'otherRequirements',
      text: 'This is a requirement.',
      items: [
        RequirementItem.create({
          id: projectIds.project2,
          type: RequirementTargetType.project
        }).getValue()
      ]
    }).getValue(),
    Requirement.create({
      audit,
      typeId: 'programmation',
      subtypeId: 'coordinationObstacles',
      text: 'Requis 1.',
      items: [
        RequirementItem.create({
          id: projectIds.project7,
          type: RequirementTargetType.project
        }).getValue()
      ]
    }).getValue(),
    Requirement.create({
      audit,
      typeId: 'programmation',
      subtypeId: 'coordinationWork',
      text: 'Requis 2.',
      items: [
        RequirementItem.create({
          id: projectIds.project7,
          type: RequirementTargetType.project
        }).getValue()
      ]
    }).getValue()
  ];
}
