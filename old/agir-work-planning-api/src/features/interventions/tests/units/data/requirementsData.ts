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

export function getRequirementsData(ids: any): Requirement[] {
  return [
    Requirement.create({
      audit,
      typeId: 'other',
      subtypeId: 'otherRequirements',
      text: 'This is a requirement.',
      items: [
        RequirementItem.create({
          id: ids.intervention2,
          type: RequirementTargetType.intervention
        }).getValue()
      ]
    }).getValue(),
    Requirement.create({
      audit,
      typeId: 'programmation',
      subtypeId: 'coordinationObstacles',
      text: 'Il faut de la coordination.',
      items: [
        RequirementItem.create({
          id: ids.intervention3,
          type: RequirementTargetType.intervention
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
          id: ids.intervention3,
          type: RequirementTargetType.intervention
        }).getValue()
      ]
    }).getValue(),
    Requirement.create({
      audit,
      typeId: 'programmation',
      subtypeId: 'coordinationWork',
      text: 'Req 1.',
      items: [
        RequirementItem.create({
          id: ids.intervention5,
          type: RequirementTargetType.intervention
        }).getValue()
      ]
    }).getValue(),
    Requirement.create({
      audit,
      typeId: 'programmation',
      subtypeId: 'coordinationObstacles',
      text: 'Req 2.',
      items: [
        RequirementItem.create({
          id: ids.intervention5,
          type: RequirementTargetType.intervention
        }).getValue()
      ]
    }).getValue()
  ];
}
