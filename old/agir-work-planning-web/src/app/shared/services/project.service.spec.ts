import { HttpClientTestingModule } from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';

import { ProjectService } from './project.service';

let injector: TestBed;
describe('ProjectService', () => {
  let projectService: ProjectService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService, MtlAuthenticationService]
    });
    injector = getTestBed();
    projectService = injector.get(ProjectService);
  });

  it('should be created', () => {
    void expect(projectService).toBeTruthy();
  });
});
