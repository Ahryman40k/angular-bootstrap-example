import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  BoroughCode,
  IEnrichedIntervention,
  IEnrichedObjective,
  IEnrichedProgramBook,
  IEnrichedProject,
  IObjectiveCalculation,
  IOrderedProject,
  PriorityCode,
  ProgramBookExpand,
  ProgramBookObjectiveTargetType,
  ProgramBookObjectiveType,
  ProgramBookStatus,
  ProjectDecisionType,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { Types } from 'mongoose';

import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import {
  getPriorityScenario,
  orderByDefaultSortCriterias
} from '../../../src/features/priorityScenarios/tests/priorityScenarioTestHelper';
import { ICalculatePriorityScenarioCommandProps } from '../../../src/features/priorityScenarios/useCases/calculatePriorityScenario/calculatePriorityScenarioCommand';
import { calculatePriorityScenarioUseCase } from '../../../src/features/priorityScenarios/useCases/calculatePriorityScenario/calculatePriorityScenarioUseCase';
import { IUpdateOrderedProjectRankManuallyCommandProps } from '../../../src/features/priorityScenarios/useCases/updateOrderedProjectRankManually/updateOrderedProjectRankManuallyCommand';
import { updateOrderedProjectRankManuallyUseCase } from '../../../src/features/priorityScenarios/useCases/updateOrderedProjectRankManually/updateOrderedProjectRankManuallyUseCase';
import { programBookMapperDTO } from '../../../src/features/programBooks/mappers/programBookMapperDTO';
import { ObjectiveValues } from '../../../src/features/programBooks/models/objectiveValues';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { programBookRepository } from '../../../src/features/programBooks/mongo/programBookRepository';
import { getObjective, getPlainObjectiveProps } from '../../../src/features/programBooks/tests/objectiveTestHelper';
import {
  createAndSaveDefaultProgramBook,
  getProgramBook,
  programbookRestrictionsTestData
} from '../../../src/features/programBooks/tests/programBookTestHelper';
import { ICreateProgramBookObjectiveCommandProps } from '../../../src/features/programBooks/useCases/createProgramBookObjective/createProgramBookObjectiveCommand';
import { createProgramBookObjectiveUseCase } from '../../../src/features/programBooks/useCases/createProgramBookObjective/createProgramBookObjectiveUseCase';
import { assertUseCaseRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import {
  REQUESTOR_BELL,
  REQUESTOR_MTQ,
  REQUESTOR_PUBLIC_WORKS_ROAD,
  ROAD_NETWORK_TYPE_ARTERIAL,
  ROAD_NETWORK_TYPE_ARTERIAL_LOCAL,
  ROAD_NETWORK_TYPE_LOCAL,
  ROAD_NETWORK_TYPE_OFFROAD_NETWORK,
  SERVICE_SUM
} from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { programBookDataCoupler } from '../../data/dataCouplers/programBookDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { getProjectDecision } from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { programBookObjectiveTestClient } from '../../utils/testClients/programBookObjectiveTestClient';
import { programBookPriorityScenariosTestClient } from '../../utils/testClients/programBookPriorityScenariosTestClient';
import { programBookTestClient } from '../../utils/testClients/programBookTestClient';
import { projectDecisionTestClient } from '../../utils/testClients/projectDecisionTestClient';
import { destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';

// tslint:disable:max-func-body-length
describe('Program Book Ordered Projects', () => {
  let mockProjects: IEnrichedProject[];
  let mockProgramBook: ProgramBook;
  let mockAnnualProgram: AnnualProgram;

  const objectiveBudgetId = Types.ObjectId().toHexString();
  const objectiveLengthId = Types.ObjectId().toHexString();

  beforeEach(async () => {
    userMocker.mock(userMocks.pilot);
    mockProjects = [];

    const projectDataList = [
      {
        boroughId: BoroughCode.ANJ,
        roadNetworkTypeId: ROAD_NETWORK_TYPE_ARTERIAL_LOCAL,
        status: ProjectStatus.programmed,
        interventions: [
          {
            annualDistribution: {
              annualPeriods: [
                {
                  annualAllowance: 5,
                  annualLength: 10
                }
              ]
            },
            boroughId: BoroughCode.ANJ,
            requestorId: REQUESTOR_PUBLIC_WORKS_ROAD
          }
        ] as IEnrichedIntervention[]
      },
      {
        boroughId: BoroughCode.AC,
        roadNetworkTypeId: ROAD_NETWORK_TYPE_ARTERIAL,
        status: ProjectStatus.programmed,
        interventions: [
          {
            annualDistribution: {
              annualPeriods: [
                {
                  annualAllowance: 5,
                  annualLength: 10
                }
              ]
            },
            boroughId: BoroughCode.AC,
            requestorId: REQUESTOR_PUBLIC_WORKS_ROAD
          }
        ] as IEnrichedIntervention[]
      },
      {
        boroughId: BoroughCode.SLR,
        roadNetworkTypeId: ROAD_NETWORK_TYPE_LOCAL,
        status: ProjectStatus.programmed,
        interventions: [
          {
            annualDistribution: {
              annualPeriods: [
                {
                  annualAllowance: 0,
                  annualLength: 10
                }
              ]
            },
            boroughId: BoroughCode.SLR,
            requestorId: REQUESTOR_BELL
          }
        ] as IEnrichedIntervention[],
        servicePriorities: [
          {
            service: SERVICE_SUM,
            priorityId: PriorityCode.veryHighPriority
          }
        ]
      },
      {
        boroughId: BoroughCode.VM,
        roadNetworkTypeId: ROAD_NETWORK_TYPE_OFFROAD_NETWORK,
        status: ProjectStatus.programmed,
        interventions: [
          {
            annualDistribution: {
              annualPeriods: [
                {
                  annualAllowance: 0,
                  annualLength: 10
                }
              ]
            },
            boroughId: BoroughCode.VM,
            requestorId: REQUESTOR_MTQ
          }
        ] as IEnrichedIntervention[],
        servicePriorities: [
          {
            service: SERVICE_SUM,
            priorityId: PriorityCode.lowPriority
          }
        ]
      }
    ];

    for (const projectData of projectDataList) {
      const interventionsDataList = projectData.interventions;
      delete projectData.interventions;
      const enrichedProject = projectDataGenerator.createEnriched(projectData);
      const project = await projectDataGenerator.store(enrichedProject);
      await createInterventions(interventionsDataList, project);
      mockProjects.push(project);
    }

    mockAnnualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.programming });
    mockProgramBook = (
      await programBookRepository.save(
        getProgramBook({
          annualProgram: mockAnnualProgram,
          priorityScenarios: [getPriorityScenario({ isOutdated: true })]
        })
      )
    ).getValue();
    // Add objectives to programBook
    await Promise.all(
      [
        getObjective(
          {
            targetType: ProgramBookObjectiveTargetType.budget,
            objectiveType: ProgramBookObjectiveType.threshold,
            values: ObjectiveValues.create({ calculated: 0, reference: 20 }).getValue()
          },
          objectiveBudgetId
        ),
        getObjective(
          {
            targetType: ProgramBookObjectiveTargetType.length,
            objectiveType: ProgramBookObjectiveType.threshold,
            values: ObjectiveValues.create({ calculated: 0, reference: 50 }).getValue()
          },
          objectiveLengthId
        )
      ].map(objective => mockProgramBook.addOrReplaceObjective(objective))
    );

    mockProgramBook = await programBookDataCoupler.coupleThem({
      programBookCoupler: { programBook: mockProgramBook, year: mockAnnualProgram.year },
      projects: mockProjects
    });
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  async function createInterventions(
    interventionsDataList: Partial<IEnrichedIntervention>[],
    project: IEnrichedProject
  ): Promise<void> {
    for (const intervention of interventionsDataList) {
      const persistedIntervention = await interventionDataGenerator.store(intervention, project);
      persistedIntervention.annualDistribution.annualPeriods[0].annualAllowance =
        intervention.annualDistribution.annualPeriods[0].annualAllowance;
      persistedIntervention.annualDistribution.annualPeriods[0].annualLength =
        intervention.annualDistribution.annualPeriods[0].annualLength;
      await interventionDataGenerator.update(persistedIntervention);
    }
  }

  function assertObjectiveCalculations(
    objectiveId: string,
    orderedProject: IOrderedProject,
    expectedResults: any
  ): void {
    const objective = mockProgramBook.objectives.find(obj => obj.id === objectiveId);
    const endError = `objective with targetType ${objective.targetType} and the objective type ${objective.objectiveType}`;
    const objectiveCalculation = orderedProject.objectivesCalculation.find(
      objCalculation => objCalculation.objectiveId === objectiveId
    );
    const expectedObjectiveCalculation = getExpectedObjectiveCalculation(objectiveId, expectedResults.orderedProject);

    const project = mockProjects.find(prj => prj.id === orderedProject.projectId);
    if (expectedResults.boroughId) {
      assert.strictEqual(project.boroughId, expectedResults.boroughId, `Wrong Borough Id for the ${endError}`);
    }

    assert.strictEqual(objectiveCalculation.objectiveId, objectiveId, `Objective Id doesn't match`);
    assert.strictEqual(
      objectiveCalculation.objectiveSum,
      expectedObjectiveCalculation.objectiveSum,
      `Sum of the ${endError} failed`
    );
    assert.strictEqual(
      objectiveCalculation.objectivePercent,
      expectedObjectiveCalculation.objectivePercent,
      `Percent of the ${endError} failed`
    );
  }

  function assertObjectives(programBook: IEnrichedProgramBook, expectedResults: any) {
    assert.isNotEmpty(programBook.objectives);
    const [objectiveLength, objectiveBudget] = [
      ProgramBookObjectiveTargetType.length,
      ProgramBookObjectiveTargetType.budget
    ].map(targetType => programBook.objectives.find(obj => obj.targetType === targetType));
    assert.strictEqual(objectiveLength.values.calculated, expectedResults.objectiveLength.calculated);
    assert.strictEqual(objectiveBudget.values.calculated, expectedResults.objectiveBudget.calculated);
    // Ordered Projects objectives calculations is empty
    const orderedProjects = programBook.priorityScenarios[0].orderedProjects.items;
    assert.lengthOf(orderedProjects, expectedResults.orderedProjectCount);
    for (const orderedProject of orderedProjects) {
      assert.isUndefined(orderedProject.objectivesCalculation);
    }
  }

  function getExpectedObjectiveCalculation(objectiveId: string, expectedOrderedProject: IOrderedProject) {
    return Array.isArray(expectedOrderedProject.objectivesCalculation)
      ? expectedOrderedProject.objectivesCalculation.find(
          (objCalculation: IObjectiveCalculation) => objCalculation.objectiveId === objectiveId
        )
      : expectedOrderedProject.objectivesCalculation;
  }

  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/v1/programBooks/{programBookId}/objectives > POST', () => {
    [
      {
        objectives: [
          {
            targetType: ProgramBookObjectiveTargetType.budget,
            objectiveType: ProgramBookObjectiveType.performanceIndicator,
            referenceValue: 5
          }
        ],
        expectedResults: {
          boroughId: BoroughCode.VM,
          orderedProject: {
            objectivesCalculation: {
              objectiveId: undefined,
              objectiveSum: 10,
              objectivePercent: 200
            }
          }
        }
      },
      {
        objectives: [
          {
            targetType: ProgramBookObjectiveTargetType.length,
            objectiveType: ProgramBookObjectiveType.performanceIndicator,
            referenceValue: 100
          }
        ],
        expectedResults: {
          boroughId: BoroughCode.VM,
          orderedProject: {
            objectivesCalculation: {
              objectiveId: undefined,
              objectiveSum: 40,
              objectivePercent: 40
            }
          }
        }
      }
    ].forEach(test => {
      it('Positive - Should do the calculation for ordered projects when adding objective', async () => {
        for (const testObjective of test.objectives) {
          const createPlainObjectiveCommand: ICreateProgramBookObjectiveCommandProps = {
            ...getPlainObjectiveProps({
              targetType: testObjective.targetType,
              objectiveType: testObjective.objectiveType,
              referenceValue: testObjective.referenceValue
            }),
            programBookId: mockProgramBook.id
          };
          const result = await createProgramBookObjectiveUseCase.execute(createPlainObjectiveCommand);
          assert.isTrue(result.isRight());
          const resultObjective = result.value.getValue() as IEnrichedObjective;
          mockProgramBook = await programBookRepository.findById(mockProgramBook.id, [
            ProgramBookExpand.projectsInterventions
          ]);
          const expectedProgramBook = await programBookMapperDTO.getFromModel(mockProgramBook, {
            objectivesCalculation: true
          });
          const lastOrderedProject =
            expectedProgramBook.priorityScenarios[0].orderedProjects.items[
              expectedProgramBook.priorityScenarios[0].orderedProjects.items.length - 1
            ];
          test.expectedResults.orderedProject.objectivesCalculation.objectiveId = resultObjective.id;
          assertObjectiveCalculations(resultObjective.id, lastOrderedProject, test.expectedResults);
        }
      });
    });
  });

  describe('/v1/programBooks/{programBookId}/objectives/{id} > PUT', () => {
    [
      {
        objectiveId: objectiveBudgetId,
        objective: {
          referenceValue: 20,
          targetType: ProgramBookObjectiveTargetType.budget
        },
        expectedResults: {
          orderedProject: {
            objectivesCalculation: {
              objectiveSum: 10,
              objectivePercent: 50
            }
          }
        }
      },
      {
        objectiveId: objectiveLengthId,
        objective: {
          referenceValue: 100,
          targetType: ProgramBookObjectiveTargetType.length
        },
        expectedResults: {
          orderedProject: {
            objectivesCalculation: {
              objectiveSum: 40,
              objectivePercent: 40
            }
          }
        }
      }
    ].forEach(test => {
      it('Positive - Should do the calculation for ordered projects when modifying objective', async () => {
        const mockObjective = getPlainObjectiveProps(test.objective);
        const response = await programBookObjectiveTestClient.updateObjective(
          mockProgramBook.id,
          test.objectiveId,
          mockObjective
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);

        const expectedProgramBook = await programBookMapperDTO.getFromModel(
          await programBookRepository.findById(mockProgramBook.id, [ProgramBookExpand.projectsInterventions]),
          {
            objectivesCalculation: true
          }
        );
        const lastOrderedProject =
          expectedProgramBook.priorityScenarios[0].orderedProjects.items[
            expectedProgramBook.priorityScenarios[0].orderedProjects.items.length - 1
          ];

        assertObjectiveCalculations(test.objectiveId, lastOrderedProject, test.expectedResults);
      });
    });
  });

  describe('/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/orderedProjects/{projectId}/ranks > PUT', () => {
    [
      {
        orderedProject: {
          newRank: 3
        },
        expectedResults: [
          {
            orderedProject: {
              objectivesCalculation: {
                objectiveId: objectiveBudgetId,
                objectiveSum: 10,
                objectivePercent: 50
              }
            }
          },
          {
            orderedProject: {
              objectivesCalculation: {
                objectiveId: objectiveLengthId,
                objectiveSum: 30,
                objectivePercent: 60
              }
            }
          }
        ]
      }
    ].forEach(test => {
      it('Positive - Should do the calculation for ordered projects when project are manually ordered', async () => {
        mockProgramBook = (
          await programBookRepository.save(
            getProgramBook(
              {
                objectives: mockProgramBook.objectives,
                annualProgram: mockAnnualProgram,
                priorityScenarios: [
                  getPriorityScenario({
                    orderedProjects: mockProgramBook.priorityScenarios[0].orderedProjects,
                    isOutdated: false
                  })
                ]
              },
              mockProgramBook.id
            ),
            {
              expand: [ProgramBookExpand.projectsInterventions]
            }
          )
        ).getValue();

        const projectId = mockProgramBook.priorityScenarios[0].orderedProjects[0].projectId;
        const response = await programBookPriorityScenariosTestClient.putOrderedProjects(
          mockProgramBook.id,
          mockProgramBook.priorityScenarios[0].id,
          projectId,
          { body: { newRank: test.orderedProject.newRank, isManuallyOrdered: true } }
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const programBook: IEnrichedProgramBook = response.body;
        const orderedProject = programBook.priorityScenarios[0].orderedProjects.items.find(
          orderedPrj => orderedPrj.projectId === projectId
        );
        for (const expectedResults of test.expectedResults) {
          assertObjectiveCalculations(
            expectedResults.orderedProject.objectivesCalculation.objectiveId,
            orderedProject,
            expectedResults
          );
        }
      });
    });
    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const currentProgramBook = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId, status: AnnualProgramStatus.programming },
          {
            boroughIds: test.props.boroughIds,
            status: ProgramBookStatus.programming,
            objectives: mockProgramBook.objectives,
            priorityScenarios: [
              getPriorityScenario({
                orderedProjects: mockProgramBook.priorityScenarios[0].orderedProjects,
                isOutdated: false
              })
            ]
          }
        );
        const projectId = mockProgramBook.priorityScenarios[0].orderedProjects[0].projectId;
        const props: IUpdateOrderedProjectRankManuallyCommandProps = {
          programBookId: currentProgramBook.id,
          priorityScenarioId: currentProgramBook.priorityScenarios[0].id,
          projectId,
          projectRank: { newRank: 3 }
        };
        await assertUseCaseRestrictions<IUpdateOrderedProjectRankManuallyCommandProps, IEnrichedProgramBook>(
          test,
          updateOrderedProjectRankManuallyUseCase,
          props
        );
      });
    });
  });

  describe('/v1/programBooks/{id}/projects > POST', () => {
    [
      {
        project: {
          globalBudget: {
            allowance: 5
          },
          boroughId: BoroughCode.AC,
          status: ProjectStatus.planned,
          interventions: [
            {
              boroughId: BoroughCode.AC,
              annualDistribution: {
                annualPeriods: [
                  {
                    annualAllowance: 5,
                    annualLength: 10
                  }
                ]
              }
            }
          ] as IEnrichedIntervention[]
        },
        expectedResults: {
          objectiveLength: {
            calculated: 50
          },
          objectiveBudget: {
            calculated: 15
          }
        }
      }
    ].forEach(test => {
      it('Positive - Should do the calculation when a project is added', async () => {
        const interventionDataList = test.project.interventions;
        delete test.project.interventions;
        const mockProject = await projectDataGenerator.store(test.project);
        await createInterventions(interventionDataList, mockProject);

        const [objectiveLengthBefore, objectiveBudgetBefore] = [
          ProgramBookObjectiveTargetType.length,
          ProgramBookObjectiveTargetType.budget
        ].map(targetType => mockProgramBook.objectives.find(obj => obj.targetType === targetType));
        assert.notEqual(objectiveLengthBefore.values.calculated, test.expectedResults.objectiveLength.calculated);
        assert.notEqual(objectiveBudgetBefore.values.calculated, test.expectedResults.objectiveBudget.calculated);
        const response = await programBookTestClient.programProject(mockProgramBook.id, { projectId: mockProject.id });
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const programBook = await programBookMapperDTO.getFromModel(
          await programBookRepository.findById(mockProgramBook.id, [ProgramBookExpand.projectsInterventions])
        );
        assertObjectives(programBook, {
          ...test.expectedResults,
          orderedProjectCount: mockProgramBook.priorityScenarios[0].orderedProjects.length + 1
        });
      });
    });
  });

  describe('/v1/projects/{id}/decisions > POST', () => {
    [
      {
        expectedResults: {
          objectiveLength: {
            calculated: 30
          },
          objectiveBudget: {
            calculated: 5
          }
        }
      }
    ].forEach(test => {
      it('Positive - Should do the calculation when a project is removed from the programBook', async () => {
        const enrichedProgramBook = await programBookMapperDTO.getFromModel(mockProgramBook);

        const [objectiveLengthBefore, objectiveBudgetBefore] = [
          ProgramBookObjectiveTargetType.length,
          ProgramBookObjectiveTargetType.budget
        ].map(targetType => enrichedProgramBook.objectives.find(obj => obj.targetType === targetType));
        assert.notEqual(objectiveLengthBefore.values.calculated, test.expectedResults.objectiveLength.calculated);
        assert.notEqual(objectiveBudgetBefore.values.calculated, test.expectedResults.objectiveBudget.calculated);

        const response = await projectDecisionTestClient.create(
          enrichedProgramBook.priorityScenarios[0].orderedProjects.items[1].projectId,
          getProjectDecision(ProjectDecisionType.removeFromProgramBook),
          appUtils.getCurrentYear()
        );
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        mockProgramBook = await programBookRepository.findById(mockProgramBook.id, [
          ProgramBookExpand.projectsInterventions
        ]);
        const programBook = await programBookMapperDTO.getFromModel(mockProgramBook);
        assertObjectives(programBook, {
          ...test.expectedResults,
          orderedProjectCount: enrichedProgramBook.priorityScenarios[0].orderedProjects.paging.totalCount - 1
        });
      });
    });
  });

  describe('/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/calculations > POST', () => {
    [
      {
        expectedResults: [
          {
            boroughId: BoroughCode.AC,
            orderedProject: {
              objectivesCalculation: [
                {
                  objectiveId: objectiveBudgetId,
                  objectiveSum: 5,
                  objectivePercent: 25
                },
                {
                  objectiveId: objectiveLengthId,
                  objectiveSum: 10,
                  objectivePercent: 20
                }
              ]
            }
          },
          {
            boroughId: BoroughCode.ANJ,
            orderedProject: {
              objectivesCalculation: [
                {
                  objectiveId: objectiveBudgetId,
                  objectiveSum: 10,
                  objectivePercent: 50
                },
                {
                  objectiveId: objectiveLengthId,
                  objectiveSum: 20,
                  objectivePercent: 40
                }
              ]
            }
          },
          {
            boroughId: BoroughCode.SLR,

            orderedProject: {
              objectivesCalculation: [
                {
                  objectiveId: objectiveBudgetId,
                  objectiveSum: 10,
                  objectivePercent: 50
                },
                {
                  objectiveId: objectiveLengthId,
                  objectiveSum: 30,
                  objectivePercent: 60
                }
              ]
            }
          },
          {
            boroughId: BoroughCode.VM,
            orderedProject: {
              objectivesCalculation: [
                {
                  objectiveId: objectiveBudgetId,
                  objectiveSum: 10,
                  objectivePercent: 50
                },
                {
                  objectiveId: objectiveLengthId,
                  objectiveSum: 40,
                  objectivePercent: 80
                }
              ]
            }
          }
        ]
      }
    ].forEach(test => {
      it('Positive - Should do the calculation when requested', async () => {
        const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
          mockProgramBook.id,
          mockProgramBook.priorityScenarios[0].id
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const expectedProgramBook = await programBookMapperDTO.getFromModel(
          await programBookRepository.findById(mockProgramBook.id, [ProgramBookExpand.projectsInterventions]),
          {
            hasAnnualProgram: true,
            objectivesCalculation: true
          }
        );

        let index = 0;
        for (const expectedResults of test.expectedResults) {
          const orderedProject = expectedProgramBook.priorityScenarios[0].orderedProjects.items[index];
          for (const objectiveCalculation of expectedResults.orderedProject.objectivesCalculation) {
            assertObjectiveCalculations(objectiveCalculation.objectiveId, orderedProject, expectedResults);
          }
          index++;
        }
      });
    });

    it('Positive - Should do the calculation when requested and sort projects by sortCriterias', async () => {
      const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
        mockProgramBook.id,
        mockProgramBook.priorityScenarios[0].id
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const expectedProgramBook = await programBookMapperDTO.getFromModel(
        await programBookRepository.findById(mockProgramBook.id, [ProgramBookExpand.projectsInterventions])
      );
      assert.deepEqual(
        (await orderByDefaultSortCriterias(mockProjects)).map(project => project.id),
        expectedProgramBook.priorityScenarios[0].orderedProjects.items.map(orderedProject => orderedProject.projectId)
      );
    });
    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const currentProgramBook = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId, status: AnnualProgramStatus.programming },
          {
            boroughIds: test.props.boroughIds,
            status: ProgramBookStatus.programming,
            priorityScenarios: [getPriorityScenario({ isOutdated: true })]
          }
        );
        const props: ICalculatePriorityScenarioCommandProps = {
          programBookId: currentProgramBook.id,
          priorityScenarioId: currentProgramBook.priorityScenarios[0].id
        };
        await assertUseCaseRestrictions<ICalculatePriorityScenarioCommandProps, IEnrichedProgramBook>(
          test,
          calculatePriorityScenarioUseCase,
          props
        );
      });
    });
  });
});
