import { IAbstractSystem } from '../infrastructure/in-memory-project.infrastructure';
import { createProjectService } from './project.service';

const createMockedSystem = (): IAbstractSystem => ({
  add: jest.fn().mockImplementation((obj) => obj),
  delete: jest.fn(),
  findByIds: jest.fn(),
  update: jest.fn(),
});

describe('Domain Project', () => {
  describe('Create capability', () => {
    test('Should create a Project', async () => {
      const system = createMockedSystem();
      const service = createProjectService({memory:system});
      const result = await service.create({
        projectName: 'TestProject',
        endYear: 2030,
        startYear: 2020,
        projectTypeId: 'integrated',
        status: 'planned',
      });

      expect(system.add).toBeCalled();
      expect(result).toBeDefined();
    });

    test('Should not create a Project with invalid name', async () => {
      const system = createMockedSystem();
      const service = createProjectService({memory:system});
      const result = await service.create({
        projectName: '',
        endYear: 2030,
        startYear: 2020,
        projectTypeId: 'integrated',
        status: 'planned',
      });

      expect(system.add).not.toBeCalled();
      expect(result).toBeNull();
    });
  });
});
