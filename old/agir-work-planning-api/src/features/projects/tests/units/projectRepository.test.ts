import {
  AnnualProgramStatus,
  IEnrichedProject,
  InterventionStatus,
  ProgramBookStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { getInitialProject } from '../../../../../tests/data/projectData';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { getAnnualProgram } from '../../../annualPrograms/tests/annualProgramTestHelper';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { getIntervention } from '../../../interventions/tests/interventionTestHelper';
import { OpportunityNoticeFindOptions } from '../../../opportunityNotices/models/opportunityNoticeFindOptions';
import { opportunityNoticeRepository } from '../../../opportunityNotices/mongo/opportunityNoticeRepository';
import { getOpportunityNotice } from '../../../opportunityNotices/tests/opportunityNoticeTestHelper';
import { getOrderedProject } from '../../../priorityScenarios/tests/orderedProjectTestHelper';
import { getPriorityScenario } from '../../../priorityScenarios/tests/priorityScenarioTestHelper';
import { ProgramBookFindOptions } from '../../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { getProgramBook } from '../../../programBooks/tests/programBookTestHelper';
import { ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { RequirementFindOptions } from '../../../requirements/models/requirementFindOptions';
import { requirementRepository } from '../../../requirements/mongo/requirementRepository';
import { getRequirement } from '../../../requirements/tests/requirementTestHelper';
import { projectRepository } from '../../mongo/projectRepository';

// tslint:disable: max-func-body-length
describe(`Project Repository Delete`, () => {
  describe(`Positive`, () => {
    let project: IEnrichedProject;

    beforeEach(async () => {
      const annualProgram = (
        await annualProgramRepository.save(getAnnualProgram({ status: AnnualProgramStatus.programming }))
      ).getValue();
      const initialProject = getInitialProject();
      const savedProject = (await projectRepository.save(initialProject)).getValue();

      await requirementRepository.save(
        await getRequirement({
          items: [
            {
              id: savedProject.id,
              type: 'project'
            }
          ]
        })
      );
      await opportunityNoticeRepository.save(getOpportunityNotice({ projectId: savedProject.id }));
      await interventionRepository.save(
        getIntervention({ project: savedProject, status: InterventionStatus.accepted })
      );

      const programBook = (
        await programBookRepository.save(
          getProgramBook({
            annualProgram,
            status: ProgramBookStatus.programming,
            removedProjects: [savedProject],
            priorityScenarios: [
              getPriorityScenario({ orderedProjects: [getOrderedProject({ projectId: savedProject.id })] })
            ]
          })
        )
      ).getValue();
      const annualPeriod = savedProject.annualDistribution.annualPeriods.find(ap => ap.year === annualProgram.year);
      annualPeriod.programBookId = programBook.id;
      project = (await projectRepository.save(savedProject)).getValue();
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    it('should remove related requirements on project delete', async () => {
      const requirementFindOptions = RequirementFindOptions.create({
        criterias: { itemId: project.id, itemType: 'project' }
      }).getValue();
      // Verify requirement
      let results = await requirementRepository.findAll(requirementFindOptions);
      assert.isNotEmpty(results);

      // Delete project
      await projectRepository.delete(ProjectFindOptions.create({ criterias: { id: project.id } }).getValue());

      // Verify requirement
      results = await requirementRepository.findAll(requirementFindOptions);
      assert.isEmpty(results);
    });

    it('should remove related opportunity notices on project delete', async () => {
      const opportunityNoticeFindOptions = OpportunityNoticeFindOptions.create({
        criterias: { projectId: project.id }
      }).getValue();
      // Verify opportunity notices
      let results = await opportunityNoticeRepository.findAll(opportunityNoticeFindOptions);
      assert.isNotEmpty(results);

      // Delete project
      await projectRepository.delete(ProjectFindOptions.create({ criterias: { id: project.id } }).getValue());

      // Verify opportunity notices
      results = await opportunityNoticeRepository.findAll(opportunityNoticeFindOptions);
      assert.isEmpty(results);
    });

    it('should updated linked interventions project delete', async () => {
      const interventionFindOptions = InterventionFindOptions.create({
        criterias: { projectId: project.id }
      }).getValue();
      // Verify interventions
      let results = await interventionRepository.findAll(interventionFindOptions);
      assert.isNotEmpty(results);

      // Delete project
      await projectRepository.delete(ProjectFindOptions.create({ criterias: { id: project.id } }).getValue());

      // Verify interventions
      results = await interventionRepository.findAll(interventionFindOptions);
      assert.isEmpty(results);
    });

    it('should update removed projects in program nook on project delete', async () => {
      const programBookFindOptions = ProgramBookFindOptions.create({
        criterias: { removedProjectsIds: [project.id] }
      }).getValue();
      // Verify programBooks removedProjects
      let results = await programBookRepository.findAll(programBookFindOptions);
      assert.isNotEmpty(results);

      // Delete project
      await projectRepository.delete(ProjectFindOptions.create({ criterias: { id: project.id } }).getValue());

      // Verify programBooks removedProjects
      results = await programBookRepository.findAll(programBookFindOptions);
      assert.isEmpty(results);
    });

    it('should update priority projects in Program Book should be updated on project delete', async () => {
      const programBookFindOptions = ProgramBookFindOptions.create({
        criterias: { priorityScenarioProjectsIds: [project.id] }
      }).getValue();
      // Verify programBooks removedProjects
      let results = await programBookRepository.findAll(programBookFindOptions);
      assert.isNotEmpty(results);

      // Delete project
      await projectRepository.delete(ProjectFindOptions.create({ criterias: { id: project.id } }).getValue());

      // Verify programBooks removedProjects
      results = await programBookRepository.findAll(programBookFindOptions);
      assert.isEmpty(results);
    });
  });
});
