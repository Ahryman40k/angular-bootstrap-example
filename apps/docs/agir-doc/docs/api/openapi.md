# Roadwork intervention planning API

> Version 1.0.0

## About

The purpose of this software is to allow roadwork planners and executors of the Ville de Montreal to coordinate interventions and projects seamlessly and in accordance with annual priorities, budgets and constraints.

## Authentication

This API is secured with Bearer Authentication over TLS (HTTPS). | [https://swagger.io/docs/specification/authentication/bearer-authentication](https://swagger.io/docs/specification/authentication/bearer-authentication)

## Users

The identity server of the Ville de Montreal is the center component employed for user management.

## Permissions

This software uses the internal permission API developed by the Ville de Montreal.

## Path Table

| Method | Path                                                                                                                                                                                                         | Description                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| GET    | [/v1/info](#getv1info)                                                                                                                                                                                       | Retrieves name and version of the AGIR-Planification API.                                 |
| POST   | [/v1/annualPrograms](#postv1annualprograms)                                                                                                                                                                  | Creates an annual program.                                                                |
| GET    | [/v1/annualPrograms](#getv1annualprograms)                                                                                                                                                                   | Lists all active annual programs.                                                         |
| GET    | [/v1/annualPrograms/{id}](#getv1annualprogramsid)                                                                                                                                                            | Returns one specific annual program.                                                      |
| PUT    | [/v1/annualPrograms/{id}](#putv1annualprogramsid)                                                                                                                                                            | Updates one specific annual program.                                                      |
| DELETE | [/v1/annualPrograms/{id}](#deletev1annualprogramsid)                                                                                                                                                         | Deletes one specific annual program.                                                      |
| POST   | [/v1/annualPrograms/{id}/programBooks](#postv1annualprogramsidprogrambooks)                                                                                                                                  | Creates a program book.                                                                   |
| GET    | [/v1/annualPrograms/{id}/programBooks](#getv1annualprogramsidprogrambooks)                                                                                                                                   | Retrieves an annual program's program books.                                              |
| POST   | [/v1/opportunityNotices](#postv1opportunitynotices)                                                                                                                                                          | Creates a project opportunity notice for an asset that falls within a project workarea.   |
|  |
| GET    | [/v1/opportunityNotices](#getv1opportunitynotices)                                                                                                                                                           | Retrieves all the opportunity notices for a project.                                      |
| GET    | [/v1/opportunityNotices/{id}](#getv1opportunitynoticesid)                                                                                                                                                    | Retrieves a specific project opportunity notice.                                          |
| PUT    | [/v1/opportunityNotices/{id}](#putv1opportunitynoticesid)                                                                                                                                                    | Updates the content of a specific opportunity notice.                                     |
| POST   | [/v1/opportunityNotices/{id}/notes](#postv1opportunitynoticesidnotes)                                                                                                                                        | Adds a note to an opportunity notice.                                                     |
| PUT    | [/v1/opportunityNotices/{id}/notes/{noteId}](#putv1opportunitynoticesidnotesnoteid)                                                                                                                          | Modifies a note of an opportunity notice.                                                 |
| POST   | [/v1/interventions](#postv1interventions)                                                                                                                                                                    | Creates roadwork intervention.                                                            |
| GET    | [/v1/interventions](#getv1interventions)                                                                                                                                                                     | Lists all active roadwork interventions.                                                  |
| GET    | [/v1/interventions/{id}](#getv1interventionsid)                                                                                                                                                              | Returns one specific active roadwork intervention based on the identifier.                |
| PUT    | [/v1/interventions/{id}](#putv1interventionsid)                                                                                                                                                              | Modifies a specific intervention based on the identifier.                                 |
| DELETE | [/v1/interventions/{id}](#deletev1interventionsid)                                                                                                                                                           | Expires a specific intervention based on the identifier.                                  |
| PUT    | [/v1/interventions/{id}/annualDistribution](#putv1interventionsidannualdistribution)                                                                                                                         | Updates the intervention's annual distribution.                                           |
| POST   | [/v1/interventions/{id}/comments](#postv1interventionsidcomments)                                                                                                                                            | Creates a comment for an intervention based on the identifier.                            |
| GET    | [/v1/interventions/{id}/comments](#getv1interventionsidcomments)                                                                                                                                             | Lists all comments associated with an intervention based on the identifier.               |
| PUT    | [/v1/interventions/{id}/comments/{idComment}](#putv1interventionsidcommentsidcomment)                                                                                                                        | Updates a comment for an intervention based on the identifiers.                           |
| DELETE | [/v1/interventions/{id}/comments/{idComment}](#deletev1interventionsidcommentsidcomment)                                                                                                                     | Deletes a comment for an intervention based on the identifiers.                           |
| POST   | [/v1/interventions/{id}/decisions](#postv1interventionsiddecisions)                                                                                                                                          | Attaches a decision to an intervention based on the identifier.                           |
| GET    | [/v1/interventions/{id}/decisions](#getv1interventionsiddecisions)                                                                                                                                           | Returns decisions of an intervention based on the identifier.                             |
| POST   | [/v1/interventions/{id}/documents](#postv1interventionsiddocuments)                                                                                                                                          | Attaches a document to an intervention based on the identifier.                           |
| GET    | [/v1/interventions/{id}/documents/{documentId}](#getv1interventionsiddocumentsdocumentid)                                                                                                                    | Downloads an intervention document based on the identifier.                               |
| PUT    | [/v1/interventions/{id}/documents/{documentId}](#putv1interventionsiddocumentsdocumentid)                                                                                                                    | Updates a document to an intervention based on the identifiers.                           |
| DELETE | [/v1/interventions/{id}/documents/{documentId}](#deletev1interventionsiddocumentsdocumentid)                                                                                                                 | Deletes a specific document attached on a specific intervention based on the identifiers. |
| POST   | [/v1/interventions/search](#postv1interventionssearch)                                                                                                                                                       | Lists all active roadwork interventions.                                                  |
| GET    | [/v1/interventions/countBy](#getv1interventionscountby)                                                                                                                                                      | Gets a count of interventions.                                                            |
| POST   | [/v1/interventions/countBy](#postv1interventionscountby)                                                                                                                                                     | Gets a count of interventions.                                                            |
| POST   | [/v1/interventions/extract](#postv1interventionsextract)                                                                                                                                                     | Extracts in a CSV file all the existing interventions based on the search parameters.     |
| GET    | [/v1/programBooks](#getv1programbooks)                                                                                                                                                                       | Lists all program books.                                                                  |
| GET    | [/v1/programBooks/{id}](#getv1programbooksid)                                                                                                                                                                | Returns one specific program book.                                                        |
| PUT    | [/v1/programBooks/{id}](#putv1programbooksid)                                                                                                                                                                | Updates one specific program book.                                                        |
| DELETE | [/v1/programBooks/{id}](#deletev1programbooksid)                                                                                                                                                             | Deletes a program book.                                                                   |
| GET    | [/v1/programBooks/{id}/projects](#getv1programbooksidprojects)                                                                                                                                               | Retrieves a program book's projects.                                                      |
| POST   | [/v1/programBooks/{id}/projects](#postv1programbooksidprojects)                                                                                                                                              | Adds a project to the program book.                                                       |
| POST   | [/v1/programBooks/{id}/load](#postv1programbooksidload)                                                                                                                                                      | Loads automatically a program book.                                                       |
| PUT    | [/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/priorityLevels](#putv1programbooksprogrambookidpriorityscenariospriorityscenarioidprioritylevels)                                   |                                                                                           |
| POST   | [/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/calculations](#postv1programbooksprogrambookidpriorityscenariospriorityscenarioidcalculations)                                      |                                                                                           |
| GET    | [/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/orderedProjects](#getv1programbooksprogrambookidpriorityscenariospriorityscenarioidorderedprojects)                                 |                                                                                           |
| PUT    | [/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/orderedProjects/{projectId}/ranks](#putv1programbooksprogrambookidpriorityscenariospriorityscenarioidorderedprojectsprojectidranks) |                                                                                           |
| POST   | [/v1/programBooks/{programBookId}/objectives](#postv1programbooksprogrambookidobjectives)                                                                                                                    | Creates an objective for a program book based on the identifier.                          |
| GET    | [/v1/programBooks/{programBookId}/objectives](#getv1programbooksprogrambookidobjectives)                                                                                                                     | Retrieves all objectives associated with a program book based on the identifier.          |
| PUT    | [/v1/programBooks/{programBookId}/objectives/{id}](#putv1programbooksprogrambookidobjectivesid)                                                                                                              | Updates an objective for a program book based on the identifiers.                         |
| DELETE | [/v1/programBooks/{programBookId}/objectives/{id}](#deletev1programbooksprogrambookidobjectivesid)                                                                                                           | Deletes an objective for a program book based on the identifiers.                         |
| POST   | [/v1/projects](#postv1projects)                                                                                                                                                                              | Creates a project.                                                                        |
| GET    | [/v1/projects](#getv1projects)                                                                                                                                                                               | Lists all active projects.                                                                |
| GET    | [/v1/projects/{id}](#getv1projectsid)                                                                                                                                                                        | Returns one specific active project based on the identifier.                              |
| PUT    | [/v1/projects/{id}](#putv1projectsid)                                                                                                                                                                        | Modifies one specific active project based on the identifier.                             |
| POST   | [/v1/projects/{id}/decisions](#postv1projectsiddecisions)                                                                                                                                                    | Attaches a decision to an project, which change project status.                           |
| GET    | [/v1/projects/{id}/decisions](#getv1projectsiddecisions)                                                                                                                                                     | Returns the decisions of a project.                                                       |
| POST   | [/v1/projects/{id}/documents](#postv1projectsiddocuments)                                                                                                                                                    | Attaches a required document to a project based on the identifier.                        |
| GET    | [/v1/projects/{id}/documents/{documentId}](#getv1projectsiddocumentsdocumentid)                                                                                                                              | Downloads a project document based on the identifier.                                     |
| PUT    | [/v1/projects/{id}/documents/{documentId}](#putv1projectsiddocumentsdocumentid)                                                                                                                              | Updates a document to a project based on the identifiers.                                 |
| DELETE | [/v1/projects/{id}/documents/{documentId}](#deletev1projectsiddocumentsdocumentid)                                                                                                                           | Deletes a specific document attached to a project based on the identifiers.               |
| POST   | [/v1/projects/{id}/comments](#postv1projectsidcomments)                                                                                                                                                      | Creates a comment for a project based on the identifier.                                  |
| GET    | [/v1/projects/{id}/comments](#getv1projectsidcomments)                                                                                                                                                       | Lists all comments associated with a project based on the identifier.                     |
| PUT    | [/v1/projects/{id}/comments/{idComment}](#putv1projectsidcommentsidcomment)                                                                                                                                  | Updates a comment for a project based on the identifiers.                                 |
| DELETE | [/v1/projects/{id}/comments/{idComment}](#deletev1projectsidcommentsidcomment)                                                                                                                               | Deletes a comment for a project based on the identifiers.                                 |
| PUT    | [/v1/projects/{id}/annualDistribution](#putv1projectsidannualdistribution)                                                                                                                                   | Updates the project's annual distribution.                                                |
| POST   | [/v1/projects/search](#postv1projectssearch)                                                                                                                                                                 | Lists all active projects.                                                                |
| GET    | [/v1/projects/countBy](#getv1projectscountby)                                                                                                                                                                | Gets a count of projects.                                                                 |
| POST   | [/v1/projects/countBy](#postv1projectscountby)                                                                                                                                                               | Gets a count of projects.                                                                 |
| POST   | [/v1/projects/generateDrmNumber](#postv1projectsgeneratedrmnumber)                                                                                                                                           | Generates a common DRM number or different DRM numbers for the provided projects.         |
| DELETE | [/v1/projects/drmNumber](#deletev1projectsdrmnumber)                                                                                                                                                         | Deletes the DRM number for the provided projects.                                         |
| POST   | [/v1/projects/extract](#postv1projectsextract)                                                                                                                                                               | Extracts in an CSV file all the existing projects based on the search parameters.         |
| POST   | [/v1/search/work-area](#postv1searchwork-area)                                                                                                                                                               | Returns all surface areas combined in a geometry.                                         |
| POST   | [/v1/search/assets/work-area](#postv1searchassetswork-area)                                                                                                                                                  | Returns the specific assets and all the surface areas combined in a geometry.             |
| GET    | [/v1/taxonomies](#getv1taxonomies)                                                                                                                                                                           | Recovers all the taxonomies object.                                                       |
| POST   | [/v1/taxonomies](#postv1taxonomies)                                                                                                                                                                          | Creates a taxonomy.                                                                       |
| GET    | [/v1/taxonomies/{group}](#getv1taxonomiesgroup)                                                                                                                                                              | Recovers all the taxonomies objects for a specific group.                                 |
| PUT    | [/v1/taxonomies/{group}/{code}](#putv1taxonomiesgroupcode)                                                                                                                                                   | Modifies one specific taxonomy object.                                                    |
| DELETE | [/v1/taxonomies/{group}/{code}](#deletev1taxonomiesgroupcode)                                                                                                                                                | Deletes one taxonomy object.                                                              |
| GET    | [/v1/assets/{assetType}/{assetId}](#getv1assetsassettypeassetid)                                                                                                                                             | Returns one specific asset.                                                               |
| POST   | [/v1/assets/search](#postv1assetssearch)                                                                                                                                                                     | Returns all assets that fall within the specified criteria.                               |
| POST   | [/v1/assets/search/lastIntervention](#postv1assetssearchlastintervention)                                                                                                                                    | Retrieves the last intervention for each asset provided.                                  |
| POST   | [/v1/import/internal/projects](#postv1importinternalprojects)                                                                                                                                                | Imports a project from internal data source.                                              |
| POST   | [/v1/import/bicImportLogs](#postv1importbicimportlogs)                                                                                                                                                       | Creates a BIC import log.                                                                 |
| GET    | [/v1/import/bicImportLogs](#getv1importbicimportlogs)                                                                                                                                                        | Lists all the BIC import logs.                                                            |
| GET    | [/v1/me](#getv1me)                                                                                                                                                                                           | Gets the current user.                                                                    |
| GET    | [/v1/me/preferences](#getv1mepreferences)                                                                                                                                                                    |                                                                                           |
| PUT    | [/v1/me/preferences/{key}](#putv1mepreferenceskey)                                                                                                                                                           |                                                                                           |
| DELETE | [/v1/me/preferences/{key}](#deletev1mepreferenceskey)                                                                                                                                                        |                                                                                           |
| POST   | [/v1/nexoImports/file](#postv1nexoimportsfile)                                                                                                                                                               | Uploads the first file of a NEXO import and instantiates a NEXO import.                   |
| POST   | [/v1/nexoImports/{id}/import](#postv1nexoimportsidimport)                                                                                                                                                    | Starts a NEXO import.                                                                     |
| GET    | [/v1/nexoImports](#getv1nexoimports)                                                                                                                                                                         | Lists all NEXO imports.                                                                   |
| GET    | [/v1/nexoImports/{id}](#getv1nexoimportsid)                                                                                                                                                                  | Retrieves a NEXO import.                                                                  |
| PUT    | [/v1/nexoImports/{id}/file](#putv1nexoimportsidfile)                                                                                                                                                         | Uploads an additional file for a NEXO import.                                             |
| GET    | [/v1/nexoImports/{id}/file/{fileId}](#getv1nexoimportsidfilefileid)                                                                                                                                          | Retrieves a NEXO import file.                                                             |
| POST   | [/v1/import/rtu/projects](#postv1importrtuprojects)                                                                                                                                                          | Starts an Info-RTU import.                                                                |
| GET    | [/v1/rtuProjects](#getv1rtuprojects)                                                                                                                                                                         | Retrieves all RTU projects.                                                               |
| GET    | [/v1/rtuProjects/{id}](#getv1rtuprojectsid)                                                                                                                                                                  | Returns one specific RTU project based on the identifier.                                 |
| GET    | [/v1/rtuProjects/countBy](#getv1rtuprojectscountby)                                                                                                                                                          | Gets a count of RTU projects.                                                             |
| POST   | [/v1/rtuProjects/search](#postv1rtuprojectssearch)                                                                                                                                                           | Retrieves all RTU projects.                                                               |
| POST   | [/v1/export/projects](#postv1exportprojects)                                                                                                                                                                 | Starts an export to Info-RTU.                                                             |
| GET    | [/v1/rtuExportLogs](#getv1rtuexportlogs)                                                                                                                                                                     | Lists all the Info-RTU export logs.                                                       |
| GET    | [/v1/rtuExportLogs/{id}](#getv1rtuexportlogsid)                                                                                                                                                              | Returns one specific Info-RTU export log based on the identifier.                         |
| GET    | [/v1/rtuImportLogs](#getv1rtuimportlogs)                                                                                                                                                                     | Lists all the Info-RTU import logs.                                                       |
| GET    | [/v1/rtuImportLogs/{id}](#getv1rtuimportlogsid)                                                                                                                                                              | Returns one specific Info-RTU import log based on the identifier.                         |
| POST   | [/v1/requirements](#postv1requirements)                                                                                                                                                                      | Creates a requirement.                                                                    |
| GET    | [/v1/requirements](#getv1requirements)                                                                                                                                                                       | Retrieves all requirements.                                                               |
| PUT    | [/v1/requirements/{id}](#putv1requirementsid)                                                                                                                                                                | Modifies one specific requirement based on the identifier.                                |
| DELETE | [/v1/requirements/{id}](#deletev1requirementsid)                                                                                                                                                             | Deletes one specific requirement based on the identifier.                                 |
| POST   | [/v1/submissions](#postv1submissions)                                                                                                                                                                        | Creates a submission.                                                                     |
| POST   | [/v1/submissions/search](#postv1submissionssearch)                                                                                                                                                           | Retrieves all submissions.                                                                |
| GET    | [/v1/submissions/countBy](#getv1submissionscountby)                                                                                                                                                          | Gets a count of submissions.                                                              |
| PATCH  | [/v1/submissions/{submissionNumber}](#patchv1submissionssubmissionnumber)                                                                                                                                    | Modifies one specific submission based on the submission number.                          |
| GET    | [/v1/submissions/{submissionNumber}](#getv1submissionssubmissionnumber)                                                                                                                                      | Retrieves one specific submission based on the identifier.                                |
| POST   | [/v1/submissions/{submissionNumber}/add/project/{id}](#postv1submissionssubmissionnumberaddprojectid)                                                                                                        | Add one specific project to a specific submission.                                        |
| POST   | [/v1/submissions/{submissionNumber}/remove/project/{id}](#postv1submissionssubmissionnumberremoveprojectid)                                                                                                  | Removes one specific project from a specific submission.                                  |
| POST   | [/v1/submissions/{submissionNumber}/documents](#postv1submissionssubmissionnumberdocuments)                                                                                                                  | Attaches a document to submission based on the identifier.                                |
| POST   | [/v1/submissions/{submissionNumber}/requirements](#postv1submissionssubmissionnumberrequirements)                                                                                                            | Adds a requirement to a specific submission.                                              |
| PUT    | [/v1/submissions/{submissionNumber}/requirements/{id}](#putv1submissionssubmissionnumberrequirementsid)                                                                                                      | Modifies one specific requirement of a specific submission.                               |
| DELETE | [/v1/submissions/{submissionNumber}/requirements/{id}](#deletev1submissionssubmissionnumberrequirementsid)                                                                                                   | Deletes one specific requirement of a specific submission.                                |
| PATCH  | [/v1/submissions/{submissionNumber}/requirements/{id}](#patchv1submissionssubmissionnumberrequirementsid)                                                                                                    | Makes obsolete or undo one specific requirement of a specific submission.                 |
| GET    | [/v1/submissions/{submissionNumber}/documents/{documentId}](#getv1submissionssubmissionnumberdocumentsdocumentid)                                                                                            | Downloads a submission document based on the identifier and the submission number.        |
| PUT    | [/v1/submissions/{submissionNumber}/documents/{documentId}](#putv1submissionssubmissionnumberdocumentsdocumentid)                                                                                            | Modifies one specific document of a specific submission.                                  |
| DELETE | [/v1/submissions/{submissionNumber}/documents/{documentId}](#deletev1submissionssubmissionnumberdocumentsdocumentid)                                                                                         | Removes one specific document from a specific submission.                                 |

## Reference Table

| Name                    | Path                                                                                            | Description                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| BearerAuth              | [#/components/securitySchemes/BearerAuth](#componentssecurityschemesbearerauth)                 |                                                                 |
| OpenID                  | [#/components/securitySchemes/OpenID](#componentssecurityschemesopenid)                         |                                                                 |
| InterventionAssetTypeId | [#/components/parameters/InterventionAssetTypeId](#componentsparametersinterventionassettypeid) | Code(s) of the taxonomy corresponding to the group assetType.   |
| excludeProgramBookIds   | [#/components/parameters/excludeProgramBookIds](#componentsparametersexcludeprogrambookids)     | The program book ID excluded                                    |
| QueryId                 | [#/components/parameters/QueryId](#componentsparametersqueryid)                                 | the id of the resource                                          |
| Year                    | [#/components/parameters/Year](#componentsparametersyear)                                       | The resource year                                               |
| FromYear                | [#/components/parameters/FromYear](#componentsparametersfromyear)                               | Lower bound of the resource year                                |
| ToYear                  | [#/components/parameters/ToYear](#componentsparameterstoyear)                                   | Upper bound of the resource year                                |
| AnnualProgramStatus     | [#/components/parameters/AnnualProgramStatus](#componentsparametersannualprogramstatus)         | The annual program status                                       |
| PathFileId              | [#/components/parameters/PathFileId](#componentsparameterspathfileid)                           | The identifier of the resource                                  |
| NexoImportStatus        | [#/components/parameters/NexoImportStatus](#componentsparametersnexoimportstatus)               | The Nexo import status                                          |
| PathAssetId             | [#/components/parameters/PathAssetId](#componentsparameterspathassetid)                         | The asset\'s identifier                                         |
| PathAssetType           | [#/components/parameters/PathAssetType](#componentsparameterspathassettype)                     | The asset\'s type                                               |
| PathCommentId           | [#/components/parameters/PathCommentId](#componentsparameterspathcommentid)                     | The identifier of the resource                                  |
| PathDocumentId          | [#/components/parameters/PathDocumentId](#componentsparameterspathdocumentid)                   | The identifier of the resource                                  |
| PathId                  | [#/components/parameters/PathId](#componentsparameterspathid)                                   | The identifier of the resource                                  |
| PathInterventionId      | [#/components/parameters/PathInterventionId](#componentsparameterspathinterventionid)           | The intervention\'s identifier                                  |
| PathNoteId              | [#/components/parameters/PathNoteId](#componentsparameterspathnoteid)                           | The identifier of the resource                                  |
| PathProgramBookId       | [#/components/parameters/PathProgramBookId](#componentsparameterspathprogrambookid)             | The program book\'s identifier                                  |
| PathProjectId           | [#/components/parameters/PathProjectId](#componentsparameterspathprojectid)                     | The project\'s identifier                                       |
| PathPriorityScenarioId  | [#/components/parameters/PathPriorityScenarioId](#componentsparameterspathpriorityscenarioid)   | The priority scenario\'s identifier                             |
| PathTaxonomyGroup       | [#/components/parameters/PathTaxonomyGroup](#componentsparameterspathtaxonomygroup)             | The taxonomy group                                              |
| PathTaxonomyCode        | [#/components/parameters/PathTaxonomyCode](#componentsparameterspathtaxonomycode)               | The taxonomy code                                               |
| Id                      | [#/components/parameters/Id](#componentsparametersid)                                           | the id of the resource                                          |
| Ids                     | [#/components/parameters/Ids](#componentsparametersids)                                         | the id of the resource                                          |
| ObjectId                | [#/components/parameters/ObjectId](#componentsparametersobjectid)                               | the id of the object in the object storage                      |
| Accept                  | [#/components/parameters/Accept](#componentsparametersaccept)                                   | the returned format                                             |
| Accept-Language         | [#/components/parameters/Accept-Language](#componentsparametersaccept-language)                 | The language code                                               |
| AssetId                 | [#/components/parameters/AssetId](#componentsparametersassetid)                                 | The asset ID                                                    |
| AssetOwnerId            | [#/components/parameters/AssetOwnerId](#componentsparametersassetownerid)                       | The asset owner ID                                              |
| AssetTypeId             | [#/components/parameters/AssetTypeId](#componentsparametersassettypeid)                         | The asset type ID                                               |
| Bbox                    | [#/components/parameters/Bbox](#componentsparametersbbox)                                       | The request bounding box (lower bounds - SWL, upper bounds NEU) |
| BoroughId               | [#/components/parameters/BoroughId](#componentsparametersboroughid)                             | The borough ID                                                  |
| DecisionTypeId          | [#/components/parameters/DecisionTypeId](#componentsparametersdecisiontypeid)                   |                                                                 |
| Budget                  | [#/components/parameters/Budget](#componentsparametersbudget)                                   | The budget in thousands of CAD dollars                          |
| FromBudget              | [#/components/parameters/FromBudget](#componentsparametersfrombudget)                           | Lower bound of the budget in thousands of CAD dollars           |
| ToBudget                | [#/components/parameters/ToBudget](#componentsparameterstobudget)                               | Upper bound of the budget in thousands of CAD dollars           |
| CategoryId              | [#/components/parameters/CategoryId](#componentsparameterscategoryid)                           | The category ID                                                 |
| ProjectId               | [#/components/parameters/ProjectId](#componentsparametersprojectid)                             | The project ID                                                  |
| Content-Type            | [#/components/parameters/Content-Type](#componentsparameterscontent-type)                       | the input format                                                |
| ContinuationToken       | [#/components/parameters/ContinuationToken](#componentsparameterscontinuationtoken)             |                                                                 |
| CountBy                 | [#/components/parameters/CountBy](#componentsparameterscountby)                                 | Specifies the key to count the results by, for example:         |

boroughId
|
| Date | [#/components/parameters/Date](#componentsparametersdate) | Search by date |
| EndYear | [#/components/parameters/EndYear](#componentsparametersendyear) | The end year of the project |
| FromEndYear | [#/components/parameters/FromEndYear](#componentsparametersfromendyear) | Lower bound of the end year of the project |
| ToEndYear | [#/components/parameters/ToEndYear](#componentsparameterstoendyear) | Upper bound of the end year of the project |
| ETag | [#/components/parameters/ETag](#componentsparametersetag) | the version |
| Estimate | [#/components/parameters/Estimate](#componentsparametersestimate) | The cost estimate in thousands of CAD dollars |
| FromEstimate | [#/components/parameters/FromEstimate](#componentsparametersfromestimate) | Lower bound of the cost estimate in thousands of CAD dollars |
| ToEstimate | [#/components/parameters/ToEstimate](#componentsparameterstoestimate) | Upper bound of the cost estimate in thousands of CAD dollars |
| ExecutorId | [#/components/parameters/ExecutorId](#componentsparametersexecutorid) | The executor ID |
| Expand | [#/components/parameters/Expand](#componentsparametersexpand) | Adds additional properties. |
| Fields | [#/components/parameters/Fields](#componentsparametersfields) | Comma separated list of fields/attributes to return |
| InChargeId | [#/components/parameters/InChargeId](#componentsparametersinchargeid) | The ID of the person in charge of the project |
| InterventionAreaBbox | [#/components/parameters/InterventionAreaBbox](#componentsparametersinterventionareabbox) | The request bounding box (lower bounds - SWL, upper bounds NEU) |
| InterventionTypeId | [#/components/parameters/InterventionTypeId](#componentsparametersinterventiontypeid) | The intervention type ID |
| InterventionYear | [#/components/parameters/InterventionYear](#componentsparametersinterventionyear) | The intervention year |
| FromInterventionYear | [#/components/parameters/FromInterventionYear](#componentsparametersfrominterventionyear) | Lower bound of the intervention year |
| ToInterventionYear | [#/components/parameters/ToInterventionYear](#componentsparameterstointerventionyear) | Upper bound of the intervention year |
| Limit | [#/components/parameters/Limit](#componentsparameterslimit) | The numbers of items to return. |
| ProjectLimit | [#/components/parameters/ProjectLimit](#componentsparametersprojectlimit) | The numbers of items to return. |
| LogicalLayers | [#/components/parameters/LogicalLayers](#componentsparameterslogicallayers) | |
| MedalId | [#/components/parameters/MedalId](#componentsparametersmedalid) | The medal ID |
| Offset | [#/components/parameters/Offset](#componentsparametersoffset) | The result offset for pagination. |
| ProjectOffset | [#/components/parameters/ProjectOffset](#componentsparametersprojectoffset) | The result offset for pagination. |
| OrderBy | [#/components/parameters/OrderBy](#componentsparametersorderby) | Sort results, for example:
-estimate,-priority
|
| ProjectOrderBy | [#/components/parameters/ProjectOrderBy](#componentsparametersprojectorderby) | Sort results, for example:
-rank,-initialRank
|
| PlanificationYear | [#/components/parameters/PlanificationYear](#componentsparametersplanificationyear) | The planned year of the interventions |
| FromPlanificationYear | [#/components/parameters/FromPlanificationYear](#componentsparametersfromplanificationyear) | Lower bound of the planned year of the interventions |
| ToPlanificationYear | [#/components/parameters/ToPlanificationYear](#componentsparameterstoplanificationyear) | Upper bound of the planned year of the interventions |
| ProgramId | [#/components/parameters/ProgramId](#componentsparametersprogramid) | The program ID |
| ProgramBookId | [#/components/parameters/ProgramBookId](#componentsparametersprogrambookid) | The program book ID |
| Project | [#/components/parameters/Project](#componentsparametersproject) | The intervention project type ID. The only possible values are null or undefined. Allows to filter interventions without projects. |
| ProjectTypeId | [#/components/parameters/ProjectTypeId](#componentsparametersprojecttypeid) | The project type ID |
| Q | [#/components/parameters/Q](#componentsparametersq) | FullText search (interventionId, interventionName, projectId, projectName, drmNumber, submissionNumber) |
| ReferenceId | [#/components/parameters/ReferenceId](#componentsparametersreferenceid) | For the intervention or the project |
| RequestorId | [#/components/parameters/RequestorId](#componentsparametersrequestorid) | The requestor ID |
| StartYear | [#/components/parameters/StartYear](#componentsparametersstartyear) | The start year of the project |
| FromStartYear | [#/components/parameters/FromStartYear](#componentsparametersfromstartyear) | Lower bound of the start year of the project |
| ToStartYear | [#/components/parameters/ToStartYear](#componentsparameterstostartyear) | Upper bound of the start year of the project |
| Status | [#/components/parameters/Status](#componentsparametersstatus) | The status |
| ProgressStatus | [#/components/parameters/ProgressStatus](#componentsparametersprogressstatus) | |
| SubCategoryId | [#/components/parameters/SubCategoryId](#componentsparameterssubcategoryid) | The sub-category ID |
| InterventionProgramId | [#/components/parameters/InterventionProgramId](#componentsparametersinterventionprogramid) | Code(s) of the taxonomy corresponding to the group programType |
| IsGeolocated | [#/components/parameters/IsGeolocated](#componentsparametersisgeolocated) | Boolean whether the request should only return non-geolocated or geolocated projects |
| TaxonomyCode | [#/components/parameters/TaxonomyCode](#componentsparameterstaxonomycode) | The taxonomyCode: WorkType, Requestor, Borough, Status, etc. |
| TaxonomyCodeQuery | [#/components/parameters/TaxonomyCodeQuery](#componentsparameterstaxonomycodequery) | The taxonomyCode: WorkType, Requestor, Borough, Status, etc. |
| TermId | [#/components/parameters/TermId](#componentsparameterstermid) | The taxonomy term ID |
| TermCode | [#/components/parameters/TermCode](#componentsparameterstermcode) | The termCode: rehab, rtu, vdm, created, etc. |
| WorkTypeId | [#/components/parameters/WorkTypeId](#componentsparametersworktypeid) | The type of work ID |
| Key | [#/components/parameters/Key](#componentsparameterskey) | the unique key of the resource |
| AreaId | [#/components/parameters/AreaId](#componentsparametersareaid) | The area ID |
| PartnerId | [#/components/parameters/PartnerId](#componentsparameterspartnerid) | The partner ID |
| RtuStatus | [#/components/parameters/RtuStatus](#componentsparametersrtustatus) | The status |
| Phase | [#/components/parameters/Phase](#componentsparametersphase) | The phase |
| FromDateStart | [#/components/parameters/FromDateStart](#componentsparametersfromdatestart) | Lower bound of the start date of the project |
| ToDateStart | [#/components/parameters/ToDateStart](#componentsparameterstodatestart) | Upper bound of the start date of the project |
| FromDateEnd | [#/components/parameters/FromDateEnd](#componentsparametersfromdateend) | Lower bound of the end date of the project |
| ToDateEnd | [#/components/parameters/ToDateEnd](#componentsparameterstodateend) | Upper bound of the end date of the project |
| DrmNumber | [#/components/parameters/DrmNumber](#componentsparametersdrmnumber) | drm number(s) |
| SubmissionNumber | [#/components/parameters/SubmissionNumber](#componentsparameterssubmissionnumber) | Submission number(s) |
| IdQuery | [#/components/parameters/IdQuery](#componentsparametersidquery) | The id of the resource |
| ItemId | [#/components/parameters/ItemId](#componentsparametersitemid) | The identifier of the requirement item. |
| ItemType | [#/components/parameters/ItemType](#componentsparametersitemtype) | The requirement item type. |
| PathSubmissionNumber | [#/components/parameters/PathSubmissionNumber](#componentsparameterspathsubmissionnumber) | The submission number |
| DecisionRequired | [#/components/parameters/DecisionRequired](#componentsparametersdecisionrequired) | Whether the intervention has a decision required |
| Created | [#/components/responses/Created](#componentsresponsescreated) | The resource has been created |
| Accepted | [#/components/responses/Accepted](#componentsresponsesaccepted) | The resource was deleted |
| NoContent | [#/components/responses/NoContent](#componentsresponsesnocontent) | No content |
| NotFound | [#/components/responses/NotFound](#componentsresponsesnotfound) | The specified resource was not found |
| InvalidRequest | [#/components/responses/InvalidRequest](#componentsresponsesinvalidrequest) | Invalid request |
| Unauthorized | [#/components/responses/Unauthorized](#componentsresponsesunauthorized) | Unauthorized |
| Forbidden | [#/components/responses/Forbidden](#componentsresponsesforbidden) | Forbidden access |
| InvalidInput | [#/components/responses/InvalidInput](#componentsresponsesinvalidinput) | Method Not Allowed |
| UnexpectedError | [#/components/responses/UnexpectedError](#componentsresponsesunexpectederror) | Unexpected error |
| UnprocessableEntity | [#/components/responses/UnprocessableEntity](#componentsresponsesunprocessableentity) | Unprocessable entity |
| Conflict | [#/components/responses/Conflict](#componentsresponsesconflict) | Conflict |
| DiagnosticsInfo | [#/components/schemas/DiagnosticsInfo](#componentsschemasdiagnosticsinfo) | |
| ConflictualType | [#/components/schemas/ConflictualType](#componentsschemasconflictualtype) | Is a enum of intervention or a project |
| ConflictualItem | [#/components/schemas/ConflictualItem](#componentsschemasconflictualitem) | a conflictualItem write - read - |
| History | [#/components/schemas/History](#componentsschemashistory) | history for intervention and project |
| PlainIntervention | [#/components/schemas/PlainIntervention](#componentsschemasplainintervention) | |
| PlainPaginatedInterventions | [#/components/schemas/PlainPaginatedInterventions](#componentsschemasplainpaginatedinterventions) | a paginated collection of interventions |
| EnrichedAnnualProgram | [#/components/schemas/EnrichedAnnualProgram](#componentsschemasenrichedannualprogram) | An enriched annual program |
| BaseIntervention | [#/components/schemas/BaseIntervention](#componentsschemasbaseintervention) | |
| EnrichedIntervention | [#/components/schemas/EnrichedIntervention](#componentsschemasenrichedintervention) | |
| EnrichedPaginatedInterventions | [#/components/schemas/EnrichedPaginatedInterventions](#componentsschemasenrichedpaginatedinterventions) | a paginated collection of interventions |
| EnrichedProgramBook | [#/components/schemas/EnrichedProgramBook](#componentsschemasenrichedprogrambook) | |
| EnrichedPaginatedProgramBooks | [#/components/schemas/EnrichedPaginatedProgramBooks](#componentsschemasenrichedpaginatedprogrambooks) | a paginated collection of program books |
| EnrichedInterventionHistory | [#/components/schemas/EnrichedInterventionHistory](#componentsschemasenrichedinterventionhistory) | the list of enriched content of an historical intervention feature |
| PlainAnnualProgram | [#/components/schemas/PlainAnnualProgram](#componentsschemasplainannualprogram) | An enriched annual program |
| PlainProgramBook | [#/components/schemas/PlainProgramBook](#componentsschemasplainprogrambook) | The plain version program book |
| BaseProject | [#/components/schemas/BaseProject](#componentsschemasbaseproject) | |
| PlainProject | [#/components/schemas/PlainProject](#componentsschemasplainproject) | |
| PlainPaginatedProjects | [#/components/schemas/PlainPaginatedProjects](#componentsschemasplainpaginatedprojects) | a paginated collection of plain projects |
| InputDrmProject | [#/components/schemas/InputDrmProject](#componentsschemasinputdrmproject) | |
| DrmProject | [#/components/schemas/DrmProject](#componentsschemasdrmproject) | |
| RtuExport | [#/components/schemas/RtuExport](#componentsschemasrtuexport) | |
| EnrichedProject | [#/components/schemas/EnrichedProject](#componentsschemasenrichedproject) | |
| EnrichedPaginatedProjects | [#/components/schemas/EnrichedPaginatedProjects](#componentsschemasenrichedpaginatedprojects) | a paginated collection of enriched projects |
| EnrichedProjectAnnualDistribution | [#/components/schemas/EnrichedProjectAnnualDistribution](#componentsschemasenrichedprojectannualdistribution) | |
| AnnualProjectDistributionSummary | [#/components/schemas/AnnualProjectDistributionSummary](#componentsschemasannualprojectdistributionsummary) | |
| AdditionalCostsTotalAmount | [#/components/schemas/AdditionalCostsTotalAmount](#componentsschemasadditionalcoststotalamount) | |
| PlainProjectAnnualDistribution | [#/components/schemas/PlainProjectAnnualDistribution](#componentsschemasplainprojectannualdistribution) | |
| PlainProjectAnnualDistributionSummary | [#/components/schemas/PlainProjectAnnualDistributionSummary](#componentsschemasplainprojectannualdistributionsummary) | |
| PlainProjectAnnualPeriod | [#/components/schemas/PlainProjectAnnualPeriod](#componentsschemasplainprojectannualperiod) | |
| AnnualPeriodInterventions | [#/components/schemas/AnnualPeriodInterventions](#componentsschemasannualperiodinterventions) | |
| EnrichedProjectAnnualPeriod | [#/components/schemas/EnrichedProjectAnnualPeriod](#componentsschemasenrichedprojectannualperiod) | |
| AdditionalCost | [#/components/schemas/AdditionalCost](#componentsschemasadditionalcost) | |
| InterventionAnnualDistribution | [#/components/schemas/InterventionAnnualDistribution](#componentsschemasinterventionannualdistribution) | the ventilation of the intervention within its related project
|
| AnnualInterventionDistributionSummary | [#/components/schemas/AnnualInterventionDistributionSummary](#componentsschemasannualinterventiondistributionsummary) | |
| AnnualBudgetDistributionSummary | [#/components/schemas/AnnualBudgetDistributionSummary](#componentsschemasannualbudgetdistributionsummary) | |
| InterventionAnnualPeriod | [#/components/schemas/InterventionAnnualPeriod](#componentsschemasinterventionannualperiod) | |
| CountBy | [#/components/schemas/CountBy](#componentsschemascountby) | The count of items based on a key. |
| Project | [#/components/schemas/Project](#componentsschemasproject) | the project integration |
| InterventionSearchRequest | [#/components/schemas/InterventionSearchRequest](#componentsschemasinterventionsearchrequest) | The intervention search request. |
| OrderedProjectsPaginatedSearchRequest | [#/components/schemas/OrderedProjectsPaginatedSearchRequest](#componentsschemasorderedprojectspaginatedsearchrequest) | |
| InterventionPaginatedSearchRequest | [#/components/schemas/InterventionPaginatedSearchRequest](#componentsschemasinterventionpaginatedsearchrequest) | |
| InterventionCountBySearchRequest | [#/components/schemas/InterventionCountBySearchRequest](#componentsschemasinterventioncountbysearchrequest) | |
| AssetsLastInterventionSearchRequest | [#/components/schemas/AssetsLastInterventionSearchRequest](#componentsschemasassetslastinterventionsearchrequest) | |
| AssetLastIntervention | [#/components/schemas/AssetLastIntervention](#componentsschemasassetlastintervention) | |
| LastIntervention | [#/components/schemas/LastIntervention](#componentsschemaslastintervention) | |
| ProjectSearchRequest | [#/components/schemas/ProjectSearchRequest](#componentsschemasprojectsearchrequest) | The project search request object sent as a parameter. |
| ProjectPaginatedSearchRequest | [#/components/schemas/ProjectPaginatedSearchRequest](#componentsschemasprojectpaginatedsearchrequest) | |
| ProjectCountBySearchRequest | [#/components/schemas/ProjectCountBySearchRequest](#componentsschemasprojectcountbysearchrequest) | |
| RtuProjectSearchRequest | [#/components/schemas/RtuProjectSearchRequest](#componentsschemasrtuprojectsearchrequest) | The RTU project search request. |
| PlainComment | [#/components/schemas/PlainComment](#componentsschemasplaincomment) | input for comment |
| Comment | [#/components/schemas/Comment](#componentsschemascomment) | the comments on the intervention |
| ExternalReferenceId | [#/components/schemas/ExternalReferenceId](#componentsschemasexternalreferenceid) | an external intervention or project reference |
| SubmissionDocumentRequest | [#/components/schemas/SubmissionDocumentRequest](#componentsschemassubmissiondocumentrequest) | the attached document and metadata |
| PlainDocument | [#/components/schemas/PlainDocument](#componentsschemasplaindocument) | the attached document and metadata
|
| EnrichedDocument | [#/components/schemas/EnrichedDocument](#componentsschemasenricheddocument) | the persisted attached documents
|
| InterventionDecision | [#/components/schemas/InterventionDecision](#componentsschemasinterventiondecision) | a decision attached to an intervention or project |
| DecisionList | [#/components/schemas/DecisionList](#componentsschemasdecisionlist) | the list of decision for an intervention |
| ProjectDecision | [#/components/schemas/ProjectDecision](#componentsschemasprojectdecision) | a decision attached to an intervention or project |
| Priority | [#/components/schemas/Priority](#componentsschemaspriority) | |
| PriorityWeight | [#/components/schemas/PriorityWeight](#componentsschemaspriorityweight) | |
| Objective | [#/components/schemas/Objective](#componentsschemasobjective) | |
| Rule | [#/components/schemas/Rule](#componentsschemasrule) | |
| Budget | [#/components/schemas/Budget](#componentsschemasbudget) | |
| Asset | [#/components/schemas/Asset](#componentsschemasasset) | |
| AssetDesignData | [#/components/schemas/AssetDesignData](#componentsschemasassetdesigndata) | |
| AssetList | [#/components/schemas/AssetList](#componentsschemasassetlist) | |
| AssetsWorkAreaSearchRequest | [#/components/schemas/AssetsWorkAreaSearchRequest](#componentsschemasassetsworkareasearchrequest) | The assets search criterias. |
| AssetsWorkArea | [#/components/schemas/AssetsWorkArea](#componentsschemasassetsworkarea) | The assets and the combined surface areas geometry. |
| InterventionArea | [#/components/schemas/InterventionArea](#componentsschemasinterventionarea) | |
| Taxonomy | [#/components/schemas/Taxonomy](#componentsschemastaxonomy) | the taxonomy object |
| TaxonomyList | [#/components/schemas/TaxonomyList](#componentsschemastaxonomylist) | |
| Audit | [#/components/schemas/Audit](#componentsschemasaudit) | Audit fields following vdm standard |
| Uuid | [#/components/schemas/Uuid](#componentsschemasuuid) | The id of the object |
| UuidOrUuidArray | [#/components/schemas/UuidOrUuidArray](#componentsschemasuuidoruuidarray) | |
| ProjectCategory | [#/components/schemas/ProjectCategory](#componentsschemasprojectcategory) | |
| ProjectIdRequest | [#/components/schemas/ProjectIdRequest](#componentsschemasprojectidrequest) | |
| ReferenceId | [#/components/schemas/ReferenceId](#componentsschemasreferenceid) | The external reference id of the object |
| Uri | [#/components/schemas/Uri](#componentsschemasuri) | the uri of a document |
| Author | [#/components/schemas/Author](#componentsschemasauthor) | |
| Date | [#/components/schemas/Date](#componentsschemasdate) | a date used a timestamp, start and end dates |
| Interval | [#/components/schemas/Interval](#componentsschemasinterval) | a number of day |
| FeatureCollection | [#/components/schemas/FeatureCollection](#componentsschemasfeaturecollection) | GeoJSon Feature collection |
| Feature | [#/components/schemas/Feature](#componentsschemasfeature) | GeoJSon Feature |
| Geometry | [#/components/schemas/Geometry](#componentsschemasgeometry) | GeoJSon geometry object |
| SearchAssetsRequest | [#/components/schemas/SearchAssetsRequest](#componentsschemassearchassetsrequest) | Describes asset search parameters |
| GeometryType | [#/components/schemas/GeometryType](#componentsschemasgeometrytype) | The type of the feature's geometry |
| Point | [#/components/schemas/Point](#componentsschemaspoint) | Point in 3D space |
| MultiPoint | [#/components/schemas/MultiPoint](#componentsschemasmultipoint) | |
| LineString | [#/components/schemas/LineString](#componentsschemaslinestring) | |
| MultiLineString | [#/components/schemas/MultiLineString](#componentsschemasmultilinestring) | |
| Polygon | [#/components/schemas/Polygon](#componentsschemaspolygon) | |
| MultiPolygon | [#/components/schemas/MultiPolygon](#componentsschemasmultipolygon) | |
| Point3D | [#/components/schemas/Point3D](#componentsschemaspoint3d) | Point in 3D space |
| Paging | [#/components/schemas/Paging](#componentsschemaspaging) | |
| ContinuationToken | [#/components/schemas/ContinuationToken](#componentsschemascontinuationtoken) | A base 64 server timestamp_id continuation token for syncing. {timestamp}-{id} |
| Created | [#/components/schemas/Created](#componentsschemascreated) | |
| ErrorResponse | [#/components/schemas/ErrorResponse](#componentsschemaserrorresponse) | |
| ApiError | [#/components/schemas/ApiError](#componentsschemasapierror) | |
| ApiInnerError | [#/components/schemas/ApiInnerError](#componentsschemasapiinnererror) | |
| LocalizedText | [#/components/schemas/LocalizedText](#componentsschemaslocalizedtext) | |
| Length | [#/components/schemas/Length](#componentsschemaslength) | |
| Borough | [#/components/schemas/Borough](#componentsschemasborough) | |
| SearchBbox | [#/components/schemas/SearchBbox](#componentsschemassearchbbox) | The bbox for spatial search. A comma separated list of coordinates. |
| StringOrStringArray | [#/components/schemas/StringOrStringArray](#componentsschemasstringorstringarray) | |
| ShpProperty | [#/components/schemas/ShpProperty](#componentsschemasshpproperty) | a shape file for import of interventions and projects |
| BicProject | [#/components/schemas/BicProject](#componentsschemasbicproject) | project imported by BIC |
| GenerationReport | [#/components/schemas/GenerationReport](#componentsschemasgenerationreport) | The report returned from the generateReport function |
| HistorySummary | [#/components/schemas/HistorySummary](#componentsschemashistorysummary) | An history for a modification on a intervention or a project |
| User | [#/components/schemas/User](#componentsschemasuser) | The user |
| GdaPrivileges | [#/components/schemas/GdaPrivileges](#componentsschemasgdaprivileges) | |
| BaseObjective | [#/components/schemas/BaseObjective](#componentsschemasbaseobjective) | |
| PlainObjective | [#/components/schemas/PlainObjective](#componentsschemasplainobjective) | |
| EnrichedObjective | [#/components/schemas/EnrichedObjective](#componentsschemasenrichedobjective) | |
| ObjectiveValues | [#/components/schemas/ObjectiveValues](#componentsschemasobjectivevalues) | The objective values. Contains the reference and the calclated values. |
| ImportProjectRequest | [#/components/schemas/ImportProjectRequest](#componentsschemasimportprojectrequest) | |
| BicImportLog | [#/components/schemas/BicImportLog](#componentsschemasbicimportlog) | |
| PaginatedBicImportLogs | [#/components/schemas/PaginatedBicImportLogs](#componentsschemaspaginatedbicimportlogs) | a paginated collection of import logs |
| PlainUserPreference | [#/components/schemas/PlainUserPreference](#componentsschemasplainuserpreference) | |
| EnrichedUserPreference | [#/components/schemas/EnrichedUserPreference](#componentsschemasenricheduserpreference) | |
| PriorityScenario | [#/components/schemas/PriorityScenario](#componentsschemaspriorityscenario) | |
| PlainPriorityLevel | [#/components/schemas/PlainPriorityLevel](#componentsschemasplainprioritylevel) | |
| EnrichedPriorityLevel | [#/components/schemas/EnrichedPriorityLevel](#componentsschemasenrichedprioritylevel) | |
| OrderedProject | [#/components/schemas/OrderedProject](#componentsschemasorderedproject) | |
| PaginatedOrderedProjects | [#/components/schemas/PaginatedOrderedProjects](#componentsschemaspaginatedorderedprojects) | a paginated collection of enriched projects |
| ProjectRank | [#/components/schemas/ProjectRank](#componentsschemasprojectrank) | |
| PriorityLevelCriteria | [#/components/schemas/PriorityLevelCriteria](#componentsschemasprioritylevelcriteria) | priority level criteria
|
| BaseOpportunityNotice | [#/components/schemas/BaseOpportunityNotice](#componentsschemasbaseopportunitynotice) | |
| PlainOpportunityNotice | [#/components/schemas/PlainOpportunityNotice](#componentsschemasplainopportunitynotice) | |
| EnrichedOpportunityNotice | [#/components/schemas/EnrichedOpportunityNotice](#componentsschemasenrichedopportunitynotice) | |
| EnrichedOpportunityNoticePaginated | [#/components/schemas/EnrichedOpportunityNoticePaginated](#componentsschemasenrichedopportunitynoticepaginated) | a paginated collection of enriched opportunity notice |
| PlainNote | [#/components/schemas/PlainNote](#componentsschemasplainnote) | |
| EnrichedNote | [#/components/schemas/EnrichedNote](#componentsschemasenrichednote) | |
| PlainOpportunityNoticeResponse | [#/components/schemas/PlainOpportunityNoticeResponse](#componentsschemasplainopportunitynoticeresponse) | |
| EnrichedOpportunityNoticeResponse | [#/components/schemas/EnrichedOpportunityNoticeResponse](#componentsschemasenrichedopportunitynoticeresponse) | |
| ObjectiveCalculation | [#/components/schemas/ObjectiveCalculation](#componentsschemasobjectivecalculation) | |
| PlainNexoImportFile | [#/components/schemas/PlainNexoImportFile](#componentsschemasplainnexoimportfile) | a NEXO import file |
| NexoImportLog | [#/components/schemas/NexoImportLog](#componentsschemasnexoimportlog) | a NEXO import log |
| NexoImportFile | [#/components/schemas/NexoImportFile](#componentsschemasnexoimportfile) | a NEXO import file |
| NexoLogIntervention | [#/components/schemas/NexoLogIntervention](#componentsschemasnexologintervention) | |
| NexoLogProject | [#/components/schemas/NexoLogProject](#componentsschemasnexologproject) | |
| ServicePriority | [#/components/schemas/ServicePriority](#componentsschemasservicepriority) | |
| AllowedMimeType | [#/components/schemas/AllowedMimeType](#componentsschemasallowedmimetype) | |
| ProjectCategoryCriteria | [#/components/schemas/ProjectCategoryCriteria](#componentsschemasprojectcategorycriteria) | |
| PriorityLevelSortCriteria | [#/components/schemas/PriorityLevelSortCriteria](#componentsschemasprioritylevelsortcriteria) | a sort criteria of a priority level |
| RtuProject | [#/components/schemas/RtuProject](#componentsschemasrtuproject) | |
| RtuProjectContact | [#/components/schemas/RtuProjectContact](#componentsschemasrtuprojectcontact) | |
| PaginatedRtuProjects | [#/components/schemas/PaginatedRtuProjects](#componentsschemaspaginatedrtuprojects) | a paginated collection of RTU projects |
| SubmissionCreateRequest | [#/components/schemas/SubmissionCreateRequest](#componentsschemassubmissioncreaterequest) | |
| SubmissionsSearchRequest | [#/components/schemas/SubmissionsSearchRequest](#componentsschemassubmissionssearchrequest) | The submissions search request. |
| SubmissionPatchRequest | [#/components/schemas/SubmissionPatchRequest](#componentsschemassubmissionpatchrequest) | |
| Submission | [#/components/schemas/Submission](#componentsschemassubmission) | A submission. |
| StatusHistoryItem | [#/components/schemas/StatusHistoryItem](#componentsschemasstatushistoryitem) | |
| ProgressHistoryItem | [#/components/schemas/ProgressHistoryItem](#componentsschemasprogresshistoryitem) | |
| SubmissionRequirementRequest | [#/components/schemas/SubmissionRequirementRequest](#componentsschemassubmissionrequirementrequest) | A requirement. |
| SubmissionRequirement | [#/components/schemas/SubmissionRequirement](#componentsschemassubmissionrequirement) | A requirement. |
| RtuExportLog | [#/components/schemas/RtuExportLog](#componentsschemasrtuexportlog) | |
| RtuImportLog | [#/components/schemas/RtuImportLog](#componentsschemasrtuimportlog) | |
| PlainRequirement | [#/components/schemas/PlainRequirement](#componentsschemasplainrequirement) | A constraint or technical requirement. |
| Requirement | [#/components/schemas/Requirement](#componentsschemasrequirement) | |
| RequirementItem | [#/components/schemas/RequirementItem](#componentsschemasrequirementitem) | A requirement item. |
| DesignData | [#/components/schemas/DesignData](#componentsschemasdesigndata) | |
| InterventionExtractSearchRequest | [#/components/schemas/InterventionExtractSearchRequest](#componentsschemasinterventionextractsearchrequest) | The intervention search request. |
| ProjectExtractSearchRequest | [#/components/schemas/ProjectExtractSearchRequest](#componentsschemasprojectextractsearchrequest) | The project search request object sent as a parameter. |

## Path Details

---

### [GET]/v1/info

- Summary  
  Retrieves name and version of the AGIR-Planification API.

- Description  
  Allows to retrieve name and version of the AGIR-Planification API.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  name: string;
  description: string;
  version: string;
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 503 undefined

---

### [POST]/v1/annualPrograms

- Summary  
  Creates an annual program.

- Description  
  Allows to create an annual program. Validates the body content and returns the created annual program.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// An enriched annual program
{
  // The identifier of the executor. Comes from taxonomies.
  executorId: string
  // The annual program's year.
  year: number
  // The annual program's description
  description?: string
  // The maximum budget cap in thousands of dollars for a project to be in the program book.
  budgetCap: number
  sharedRoles?: string[]
  // The annual program's status.
  status?: string
}
```

#### Responses

- 201 Created

`application/json`

```ts
// An enriched annual program
{
  // The id of the object
  id: string
  // The identifier of the executor. Comes from taxonomies.
  executorId: string
  // The annual program's year.
  year: number
  // The annual program's description
  description?: string
  // The maximum budget cap in thousands of dollars for a project to be in the program book.
  budgetCap: number
  sharedRoles?: string[]
  programBooks?:  & #/components/schemas/PlainProgramBook &[]
  // The annual program's status.
  status: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // Tells whether the user has limited access to this annual program. Usually true when the user can see a program book but not the annual program info. When true only the id, executorId and the year are returned.
  limitedAccess?: boolean
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/annualPrograms

- Summary  
  Lists all active annual programs.

- Description  
  Allows to view a list of the active annual programs based on query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
expand?: string[]
```

```ts
fields?: string | string[]
```

```ts
// The id of the object
id?: string
```

```ts
year?: integer
```

```ts
fromYear?: integer
```

```ts
toYear?: integer
```

```ts
executorId?: string | string[]
```

```ts
status?: string
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// A paginated collection of annual programs
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  // An enriched annual program
  items: {
    // The id of the object
    id: string
    // The identifier of the executor. Comes from taxonomies.
    executorId: string
    // The annual program's year.
    year: number
    // The annual program's description
    description?: string
    // The maximum budget cap in thousands of dollars for a project to be in the program book.
    budgetCap: number
    sharedRoles?: string[]
    programBooks?:  & #/components/schemas/PlainProgramBook &[]
    // The annual program's status.
    status: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
    // Tells whether the user has limited access to this annual program. Usually true when the user can see a program book but not the annual program info. When true only the id, executorId and the year are returned.
    limitedAccess?: boolean
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/annualPrograms/{id}

- Summary  
  Returns one specific annual program.

- Description  
  Allows to retrieve one specific annual program based on the identifier.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
fields?: string | string[]
```

```ts
expand?: string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 OK

`application/json`

```ts
// An enriched annual program
{
  // The id of the object
  id: string
  // The identifier of the executor. Comes from taxonomies.
  executorId: string
  // The annual program's year.
  year: number
  // The annual program's description
  description?: string
  // The maximum budget cap in thousands of dollars for a project to be in the program book.
  budgetCap: number
  sharedRoles?: string[]
  programBooks?:  & #/components/schemas/PlainProgramBook &[]
  // The annual program's status.
  status: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // Tells whether the user has limited access to this annual program. Usually true when the user can see a program book but not the annual program info. When true only the id, executorId and the year are returned.
  limitedAccess?: boolean
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/annualPrograms/{id}

- Summary  
  Updates one specific annual program.

- Description  
  Allows to update one specific annual program based on the identifier. Returns the updated annual program.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### RequestBody

- application/json

```ts
// An enriched annual program
{
  // The identifier of the executor. Comes from taxonomies.
  executorId: string
  // The annual program's year.
  year: number
  // The annual program's description
  description?: string
  // The maximum budget cap in thousands of dollars for a project to be in the program book.
  budgetCap: number
  sharedRoles?: string[]
  // The annual program's status.
  status?: string
}
```

#### Responses

- 200 OK

`application/json`

```ts
// An enriched annual program
{
  // The id of the object
  id: string
  // The identifier of the executor. Comes from taxonomies.
  executorId: string
  // The annual program's year.
  year: number
  // The annual program's description
  description?: string
  // The maximum budget cap in thousands of dollars for a project to be in the program book.
  budgetCap: number
  sharedRoles?: string[]
  programBooks?:  & #/components/schemas/PlainProgramBook &[]
  // The annual program's status.
  status: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // Tells whether the user has limited access to this annual program. Usually true when the user can see a program book but not the annual program info. When true only the id, executorId and the year are returned.
  limitedAccess?: boolean
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/annualPrograms/{id}

- Summary  
  Deletes one specific annual program.

- Description  
  Allows to delete one specific annual program based on the identifier.

- Security  
  BearerAuth

#### Responses

- 204 No content

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/annualPrograms/{id}/programBooks

- Summary  
  Creates a program book.

- Description  
  Allows to create a program book in an annual program. Validates the body content and returns the created program book.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// The plain version program book
{
  // The name of the program book
  name: string
  projectTypes?: string[]
  // The name of the person in charge of the program book. Free text field.
  inCharge?: string
  boroughIds?: string[]
  sharedRoles?: string[]
  // The status of the program book. Value from taxonomies.
  status?: string
  programTypes?: string[]
  // The description of the program book
  description?: string
}
```

#### Responses

- 201 Created

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "annualProgramId": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainProgramBook"
    },
    {
      "description": "The enriched program book",
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualProgram": {
          "$ref": "#/components/schemas/EnrichedAnnualProgram"
        },
        "objectives": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedObjective"
          }
        },
        "projects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjectsIds": {
          "type": "array",
          "description": "An array of removed projects ids for this book.",
          "items": {
            "type": "string"
          }
        },
        "priorityScenarios": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PriorityScenario"
          }
        },
        "isAutomaticLoadingInProgress": {
          "type": "boolean",
          "description": "Indicates whether an automatic loading is in progress or not."
        }
      },
      "required": [
        "id",
        "status",
        "annualProgramId",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/annualPrograms/{id}/programBooks

- Summary  
  Retrieves an annual program's program books.

- Description  
  Allows to retrieve the list of program books in an annual program.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
expand?: string[]
```

```ts
fields?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 OK

`application/json`

```ts
undefined?:  & #/components/schemas/PlainProgramBook &[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/opportunityNotices

- Summary  
  Creates a project opportunity notice for an asset that falls within a project workarea.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "description": "The opportunity notice. Used to create or update opportunity notice."
    },
    {
      "properties": {
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PlainNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/PlainOpportunityNoticeResponse"
        }
      }
    }
  ]
}
```

#### Responses

- 201 Created

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "properties": {
        "status": {
          "type": "string"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/EnrichedOpportunityNoticeResponse"
        }
      }
    },
    {
      "required": [
        "status",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 500 undefined

---

### [GET]/v1/opportunityNotices

- Summary  
  Retrieves all the opportunity notices for a project.

- Description  
  Allows to retrieve all the opportunity notices associated to a project.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
projectId?: string | string[]
```

#### Responses

- 200 Successful

`application/json`

```ts
undefined?:  & #/components/schemas/BaseOpportunityNotice &  &[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 500 undefined

---

### [GET]/v1/opportunityNotices/{id}

- Summary  
  Retrieves a specific project opportunity notice.

- Description  
  Allows to retrieve a specific project opportunity notice based on the identifier.

- Security  
  BearerAuth

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "properties": {
        "status": {
          "type": "string"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/EnrichedOpportunityNoticeResponse"
        }
      }
    },
    {
      "required": [
        "status",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 500 undefined

---

### [PUT]/v1/opportunityNotices/{id}

- Summary  
  Updates the content of a specific opportunity notice.

- Description  
  Allows to update the content of a specific opportunity notice based on the identifier. Returns the updated opportunity notice.

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "description": "The opportunity notice. Used to create or update opportunity notice."
    },
    {
      "properties": {
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PlainNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/PlainOpportunityNoticeResponse"
        }
      }
    }
  ]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "properties": {
        "status": {
          "type": "string"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/EnrichedOpportunityNoticeResponse"
        }
      }
    },
    {
      "required": [
        "status",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 500 undefined

---

### [POST]/v1/opportunityNotices/{id}/notes

- Summary  
  Adds a note to an opportunity notice.

- Description  
  Allows to add a note to an opportunity notice based on the identifier. Returns the updated opportunity notice.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  text: string;
}
```

#### Responses

- 201 Created

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "properties": {
        "status": {
          "type": "string"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/EnrichedOpportunityNoticeResponse"
        }
      }
    },
    {
      "required": [
        "status",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 500 undefined

---

### [PUT]/v1/opportunityNotices/{id}/notes/{noteId}

- Summary  
  Modifies a note of an opportunity notice.

- Description  
  Allows to modify a note of an opportunity notice based on the identifiers. Returns the updated opportunity notice.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  text: string;
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "properties": {
        "status": {
          "type": "string"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/EnrichedOpportunityNoticeResponse"
        }
      }
    },
    {
      "required": [
        "status",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 500 undefined

---

### [POST]/v1/interventions

- Summary  
  Creates roadwork intervention.

- Description  
  Allows to create a roadwork intervention. Validates the body content and returns the created intervention.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "description": "a plain intervention feature write - for taxonomyCode read -"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "estimate": {
          "type": "number",
          "description": "the initial work estimate in dollars",
          "example": 100000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea"
  ]
}
```

#### Responses

- 201 Created

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched intervention feature"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "version": {
          "type": "integer"
        },
        "estimate": {
          "$ref": "#/components/schemas/Budget"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/InterventionAnnualDistribution"
        },
        "project": {
          "$ref": "#/components/schemas/Project"
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/InterventionDecision"
          }
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "streetName": {
          "type": "string",
          "description": "Suggested street name"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        },
        "designData": {
          "$ref": "#/components/schemas/DesignData"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea",
    "audit"
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/interventions

- Summary  
  Lists all active roadwork interventions.

- Description  
  Allows to view/export a list of the active roadwork interventions based on query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
id?: string | string[]
```

```ts
assetId?: string | string[]
```

```ts
assetOwnerId?: string | string[]
```

```ts
assetTypeId?: string | string[]
```

```ts
boroughId?: string | string[]
```

```ts
decisionTypeId?: string | string[]
```

```ts
estimate?: integer
```

```ts
fromEstimate?: number
```

```ts
toEstimate?: number
```

```ts
// Comma separated list of coordinates
interventionAreaBbox?: string
```

```ts
type?: string
```

```ts
interventionYear?: integer
```

```ts
fromInterventionYear?: integer
```

```ts
toInterventionYear?: integer
```

```ts
medalId?: string | string[]
```

```ts
planificationYear?: integer
```

```ts
fromPlanificationYear?: integer
```

```ts
toPlanificationYear?: integer
```

```ts
programId?: string | string[]
```

```ts
project?: string
```

```ts
q?: string
```

```ts
requestorId?: string | string[]
```

```ts
status?: string
```

```ts
workTypeId?: string | string[]
```

```ts
expand?: string[]
```

```ts
fields?: string | string[]
```

```ts
decisionRequired?: boolean
```

```ts
executorId?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// a paginated collection of interventions
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseIntervention &[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/interventions/{id}

- Summary  
  Returns one specific active roadwork intervention based on the identifier.

- Description  
  Allows to view/export one specific active roadwork intervention based on the query parameters.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched intervention feature"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "version": {
          "type": "integer"
        },
        "estimate": {
          "$ref": "#/components/schemas/Budget"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/InterventionAnnualDistribution"
        },
        "project": {
          "$ref": "#/components/schemas/Project"
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/InterventionDecision"
          }
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "streetName": {
          "type": "string",
          "description": "Suggested street name"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        },
        "designData": {
          "$ref": "#/components/schemas/DesignData"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea",
    "audit"
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/interventions/{id}

- Summary  
  Modifies a specific intervention based on the identifier.

- Description  
  Allows to modify a roadwork intervention based on the identifier. Returns the updated roadwork intervention.

- Security  
  BearerAuth

#### Headers

```ts
if-match?: integer
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "description": "a plain intervention feature write - for taxonomyCode read -"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "estimate": {
          "type": "number",
          "description": "the initial work estimate in dollars",
          "example": 100000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea"
  ]
}
```

#### Responses

- 200 OK

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched intervention feature"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "version": {
          "type": "integer"
        },
        "estimate": {
          "$ref": "#/components/schemas/Budget"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/InterventionAnnualDistribution"
        },
        "project": {
          "$ref": "#/components/schemas/Project"
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/InterventionDecision"
          }
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "streetName": {
          "type": "string",
          "description": "Suggested street name"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        },
        "designData": {
          "$ref": "#/components/schemas/DesignData"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea",
    "audit"
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/interventions/{id}

- Summary  
  Expires a specific intervention based on the identifier.

- Description  
  Allows to deactive/expire roadwork intervention based on the query parameters.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [PUT]/v1/interventions/{id}/annualDistribution

- Summary  
  Updates the intervention's annual distribution.

- Description  
  Allows to modify the metadata and the annual distribution attached to an intervention.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// the ventilation of the intervention within its related project
//
{
  distributionSummary: {
    // the interventionId
    //
    id?: string
    // calculated.
    //
    totalAllowance?: number
    // calculated. in km
    //
    totalLength?: number
    note?: string
  }
  annualPeriods: {
    // calulated. must range between [0, (project.endYear - project.startYear)] years starts at index 0
    //
    rank?: number
    year?: number
    annualAllowance?: number
    annualLength?: number
    // the account external reference number (PTI program)
    //
    accountId?: number
  }[]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched intervention feature"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "version": {
          "type": "integer"
        },
        "estimate": {
          "$ref": "#/components/schemas/Budget"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/InterventionAnnualDistribution"
        },
        "project": {
          "$ref": "#/components/schemas/Project"
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/InterventionDecision"
          }
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "streetName": {
          "type": "string",
          "description": "Suggested street name"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        },
        "designData": {
          "$ref": "#/components/schemas/DesignData"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea",
    "audit"
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/interventions/{id}/comments

- Summary  
  Creates a comment for an intervention based on the identifier.

- Description  
  Creates a comment for an intervention based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// input for comment
{
  // code of the taxonomy corresponding to the group comment
  categoryId: string
  // the body content of the comment
  text: string
  isPublic?: boolean
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
}
```

#### Responses

- 201 Successful

`application/json`

```ts
// the comments on the intervention
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/interventions/{id}/comments

- Summary  
  Lists all comments associated with an intervention based on the identifier.

- Description  
  Lists all comments associated with an intervention based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// the comments on the intervention
{
}
[];
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/interventions/{id}/comments/{idComment}

- Summary  
  Updates a comment for an intervention based on the identifiers.

- Description  
  Updates a comment for an intervention based on the identifiers.

- Security  
  BearerAuth

#### Responses

- 200 Modified comment

`application/json`

```ts
// the comments on the intervention
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/interventions/{id}/comments/{idComment}

- Summary  
  Deletes a comment for an intervention based on the identifiers.

- Description  
  Deletes a comment for an intervention based on the identifiers.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/interventions/{id}/decisions

- Summary  
  Attaches a decision to an intervention based on the identifier.

- Description  
  Allows to attach a decision on an intervention based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "description": "an enriched intervention feature"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "version": {
          "type": "integer"
        },
        "estimate": {
          "$ref": "#/components/schemas/Budget"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/InterventionAnnualDistribution"
        },
        "project": {
          "$ref": "#/components/schemas/Project"
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/InterventionDecision"
          }
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "streetName": {
          "type": "string",
          "description": "Suggested street name"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        },
        "designData": {
          "$ref": "#/components/schemas/DesignData"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea",
    "audit"
  ]
}
```

#### Responses

- 201 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/interventions/{id}/decisions

- Summary  
  Returns decisions of an intervention based on the identifier.

- Description  
  Allows to retrieve decisions of an intervention based on the identifier.

- Security  
  BearerAuth

#### Responses

- 200 Successful

`application/json`

```ts
// a decision attached to an intervention or project
{
  // The id of the object
  id?: string
  previousPlanificationYear?: integer
  // code of the taxonomy corresponding to the group intervention decision type
  typeId: string
  // project year and/or intervention year change
  targetYear?: integer
  // the body content of the rational
  text: string
  // code of the taxonomy corresponding to the group refusalReason
  refusalReasonId?: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/interventions/{id}/documents

- Summary  
  Attaches a document to an intervention based on the identifier.

- Description  
  Allows to upload a document to an intervention based on the identifier. Proxies the storage API.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- multipart/form-data

```ts
// the attached document and metadata
//
{
  // code of the taxonomy corresponding to the group document type (*'type de fichier' dans les maquettes)
  //
  type?: string
  file?: string
  documentName: string
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
  notes?: string
  // 1. a document attached by a requestor requires the validation of an AGIR planner 2. a document attached by a planner is automatically validated 3. the attachment of a document to a project is always performed by a planner,
  //    so the document is automatically validated on the POST /project/{id}/document
  //
  validationStatus?: string
}
```

#### Responses

- 201 Created

`application/json`

```ts
// the persisted attached documents
//
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/interventions/{id}/documents/{documentId}

- Summary  
  Downloads an intervention document based on the identifier.

- Description  
  Downloads an intervention document based on the identifier.

- Security  
  BearerAuth

#### Responses

- 200 The binary of the document.

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 503 undefined

---

### [PUT]/v1/interventions/{id}/documents/{documentId}

- Summary  
  Updates a document to an intervention based on the identifiers.

- Description  
  Allows to modify metadata and a document attached to an intervention based on the identifiers. Proxies the storage API.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- multipart/form-data

```ts
// the attached document and metadata
//
{
  // code of the taxonomy corresponding to the group document type (*'type de fichier' dans les maquettes)
  //
  type?: string
  file?: string
  documentName: string
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
  notes?: string
  // 1. a document attached by a requestor requires the validation of an AGIR planner 2. a document attached by a planner is automatically validated 3. the attachment of a document to a project is always performed by a planner,
  //    so the document is automatically validated on the POST /project/{id}/document
  //
  validationStatus?: string
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// the persisted attached documents
//
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/interventions/{id}/documents/{documentId}

- Summary  
  Deletes a specific document attached on a specific intervention based on the identifiers.

- Description  
  Allows to delete a document on an intervention based on the identifier.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/interventions/search

- Summary  
  Lists all active roadwork interventions.

- Description  
  Allows to filter all the existing interventions based on the search parameters.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
// The intervention search request.
{
  // The intervention ID to filter on.
  id?: #/components/schemas/StringOrStringArray
  // Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
  q?: string
  // The program book ID to filter on.
  programBookId?: #/components/schemas/UuidOrUuidArray
  // The program ID.
  programId?: #/components/schemas/StringOrStringArray
  // The intervention type ID.
  interventionTypeId?: #/components/schemas/StringOrStringArray
  // The work type ID.
  workTypeId?: #/components/schemas/StringOrStringArray
  // The requestor ID.
  requestorId?: #/components/schemas/StringOrStringArray
  // The borough ID.
  boroughId?: #/components/schemas/StringOrStringArray
  // The decision typeId.
  decisionTypeId?: #/components/schemas/StringOrStringArray
  // The intervention status.
  status?: #/components/schemas/StringOrStringArray
  // The intervention year to search.
  interventionYear?: integer
  // The intervention year to search from.
  fromInterventionYear?: integer
  // The intervention year to search to.
  toInterventionYear?: integer
  // The planification year to search.
  planificationYear?: integer
  // The planification year to search from.
  fromPlanificationYear?: integer
  // The planification year to search to.
  toPlanificationYear?: integer
  // The estimate to search.
  estimate?: integer
  // The estimate to search from.
  fromEstimate?: integer
  // The estimate to search to.
  toEstimate?: integer
  // The asset ID.
  assetId?: #/components/schemas/StringOrStringArray
  // The asset type ID.
  assetTypeId?: #/components/schemas/StringOrStringArray
  // The asset owner ID.
  assetOwnerId?: #/components/schemas/StringOrStringArray
  // The bbox for spatial search. A comma separated list of coordinates.
  interventionAreaBbox?: #/components/schemas/SearchBbox
  // The only possible value is 'null'. If null is specified, it will return interventions without projects.
  project?: string
  // The executor ID.
  executorId?: #/components/schemas/StringOrStringArray
  // The medal ID.
  medalId?: #/components/schemas/StringOrStringArray
  decisionRequired?: boolean
  // GeoJSon geometry object
  intersectGeometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// a paginated collection of interventions
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseIntervention &[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/interventions/countBy

- Summary  
  Gets a count of interventions.

- Description  
  Allows to get a filtered count of all interventions by a count key.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
countBy?: string
```

```ts
assetId?: string | string[]
```

```ts
assetOwnerId?: string | string[]
```

```ts
assetTypeId?: string | string[]
```

```ts
boroughId?: string | string[]
```

```ts
decisionTypeId?: string | string[]
```

```ts
estimate?: integer
```

```ts
fromEstimate?: number
```

```ts
toEstimate?: number
```

```ts
// Comma separated list of coordinates
interventionAreaBbox?: string
```

```ts
type?: string
```

```ts
interventionYear?: integer
```

```ts
fromInterventionYear?: integer
```

```ts
toInterventionYear?: integer
```

```ts
planificationYear?: integer
```

```ts
fromPlanificationYear?: integer
```

```ts
toPlanificationYear?: integer
```

```ts
programId?: string | string[]
```

```ts
project?: string
```

```ts
q?: string
```

```ts
requestorId?: string | string[]
```

```ts
status?: string
```

```ts
workTypeId?: string | string[]
```

```ts
decisionRequired?: boolean
```

```ts
executorId?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
undefined?: #/components/schemas/CountBy[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/interventions/countBy

- Summary  
  Gets a count of interventions.

- Description  
  Allows to get a filtered count of all interventions by a count key.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/InterventionSearchRequest"
    },
    {
      "description": "The intervention count by request object.",
      "properties": {
        "countBy": {
          "type": "string",
          "description": "The object key to count the interventions by.",
          "maxLength": 50
        }
      },
      "required": [
        "countBy"
      ]
    }
  ]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
undefined?: #/components/schemas/CountBy[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/interventions/extract

- Summary  
  Extracts in a CSV file all the existing interventions based on the search parameters.

- Description  
  Allows to extract in a CSV file all the existing interventions based on the search parameters.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// The intervention search request.
{
  // The planification year to search.
  planificationYear: integer
  // Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
  q?: string
  programId?: string[]
  interventionTypeId?: string[]
  workTypeId?: string[]
  requestorId?: string[]
  boroughId?: string[]
  decisionTypeId?: string[]
  status?: string[]
  // The estimate to search from.
  fromEstimate?: integer
  // The estimate to search to.
  toEstimate?: integer
  executorId?: string[]
  medalId?: string[]
  decisionRequired?: boolean
  assetTypeId?: string[]
  fields?: string[]
}
```

#### Responses

- 200 The binary of the CSV file.

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/programBooks

- Summary  
  Lists all program books.

- Description  
  Allows to retrieve a list of program books based on query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
projectLimit?: integer
```

```ts
projectOffset?: integer
```

```ts
id?: string | string[]
```

```ts
expand?: string[]
```

```ts
fields?: string | string[]
```

```ts
orderBy?: string
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Succesful

`application/json`

```ts
// a paginated collection of program books
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/PlainProgramBook &[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/programBooks/{id}

- Summary  
  Returns one specific program book.

- Description  
  Allows to retrieve one specific program book based on the identifier.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
expand?: string[]
```

```ts
projectLimit?: integer
```

```ts
projectOffset?: integer
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 OK

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "annualProgramId": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainProgramBook"
    },
    {
      "description": "The enriched program book",
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualProgram": {
          "$ref": "#/components/schemas/EnrichedAnnualProgram"
        },
        "objectives": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedObjective"
          }
        },
        "projects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjectsIds": {
          "type": "array",
          "description": "An array of removed projects ids for this book.",
          "items": {
            "type": "string"
          }
        },
        "priorityScenarios": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PriorityScenario"
          }
        },
        "isAutomaticLoadingInProgress": {
          "type": "boolean",
          "description": "Indicates whether an automatic loading is in progress or not."
        }
      },
      "required": [
        "id",
        "status",
        "annualProgramId",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/programBooks/{id}

- Summary  
  Updates one specific program book.

- Description  
  Allows to update one specific program book based on the identifier. Returns the updated program book.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### RequestBody

- application/json

```ts
// The plain version program book
{
  // The name of the program book
  name: string
  projectTypes?: string[]
  // The name of the person in charge of the program book. Free text field.
  inCharge?: string
  boroughIds?: string[]
  sharedRoles?: string[]
  // The status of the program book. Value from taxonomies.
  status?: string
  programTypes?: string[]
  // The description of the program book
  description?: string
}
```

#### Responses

- 200 OK

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "annualProgramId": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainProgramBook"
    },
    {
      "description": "The enriched program book",
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualProgram": {
          "$ref": "#/components/schemas/EnrichedAnnualProgram"
        },
        "objectives": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedObjective"
          }
        },
        "projects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjectsIds": {
          "type": "array",
          "description": "An array of removed projects ids for this book.",
          "items": {
            "type": "string"
          }
        },
        "priorityScenarios": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PriorityScenario"
          }
        },
        "isAutomaticLoadingInProgress": {
          "type": "boolean",
          "description": "Indicates whether an automatic loading is in progress or not."
        }
      },
      "required": [
        "id",
        "status",
        "annualProgramId",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/programBooks/{id}

- Summary  
  Deletes a program book.

- Description  
  Allows to delete a program book based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/programBooks/{id}/projects

- Summary  
  Retrieves a program book's projects.

- Description  
  Allows to retrieve the list of projects in a program book.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 OK

`application/json`

```ts
undefined?:  & #/components/schemas/BaseProject &[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/programBooks/{id}/projects

- Summary  
  Adds a project to the program book.

- Description  
  Allows to add a project to the program book. Validates if the project can be integrated and returns it.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  projectId: string;
}
```

#### Responses

- 200 OK

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/EnrichedProjectAnnualDistribution"
        },
        "contact": {
          "type": "string",
          "example": "Jean Girard"
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ProjectDecision"
          }
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "geometryPin": {
          "$ref": "#/components/schemas/Point"
        },
        "interventions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedIntervention"
          }
        },
        "length": {
          "$ref": "#/components/schemas/Length"
        },
        "medalId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "isOpportunityAnalysis": {
          "type": "boolean",
          "description": "There is at least one opportunity notice created"
        },
        "drmNumber": {
          "type": "string",
          "description": "The DRM number"
        },
        "submissionNumber": {
          "type": "string",
          "description": "The submission number"
        },
        "rtuExport": {
          "$ref": "#/components/schemas/RtuExport"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        }
      }
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/programBooks/{id}/load

- Summary  
  Loads automatically a program book.

- Description  
  Allows to load automatically a program book based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 202 Accepted

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [PUT]/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/priorityLevels

- Description  
  Allows to modify the prioritization levels and get the ordered project list.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  // priority rank. 1 is defined by the system
  //
  rank: number
  // priority level criteria
  //
  criteria: {
    projectCategory: {
      // category must have taxonomy code that belongs to the group projectCategory
      category: string
      // subCategory must have taxonomy code that belongs to the groupe projectSubCategory
      subCategory?: string
    }[]
    workTypeId?: string[]
    requestorId?: string[]
    assetTypeId?: string[]
    interventionType?: string[]
    servicePriorities: {
      // must have taxonomy code that belongs to the group service
      service: string
      // must have taxonomy code that belongs to the group priorityType
      priorityId: string
    }[]
  }
  // a sort criteria of a priority level
  sortCriterias: {
    // The name of the sort criteria
    name: string
    // service must be a taxonomy code that belongs to group service
    service?: string
    // The rank of the sort criteria
    rank: number
  }[]
}[]
```

#### Responses

- 200 OK

`application/json`

```ts
undefined?: #/components/schemas/PlainPriorityLevel &[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/calculations

- Description  
  Allows to get the updated ordered projects in a scenario. Allows sorting.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
orderBy?: string
```

#### Responses

- 200 OK

`application/json`

```ts
undefined?:  & #/components/schemas/PlainProgramBook &[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/orderedProjects

- Description  
  Allows to get the ordered projects in a scenario. Allows sorting.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
projectOrderBy?: string
```

```ts
projectLimit?: integer
```

```ts
projectOffset?: integer
```

#### Responses

- 200 Ok

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "annualProgramId": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainProgramBook"
    },
    {
      "description": "The enriched program book",
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualProgram": {
          "$ref": "#/components/schemas/EnrichedAnnualProgram"
        },
        "objectives": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedObjective"
          }
        },
        "projects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjectsIds": {
          "type": "array",
          "description": "An array of removed projects ids for this book.",
          "items": {
            "type": "string"
          }
        },
        "priorityScenarios": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PriorityScenario"
          }
        },
        "isAutomaticLoadingInProgress": {
          "type": "boolean",
          "description": "Indicates whether an automatic loading is in progress or not."
        }
      },
      "required": [
        "id",
        "status",
        "annualProgramId",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/orderedProjects/{projectId}/ranks

- Description  
  Allows to modify the rank of a project in the ordered project list.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  // new rank, must be 1 or higher
  //
  newRank?: number
  // manually ordered rank indicator
  //
  isManuallyOrdered?: boolean
  note?: string
}
```

#### Responses

- 201 Created

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "annualProgramId": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainProgramBook"
    },
    {
      "description": "The enriched program book",
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualProgram": {
          "$ref": "#/components/schemas/EnrichedAnnualProgram"
        },
        "objectives": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedObjective"
          }
        },
        "projects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjectsIds": {
          "type": "array",
          "description": "An array of removed projects ids for this book.",
          "items": {
            "type": "string"
          }
        },
        "priorityScenarios": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PriorityScenario"
          }
        },
        "isAutomaticLoadingInProgress": {
          "type": "boolean",
          "description": "Indicates whether an automatic loading is in progress or not."
        }
      },
      "required": [
        "id",
        "status",
        "annualProgramId",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/programBooks/{programBookId}/objectives

- Summary  
  Creates an objective for a program book based on the identifier.

- Description  
  Allows to create an objective for a program book based on the identifier. Returns the created objective.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/BaseObjective"
    },
    {
      "description": "The plain objective. Used to create or update objectives."
    },
    {
      "properties": {
        "referenceValue": {
          "type": "number",
          "description": "The reference value. This is the target value of the objective.",
          "minimum": 1,
          "example": 29
        }
      }
    }
  ],
  "required": [
    "referenceValue"
  ]
}
```

#### Responses

- 201 Created

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseObjective"
    },
    {
      "description": "The enriched objective. Contains the complete objective information."
    },
    {
      "properties": {
        "values": {
          "$ref": "#/components/schemas/ObjectiveValues"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "required": [
        "id",
        "values",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/programBooks/{programBookId}/objectives

- Summary  
  Retrieves all objectives associated with a program book based on the identifier.

- Description  
  Allows to retrieve all objectives associated with a program book based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Succesful

`application/json`

```ts
undefined?:  & #/components/schemas/BaseObjective &  &  &[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/programBooks/{programBookId}/objectives/{id}

- Summary  
  Updates an objective for a program book based on the identifiers.

- Description  
  Allows to update an objective for a program book based on the identifiers.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/BaseObjective"
    },
    {
      "description": "The plain objective. Used to create or update objectives."
    },
    {
      "properties": {
        "referenceValue": {
          "type": "number",
          "description": "The reference value. This is the target value of the objective.",
          "minimum": 1,
          "example": 29
        }
      }
    }
  ],
  "required": [
    "referenceValue"
  ]
}
```

#### Responses

- 200 Succesful

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseObjective"
    },
    {
      "description": "The enriched objective. Contains the complete objective information."
    },
    {
      "properties": {
        "values": {
          "$ref": "#/components/schemas/ObjectiveValues"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "required": [
        "id",
        "values",
        "audit"
      ]
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/programBooks/{programBookId}/objectives/{id}

- Summary  
  Deletes an objective for a program book based on the identifiers.

- Description  
  Allows to delete an objective for a program book based on the identifiers.

- Security  
  BearerAuth

#### Responses

- 204 No content

`application/json`

```ts
{
  "description": "No content"
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/projects

- Summary  
  Creates a project.

- Description  
  Allows to create a project for one or many interventions.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "description": "a plain project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "annualPeriods": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PlainProjectAnnualPeriod"
          }
        },
        "annualProjectDistributionSummary": {
          "$ref": "#/components/schemas/PlainProjectAnnualDistributionSummary"
        }
      }
    }
  ],
  "required": [
    "boroughId",
    "executorId",
    "startYear",
    "endYear"
  ]
}
```

#### Responses

- 201 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/EnrichedProjectAnnualDistribution"
        },
        "contact": {
          "type": "string",
          "example": "Jean Girard"
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ProjectDecision"
          }
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "geometryPin": {
          "$ref": "#/components/schemas/Point"
        },
        "interventions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedIntervention"
          }
        },
        "length": {
          "$ref": "#/components/schemas/Length"
        },
        "medalId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "isOpportunityAnalysis": {
          "type": "boolean",
          "description": "There is at least one opportunity notice created"
        },
        "drmNumber": {
          "type": "string",
          "description": "The DRM number"
        },
        "submissionNumber": {
          "type": "string",
          "description": "The submission number"
        },
        "rtuExport": {
          "$ref": "#/components/schemas/RtuExport"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        }
      }
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/projects

- Summary  
  Lists all active projects.

- Description  
  Allows to view/export a list of the active projects based on the query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
excludeProgramBookIds?: string | string[]
```

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
id?: string | string[]
```

```ts
// Comma separated list of coordinates
bbox?: string
```

```ts
boroughId?: string | string[]
```

```ts
budget?: number
```

```ts
fromBudget?: number
```

```ts
toBudget?: number
```

```ts
categoryId?: string | string[]
```

```ts
endYear?: integer
```

```ts
fromEndYear?: integer
```

```ts
toEndYear?: integer
```

```ts
executorId?: string | string[]
```

```ts
fromYear?: integer
```

```ts
inChargeId?: string | string[]
```

```ts
programBookId?: string | string[]
```

```ts
submissionNumber?: string | string[]
```

```ts
projectTypeId?: string | string[]
```

```ts
q?: string
```

```ts
startYear?: integer
```

```ts
fromStartYear?: integer
```

```ts
toStartYear?: integer
```

```ts
status?: string
```

```ts
subCategoryId?: string | string[]
```

```ts
medalId?: string | string[]
```

```ts
interventionProgramId?: string | string[]
```

```ts
expand?: string[]
```

```ts
fields?: string | string[]
```

```ts
isGeolocated?: boolean
```

```ts
interventionAssetTypeId?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// a paginated collection of enriched projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseProject &[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/projects/{id}

- Summary  
  Returns one specific active project based on the identifier.

- Description  
  Allows to view/export one specific active project based on the query parameters.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/EnrichedProjectAnnualDistribution"
        },
        "contact": {
          "type": "string",
          "example": "Jean Girard"
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ProjectDecision"
          }
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "geometryPin": {
          "$ref": "#/components/schemas/Point"
        },
        "interventions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedIntervention"
          }
        },
        "length": {
          "$ref": "#/components/schemas/Length"
        },
        "medalId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "isOpportunityAnalysis": {
          "type": "boolean",
          "description": "There is at least one opportunity notice created"
        },
        "drmNumber": {
          "type": "string",
          "description": "The DRM number"
        },
        "submissionNumber": {
          "type": "string",
          "description": "The submission number"
        },
        "rtuExport": {
          "$ref": "#/components/schemas/RtuExport"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        }
      }
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/projects/{id}

- Summary  
  Modifies one specific active project based on the identifier.

- Description  
  Allows to modify one specific active project by user changing status.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

```ts
if-match?: integer
```

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "description": "a plain project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "annualPeriods": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PlainProjectAnnualPeriod"
          }
        },
        "annualProjectDistributionSummary": {
          "$ref": "#/components/schemas/PlainProjectAnnualDistributionSummary"
        }
      }
    }
  ],
  "required": [
    "boroughId",
    "executorId",
    "startYear",
    "endYear"
  ]
}
```

#### Responses

- 200 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/projects/{id}/decisions

- Summary  
  Attaches a decision to an project, which change project status.

- Description  
  Allows to add decision on a project.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// a decision attached to an intervention or project
{
  // The id of the object
  id?: string
  // code of the taxonomy corresponding to the group project decision type
  typeId: string
  // project year and/or intervention year change
  startYear?: integer
  // project year and/or intervention year change
  endYear?: integer
  previousStartYear?: integer
  previousEndYear?: integer
  annualPeriodYear?: integer
  // the body content of the rational
  text: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

#### Responses

- 201 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/projects/{id}/decisions

- Summary  
  Returns the decisions of a project.

- Description  
  Allows to retrieve the decisions of a project.

#### Headers

```ts
accept?: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// a decision attached to an intervention or project
{
  // The id of the object
  id?: string
  // code of the taxonomy corresponding to the group project decision type
  typeId: string
  // project year and/or intervention year change
  startYear?: integer
  // project year and/or intervention year change
  endYear?: integer
  previousStartYear?: integer
  previousEndYear?: integer
  annualPeriodYear?: integer
  // the body content of the rational
  text: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/projects/{id}/documents

- Summary  
  Attaches a required document to a project based on the identifier.

- Description  
  Allows to upload a document to a project based on the identifier. Proxies the storage API.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- multipart/form-data

```ts
// the attached document and metadata
//
{
  // code of the taxonomy corresponding to the group document type (*'type de fichier' dans les maquettes)
  //
  type?: string
  file?: string
  documentName: string
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
  notes?: string
  // 1. a document attached by a requestor requires the validation of an AGIR planner 2. a document attached by a planner is automatically validated 3. the attachment of a document to a project is always performed by a planner,
  //    so the document is automatically validated on the POST /project/{id}/document
  //
  validationStatus?: string
}
```

#### Responses

- 201 Created

`application/json`

```ts
// the persisted attached documents
//
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/projects/{id}/documents/{documentId}

- Summary  
  Downloads a project document based on the identifier.

- Description  
  Downloads a project document based on the identifier.

- Security  
  BearerAuth

#### Responses

- 200 The binary of the document.

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 503 undefined

---

### [PUT]/v1/projects/{id}/documents/{documentId}

- Summary  
  Updates a document to a project based on the identifiers.

- Description  
  Allows to modify the metadata and a document attached to a project based on the identifiers. Proxies the storage API.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- multipart/form-data

```ts
// the attached document and metadata
//
{
  // code of the taxonomy corresponding to the group document type (*'type de fichier' dans les maquettes)
  //
  type?: string
  file?: string
  documentName: string
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
  notes?: string
  // 1. a document attached by a requestor requires the validation of an AGIR planner 2. a document attached by a planner is automatically validated 3. the attachment of a document to a project is always performed by a planner,
  //    so the document is automatically validated on the POST /project/{id}/document
  //
  validationStatus?: string
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// the persisted attached documents
//
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/projects/{id}/documents/{documentId}

- Summary  
  Deletes a specific document attached to a project based on the identifiers.

- Description  
  Allows to delete a document on a project based on the identifiers.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/projects/{id}/comments

- Summary  
  Creates a comment for a project based on the identifier.

- Description  
  Creates a comment for a project based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// input for comment
{
  // code of the taxonomy corresponding to the group comment
  categoryId: string
  // the body content of the comment
  text: string
  isPublic?: boolean
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
}
```

#### Responses

- 201 Successful

`application/json`

```ts
// the comments on the intervention
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/projects/{id}/comments

- Summary  
  Lists all comments associated with a project based on the identifier.

- Description  
  Lists all comments associated with a project based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// the comments on the intervention
{
}
[];
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/projects/{id}/comments/{idComment}

- Summary  
  Updates a comment for a project based on the identifiers.

- Description  
  Updates a comment for a project based on the identifiers.

- Security  
  BearerAuth

#### Responses

- 200 The updated comment

`application/json`

```ts
// the comments on the intervention
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/projects/{id}/comments/{idComment}

- Summary  
  Deletes a comment for a project based on the identifiers.

- Description  
  Deletes a comment for a project based on the identifiers.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [PUT]/v1/projects/{id}/annualDistribution

- Summary  
  Updates the project's annual distribution.

- Description  
  Allows to modify the metadata and the annual distribution attached to a project.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  annualProjectDistributionSummary: {
    additionalCostsNotes: {
      // taxonomy code corresponding to the group additionalCost
      //
      type?: string
      // calculated. the sum of that type of additional costs throughout the project
      //
      amount?: number
      note?: string
    }[]
    totalAnnualBudgetNote?: string
  }
  annualPeriods: {
    additionalCosts: {
      // taxonomy code corresponding to the group additionalCost
      //
      type: string
      amount: number
      // the external account reference (PTI program) of the additionnal costs
      //
      accountId?: number
    }[]
    annualPeriodInterventions: {
      interventionId?: string
      year?: number
      annualAllowance?: number
      accountId?: number
    }[]
    // input for a non-geolocated project.
    //
    annualAllowance?: number
    // the account external reference number (PTI program) for a non-geolocalized project
    //
    accountId?: number
    // calculated. the year of the annual period. allows searches and validations
    //
    year?: number
  }[]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/EnrichedProjectAnnualDistribution"
        },
        "contact": {
          "type": "string",
          "example": "Jean Girard"
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ProjectDecision"
          }
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "geometryPin": {
          "$ref": "#/components/schemas/Point"
        },
        "interventions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedIntervention"
          }
        },
        "length": {
          "$ref": "#/components/schemas/Length"
        },
        "medalId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "isOpportunityAnalysis": {
          "type": "boolean",
          "description": "There is at least one opportunity notice created"
        },
        "drmNumber": {
          "type": "string",
          "description": "The DRM number"
        },
        "submissionNumber": {
          "type": "string",
          "description": "The submission number"
        },
        "rtuExport": {
          "$ref": "#/components/schemas/RtuExport"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        }
      }
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/projects/search

- Summary  
  Lists all active projects.

- Description  
  Allows to filter all the existing projects.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/ProjectSearchRequest"
    },
    {
      "properties": {
        "limit": {
          "type": "integer",
          "description": "The number of items to return",
          "minimum": 1,
          "maximum": 100000,
          "default": 20
        },
        "offset": {
          "type": "integer",
          "description": "The result offset for pagination.",
          "minimum": 0
        },
        "expand": {
          "description": "The expand parameters for more information to be brought back.",
          "oneOf": [
            {
              "type": "string",
              "maxLength": 250
            },
            {
              "type": "array",
              "items": {
                "type": "string",
                "maxLength": 250
              }
            }
          ]
        },
        "fields": {
          "description": "Comma separated list or array of strings of fields/attributes to return",
          "oneOf": [
            {
              "type": "string",
              "maxLength": 250
            },
            {
              "type": "array",
              "items": {
                "type": "string",
                "maxLength": 250
              }
            }
          ]
        },
        "orderBy": {
          "type": "string",
          "description": "Sort results, for example:\n-estimate,priority\n",
          "maxLength": 250
        },
        "isGeolocated": {
          "description": "Boolean whether the request should only return non-geolocated projects",
          "type": "boolean",
          "default": true
        }
      }
    }
  ]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// a paginated collection of enriched projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseProject &[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/projects/countBy

- Summary  
  Gets a count of projects.

- Description  
  Allows to get a filtered count of all projects by a count key.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
excludeProgramBookIds?: string | string[]
```

```ts
countBy?: string
```

```ts
// Comma separated list of coordinates
bbox?: string
```

```ts
boroughId?: string | string[]
```

```ts
budget?: number
```

```ts
fromBudget?: number
```

```ts
toBudget?: number
```

```ts
categoryId?: string | string[]
```

```ts
endYear?: integer
```

```ts
fromEndYear?: integer
```

```ts
toEndYear?: integer
```

```ts
executorId?: string | string[]
```

```ts
fromYear?: integer
```

```ts
inChargeId?: string | string[]
```

```ts
programBookId?: string | string[]
```

```ts
submissionNumber?: string | string[]
```

```ts
projectTypeId?: string | string[]
```

```ts
q?: string
```

```ts
startYear?: integer
```

```ts
fromStartYear?: integer
```

```ts
toStartYear?: integer
```

```ts
status?: string
```

```ts
subCategoryId?: string | string[]
```

```ts
interventionProgramId?: string | string[]
```

```ts
isGeolocated?: boolean
```

```ts
interventionAssetTypeId?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
undefined?: #/components/schemas/CountBy[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/projects/countBy

- Summary  
  Gets a count of projects.

- Description  
  Allows to get a filtered count of all projects by a count key.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/ProjectSearchRequest"
    },
    {
      "description": "The project count by request object.",
      "properties": {
        "countBy": {
          "type": "string",
          "description": "The object key to count the projects by.",
          "maxLength": 50
        }
      },
      "required": [
        "countBy"
      ]
    }
  ]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
undefined?: #/components/schemas/CountBy[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/projects/generateDrmNumber

- Summary  
  Generates a common DRM number or different DRM numbers for the provided projects.

- Description  
  Allows to generate a common DRM number or different DRM numbers for the provided projects.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  projectIds?: string[]
  isCommonDrmNumber: boolean
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  projectId: string;
  drmNumber: string;
}
[];
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/projects/drmNumber

- Summary  
  Deletes the DRM number for the provided projects.

- Description  
  Allows to delete the DRM number for the provided projects.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
id?: string | string[]
```

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/projects/extract

- Summary  
  Extracts in an CSV file all the existing projects based on the search parameters.

- Description  
  Allows to extract in an CSV file all the existing projects based on the search parameters.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// The project search request object sent as a parameter.
{
  // Search criteria used for the project ID, project's name, project's DRM number and project's submission number. Checks if it contains the search criteria.
  q?: string
  interventionAssetTypeId?: string[]
  // The id of the object
  programBookId?: string[]
  projectTypeId?: string[]
  executorId?: string[]
  categoryId?: string[]
  subCategoryId?: string[]
  boroughId?: string[]
  status?: string[]
  // The year to search.
  year: integer
  // The budget to search from.
  fromBudget?: integer
  // The budget to search to.
  toBudget?: integer
  workTypeId?: string[]
  medalId?: string[]
  interventionProgramId?: string[]
  submissionNumber?: string[]
  // Boolean whether the request should only return geolocated or non-geolocated projects.
  isGeolocated?: boolean
  fields?: string[]
}
```

#### Responses

- 200 The binary of the CSV file.

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/search/work-area

- Summary  
  Returns all surface areas combined in a geometry.

- Description  
  Allows to find and combine all areas (intersections+pavements) that we can find inside a geometry.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
[];
```

#### RequestBody

- application/json

```ts
// GeoJSon geometry object
{
  // The type of the feature's geometry
  type: string
  coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// GeoJSon geometry object
{
  // The type of the feature's geometry
  type: string
  coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/search/assets/work-area

- Summary  
  Returns the specific assets and all the surface areas combined in a geometry.

- Description  
  Allows to return the assets information based on the identifiers and the asset type provided, ans all the surface areas combined in a geometry.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
// The assets search criterias.
{
  assets: {
    // The asset ID.
    id: string
    // The asset type. Must be a taxonomy code that belongs to group assetType.
    type: string
  }[]
  expand?: string[]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// The assets and the combined surface areas geometry.
{
  // #/components/schemas/AssetList
  assets: {
    // The external reference id of the object
    id?: string
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    typeId: string
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    ownerId: string
    length: {
      value?: number
      unit?: string
    }
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
    // Asset Diameter
    diameter?: string
    // Asset material
    material?: string
    // Suggested street name
    suggestedStreetName?: string
    // external resources
    roadSections?: #/components/schemas/FeatureCollection
    // external resouces
    workArea?: #/components/schemas/Feature
    // an external intervention or project reference
    externalReferenceIds: {
      // code de taxonomie appartenant au groupe GROUPE_TAXO
      type: string
      // the external id value
      value: string
    }[]
    assetDesignData: {
      // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
      upstreamAssetType?: string
      // ID of the upstream asset.
      upstreamAssetId?: string
      // Depth of the upstream asset.
      upstreamDepth?: string
      // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
      downstreamAssetType?: string
      // ID of the downstream asset.
      downstreamAssetId?: string
      // Depth of the downstream asset.
      downstreamDepth?: string
      // Number of connections.
      numberOfConnections?: integer
      // Deformation of the asset.
      deformation?: integer
      // Allows to identify the presence of infiltration.
      hasInfiltration?: boolean
      // Description of the infiltration.
      infiltrationChaining?: string
      // ID of the asset from which the infiltration starts.
      infiltrationAssetId?: string
      // Allows to identify the presence of an obstruction.
      hasObstruction?: boolean
      // Description of the obstruction.
      obstructionChaining?: string
      // ID of the asset from which the obstruction starts.
      obstructionAssetId?: string
      comment?: string
      // Audit fields following vdm standard
      audit: {
        // a date used a timestamp, start and end dates
        createdAt?: string
        createdBy: {
          userName: string
          displayName: string
        }
        lastModifiedAt:#/components/schemas/Date
        lastModifiedBy:#/components/schemas/Author
        expiredAt:#/components/schemas/Date
        expiredBy:#/components/schemas/Author
      }
    }
  }[]
  // GeoJSon Feature
  workArea: {
    type: string
    id?: string | number
    geometry:#/components/schemas/Geometry
  }
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/taxonomies

- Summary  
  Recovers all the taxonomies object.

- Description  
  Allows to retrieve all the taxonomies objects.

- Security  
  BearerAuth

#### Headers

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// A paginated collection of taxonomies
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  // the taxonomy object
  items: {
    // The id of the object
    id?: string
    group: string
    code: string
    label: {
      fr?: string
      en?: string
    }
    description:#/components/schemas/LocalizedText
    isActive?: boolean
    displayOrder?: number
    valueString1?: string
    valueString2?: string
    valueBoolean1?: boolean
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/taxonomies

- Summary  
  Creates a taxonomy.

- Description  
  Allows to create a taxonomy object.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// the taxonomy object
{
  // The id of the object
  id?: string
  group: string
  code: string
  label: {
    fr?: string
    en?: string
  }
  description:#/components/schemas/LocalizedText
  isActive?: boolean
  displayOrder?: number
  valueString1?: string
  valueString2?: string
  valueBoolean1?: boolean
}
```

#### Responses

- 201 Created

`application/json`

```ts
// the taxonomy object
{
  // The id of the object
  id?: string
  group: string
  code: string
  label: {
    fr?: string
    en?: string
  }
  description:#/components/schemas/LocalizedText
  isActive?: boolean
  displayOrder?: number
  valueString1?: string
  valueString2?: string
  valueBoolean1?: boolean
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/taxonomies/{group}

- Summary  
  Recovers all the taxonomies objects for a specific group.

- Description  
  Allows to retrieve all the taxonomies objects for a specific group.

- Security  
  BearerAuth

#### Headers

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// A paginated collection of taxonomies
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  // the taxonomy object
  items: {
    // The id of the object
    id?: string
    group: string
    code: string
    label: {
      fr?: string
      en?: string
    }
    description:#/components/schemas/LocalizedText
    isActive?: boolean
    displayOrder?: number
    valueString1?: string
    valueString2?: string
    valueBoolean1?: boolean
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/taxonomies/{group}/{code}

- Summary  
  Modifies one specific taxonomy object.

- Description  
  Allows to modify one specific taxonomy object based on the identifiers.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

```ts
if-match?: integer
```

#### RequestBody

- application/json

```ts
// the taxonomy object
{
  // The id of the object
  id?: string
  group: string
  code: string
  label: {
    fr?: string
    en?: string
  }
  description:#/components/schemas/LocalizedText
  isActive?: boolean
  displayOrder?: number
  valueString1?: string
  valueString2?: string
  valueBoolean1?: boolean
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// the taxonomy object
{
  // The id of the object
  id?: string
  group: string
  code: string
  label: {
    fr?: string
    en?: string
  }
  description:#/components/schemas/LocalizedText
  isActive?: boolean
  displayOrder?: number
  valueString1?: string
  valueString2?: string
  valueBoolean1?: boolean
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [DELETE]/v1/taxonomies/{group}/{code}

- Summary  
  Deletes one taxonomy object.

- Description  
  Allows to delete a taxonomy object.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/assets/{assetType}/{assetId}

- Summary  
  Returns one specific asset.

- Description  
  Allows to retrieve the asset information based on the identifier and the asset type.

#### Parameters(Query)

```ts
expand?: string[]
```

#### Headers

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  // The external reference id of the object
  id?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  typeId: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  ownerId: string
  length: {
    value?: number
    unit?: string
  }
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // Asset Diameter
  diameter?: string
  // Asset material
  material?: string
  // Suggested street name
  suggestedStreetName?: string
  // external resources
  roadSections?: #/components/schemas/FeatureCollection
  // external resouces
  workArea?: #/components/schemas/Feature
  // an external intervention or project reference
  externalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  assetDesignData: {
    // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
    upstreamAssetType?: string
    // ID of the upstream asset.
    upstreamAssetId?: string
    // Depth of the upstream asset.
    upstreamDepth?: string
    // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
    downstreamAssetType?: string
    // ID of the downstream asset.
    downstreamAssetId?: string
    // Depth of the downstream asset.
    downstreamDepth?: string
    // Number of connections.
    numberOfConnections?: integer
    // Deformation of the asset.
    deformation?: integer
    // Allows to identify the presence of infiltration.
    hasInfiltration?: boolean
    // Description of the infiltration.
    infiltrationChaining?: string
    // ID of the asset from which the infiltration starts.
    infiltrationAssetId?: string
    // Allows to identify the presence of an obstruction.
    hasObstruction?: boolean
    // Description of the obstruction.
    obstructionChaining?: string
    // ID of the asset from which the obstruction starts.
    obstructionAssetId?: string
    comment?: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/assets/search

- Summary  
  Returns all assets that fall within the specified criteria.

- Description  
  Allows to retrieve all the existing assets that fall within the requested geometry.

- Security  
  BearerAuth

#### Headers

```ts
Accept-Language: string
```

#### RequestBody

- application/json

```ts
// Describes asset search parameters
{
  assetTypes?: string[]
  advancedIntersect?: boolean
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // Search criteria used for the asset ID
  id?: string
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  // The external reference id of the object
  id?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  typeId: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  ownerId: string
  length: {
    value?: number
    unit?: string
  }
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // Asset Diameter
  diameter?: string
  // Asset material
  material?: string
  // Suggested street name
  suggestedStreetName?: string
  // external resources
  roadSections?: #/components/schemas/FeatureCollection
  // external resouces
  workArea?: #/components/schemas/Feature
  // an external intervention or project reference
  externalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  assetDesignData: {
    // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
    upstreamAssetType?: string
    // ID of the upstream asset.
    upstreamAssetId?: string
    // Depth of the upstream asset.
    upstreamDepth?: string
    // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
    downstreamAssetType?: string
    // ID of the downstream asset.
    downstreamAssetId?: string
    // Depth of the downstream asset.
    downstreamDepth?: string
    // Number of connections.
    numberOfConnections?: integer
    // Deformation of the asset.
    deformation?: integer
    // Allows to identify the presence of infiltration.
    hasInfiltration?: boolean
    // Description of the infiltration.
    infiltrationChaining?: string
    // ID of the asset from which the infiltration starts.
    infiltrationAssetId?: string
    // Allows to identify the presence of an obstruction.
    hasObstruction?: boolean
    // Description of the obstruction.
    obstructionChaining?: string
    // ID of the asset from which the obstruction starts.
    obstructionAssetId?: string
    comment?: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }
}[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/assets/search/lastIntervention

- Summary  
  Retrieves the last intervention for each asset provided.

- Description  
  Allows to retrieve the last intervention for each asset provided based on the search parameters.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  assetIds?: string[]
  // an external intervention or project reference
  assetExternalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  planificationYear: integer
}
```

#### Responses

- 200 Succesful

`application/json`

```ts
{
  assetId?: string
  // an external intervention or project reference
  assetExternalReferenceId: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }
  intervention: {
    id: string
    planificationYear: integer
  }
}[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/import/internal/projects

- Summary  
  Imports a project from internal data source.

- Description  
  Imports BIC projects to create a single AGIR project and deletes the old one if it already exists.

- Security  
  BearerAuth

#### RequestBody

- application/json

```ts
{
  // project imported by BIC
  bicProjects: {
    ANNEE_ACTUELLE?: string
    ANNEE_DEBUT: string
    ANNEE_FIN: string
    ANNEE_PROGRAMATION: number
    ANNEE_REVISEE?: number
    ARRONDISSEMENT_AGIR: string
    CATEGORIE_PROJET?: string
    CLASSIFICATION?: string
    COMMENTAIRES_DI_BIC?: string
    COMMENTAIRE_INTERVENTION?: string
    COMMENTAIRE_PROJET?: string
    COTE_GLOBALE?: number
    COTE_PRIORITE_GLOBAL?: number
    DESC_TYPE_TRAVAUX_TRC?: string
    DIVISION_REQUERANT_INITIAL?: string
    ESTIMATION_REQUERANT?: string | number
    ESTIMATION_BUDG_GLOBAL?: string
    ETAT_PROJET?: string
    EXECUTANT_AGIR: string
    ID_ARRONDISSEMENT?: number
    ID_EXECUTANT?: string
    ID_PROJET?: string | number
    ID_TYPE_TRAVAUX_TRC?: string | number
    LONGUEUR_GLOBAL?: number
    LONGUEUR_INTERV_REQUERANT?: number
    MEDAILLE_AMENAGEMENT?: string
    NO_PROJET?: string
    NO_REFERENCE_REQ?: string
    NOM_ARRONDISSEMENT?: string
    NOM_VOIE?: string
    PROGRAMME?: string
    PROJET_REQUERANT?: string
    PROPRIETAIRE_ACTIF?: string
    PRIORITE_REQ_AGIR?: string
    REQUERANT_AGIR: string
    REQUERANT_INITIAL?: string
    RISQUE_AUTRE_COMMENT?: string
    RISQUE_ENFOUISS_COMMENT?: string
    RISQUE_ACQUIS_TERRAIN?: string
    RISQUE_ENTENTE?: string
    COMMENTAIRE_ARRONDISSEMENT?: string
    COMMENTAIRE_MTQ_INFO_RTU?: string
    STATUT_INTERVENTION?: string
    STATUT_PROJET: string
    STATUT_SUIVI?: string
    TITRE_PROJET?: string
    TYPE_ACTIF_AGIR?: string
    TYPE_INTERVENTION?: string
    TYPE_PROJET?: string
    TYPE_RESEAU?: string
    TYPE_TRAVAUX_AGIR?: string
    VOIE_A?: string
    VOIE_DE?: string
    PROJET_NOM_VOIE?: string
    PROJET_VOIE_A?: string
    PROJET_VOIE_DE?: string
    PROJET_COMMENTAIRE_INFO?: string
    PROJET_COMMENTAIRE_REQ?: string
    PROJET_COMMENTAIRE_HISTO?: string
    PROJET_EXIGENCE?: string
    PROJET_CONTRAINTE?: string
    BUDGET_ANNEE_1?: number
    BUDGET_ANNEE_2?: number
    BUDGET_ANNEE_3?: number
    NO_SOUMISSION?: string
  }[]
  // GeoJSon Feature
  features: {
    type: string
    id?: string | number
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
  }[]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "description": "an enriched project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/EnrichedProjectAnnualDistribution"
        },
        "contact": {
          "type": "string",
          "example": "Jean Girard"
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ProjectDecision"
          }
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "geometryPin": {
          "$ref": "#/components/schemas/Point"
        },
        "interventions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedIntervention"
          }
        },
        "length": {
          "$ref": "#/components/schemas/Length"
        },
        "medalId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "isOpportunityAnalysis": {
          "type": "boolean",
          "description": "There is at least one opportunity notice created"
        },
        "drmNumber": {
          "type": "string",
          "description": "The DRM number"
        },
        "submissionNumber": {
          "type": "string",
          "description": "The submission number"
        },
        "rtuExport": {
          "$ref": "#/components/schemas/RtuExport"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        }
      }
    }
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/import/bicImportLogs

- Summary  
  Creates a BIC import log.

- Description  
  Allows to create a BIC import log.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 201 Created

`application/json`

```ts
{
  // The id of the object
  id: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/import/bicImportLogs

- Summary  
  Lists all the BIC import logs.

- Description  
  Allows to view a list of the BIC import logs based on the query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Succesful

`application/json`

```ts
// a paginated collection of import logs
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    // The id of the object
    id: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/me

- Summary  
  Gets the current user.

- Description  
  Retrieves the current user information based on the provided authorization header.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful - returns the full response body of Keycloak.

`application/json`

```ts
// The user
{
  accessToken: string
  iss: string
  exp: number
  iat: number
  keyId: number
  displayName: string
  aud: string
  name: string
  sub: string
  inum: string
  email: string
  userName: string
  givenName: string
  familyName: string
  userType: string
  mtlIdentityId?: string
  privileges: {
    domain: string
    application: string
    role: string
    permissions?: string[]
    // A set of description
    restrictions: {
    }
  }[]
}
```

- 400 Invalid request

- 401 Unauthorized

- 403 Forbidden access

- 405 Invalid input

- 503 Unavailable

---

### [GET]/v1/me/preferences

#### Responses

- 200 Succesful

`application/json`

```ts
{
  // The unique key of the user's preference
  key: string
  // Username
  userId: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/me/preferences/{key}

#### RequestBody

- application/json

```ts
{
}
```

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [DELETE]/v1/me/preferences/{key}

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/nexoImports/file

- Summary  
  Uploads the first file of a NEXO import and instantiates a NEXO import.

- Description  
  Allows to upload the first file of a NEXO import and instantiates a NEXO import.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- multipart/form-data

```ts
// a NEXO import file
{
  file: string;
  // must be a taxonomy code that belongs to group nexoFileType
  fileType: string;
}
```

#### Responses

- 201 Created

`application/json`

```ts
// a NEXO import log
{
  // The id of the object
  id: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // must be a taxonomy code that belongs to group nexoImportStatus
  status: string
  // a NEXO import file
  files: {
    id: string
    name: string
    contentType: string
    // must be a taxonomy code that belongs to group nexoFileType
    type: string
    // must be a taxonomy code that belongs to group nexoImportStatus
    status: string
    numberOfItems?: integer
    errorDescription?: string
    projects: {
      id: string
      // must be a taxonomy code that belongs to group nexoImportStatus
      importStatus: string
      // must be a taxonomy code that belongs to group modificationType
      modificationType?: string
      description?: string
    }[]
    interventions?:  & #/components/schemas/NexoLogProject[]
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 409 undefined

- 503 undefined

---

### [POST]/v1/nexoImports/{id}/import

- Summary  
  Starts a NEXO import.

- Description  
  Allows to start a NEXO import based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 202 Accepted

`application/json`

```ts
// a NEXO import log
{
  // The id of the object
  id: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // must be a taxonomy code that belongs to group nexoImportStatus
  status: string
  // a NEXO import file
  files: {
    id: string
    name: string
    contentType: string
    // must be a taxonomy code that belongs to group nexoFileType
    type: string
    // must be a taxonomy code that belongs to group nexoImportStatus
    status: string
    numberOfItems?: integer
    errorDescription?: string
    projects: {
      id: string
      // must be a taxonomy code that belongs to group nexoImportStatus
      importStatus: string
      // must be a taxonomy code that belongs to group modificationType
      modificationType?: string
      description?: string
    }[]
    interventions?:  & #/components/schemas/NexoLogProject[]
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 409 undefined

- 503 undefined

---

### [GET]/v1/nexoImports

- Summary  
  Lists all NEXO imports.

- Description  
  Allows to list NEXO imports based on query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
status?: string
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Succesful

`application/json`

```ts
// A paginated collection of NEXO imports
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  // a NEXO import log
  items: {
    // The id of the object
    id: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
    // must be a taxonomy code that belongs to group nexoImportStatus
    status: string
    // a NEXO import file
    files: {
      id: string
      name: string
      contentType: string
      // must be a taxonomy code that belongs to group nexoFileType
      type: string
      // must be a taxonomy code that belongs to group nexoImportStatus
      status: string
      numberOfItems?: integer
      errorDescription?: string
      projects: {
        id: string
        // must be a taxonomy code that belongs to group nexoImportStatus
        importStatus: string
        // must be a taxonomy code that belongs to group modificationType
        modificationType?: string
        description?: string
      }[]
      interventions?:  & #/components/schemas/NexoLogProject[]
    }[]
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/nexoImports/{id}

- Summary  
  Retrieves a NEXO import.

- Description  
  Allows to retrieve a NEXO import based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// a NEXO import log
{
  // The id of the object
  id: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // must be a taxonomy code that belongs to group nexoImportStatus
  status: string
  // a NEXO import file
  files: {
    id: string
    name: string
    contentType: string
    // must be a taxonomy code that belongs to group nexoFileType
    type: string
    // must be a taxonomy code that belongs to group nexoImportStatus
    status: string
    numberOfItems?: integer
    errorDescription?: string
    projects: {
      id: string
      // must be a taxonomy code that belongs to group nexoImportStatus
      importStatus: string
      // must be a taxonomy code that belongs to group modificationType
      modificationType?: string
      description?: string
    }[]
    interventions?:  & #/components/schemas/NexoLogProject[]
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/nexoImports/{id}/file

- Summary  
  Uploads an additional file for a NEXO import.

- Description  
  Allows to upload an additional file for a NEXO import based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- multipart/form-data

```ts
// a NEXO import file
{
  file: string;
  // must be a taxonomy code that belongs to group nexoFileType
  fileType: string;
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// a NEXO import log
{
  // The id of the object
  id: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // must be a taxonomy code that belongs to group nexoImportStatus
  status: string
  // a NEXO import file
  files: {
    id: string
    name: string
    contentType: string
    // must be a taxonomy code that belongs to group nexoFileType
    type: string
    // must be a taxonomy code that belongs to group nexoImportStatus
    status: string
    numberOfItems?: integer
    errorDescription?: string
    projects: {
      id: string
      // must be a taxonomy code that belongs to group nexoImportStatus
      importStatus: string
      // must be a taxonomy code that belongs to group modificationType
      modificationType?: string
      description?: string
    }[]
    interventions?:  & #/components/schemas/NexoLogProject[]
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 409 undefined

- 503 undefined

---

### [GET]/v1/nexoImports/{id}/file/{fileId}

- Summary  
  Retrieves a NEXO import file.

- Description  
  Allows to retrieve a specific NEXO import file based on the identifiers.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`multipart/form-data`

```ts
// a NEXO import file
{
  file: string;
  // must be a taxonomy code that belongs to group nexoFileType
  fileType: string;
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/import/rtu/projects

- Summary  
  Starts an Info-RTU import.

- Description  
  Allows to start an Info-RTU import.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 202 Accepted

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/rtuProjects

- Summary  
  Retrieves all RTU projects.

- Description  
  Allows to retrieve all RTU projects based on the query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
id?: string | string[]
```

```ts
// Comma separated list of coordinates
bbox?: string
```

```ts
areaId?: string | string[]
```

```ts
partnerId?: string | string[]
```

```ts
status?: string | string[]
```

```ts
phase?: string | string[]
```

```ts
// a date used a timestamp, start and end dates
fromDateStart?: string
```

```ts
// a date used a timestamp, start and end dates
toDateStart?: string
```

```ts
// a date used a timestamp, start and end dates
fromDateEnd?: string
```

```ts
// a date used a timestamp, start and end dates
toDateEnd?: string
```

```ts
fields?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// a paginated collection of RTU projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    id: string
    name: string
    description?: string
    areaId: string
    partnerId: string
    noReference: string
    geometryPin:#/components/schemas/Point3D
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
    status: string
    type: string
    phase: string
    // a date used a timestamp, start and end dates
    dateStart: string
    dateEnd:#/components/schemas/Date
    dateEntry:#/components/schemas/Date
    dateModification:#/components/schemas/Date
    cancellationReason?: string
    productionPb?: string
    conflict?: string
    duration?: string
    localization?: string
    streetName?: string
    streetFron?: string
    streetTo?: string
    contact: {
      id: string
      officeId: string
      num: string
      prefix: string
      name: string
      email: string
      phone: string
      title?: string
      phoneExtensionNumber?: string
      cell?: string
      fax?: string
      typeNotfc?: string
      paget?: string
      profile?: string
      globalRole?: string
      idInterim?: string
      inAutoNotification?: string
      inDiffusion?: string
      areaName?: string
      role?: string
      partnerType?: string
      partnerId?: string
    }
    // Audit fields following vdm standard
    audit: {
      createdAt:#/components/schemas/Date
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/rtuProjects/{id}

- Summary  
  Returns one specific RTU project based on the identifier.

- Description  
  Allows to retrieve one specific RTU project based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  id: string
  name: string
  description?: string
  areaId: string
  partnerId: string
  noReference: string
  geometryPin:#/components/schemas/Point3D
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  status: string
  type: string
  phase: string
  // a date used a timestamp, start and end dates
  dateStart: string
  dateEnd:#/components/schemas/Date
  dateEntry:#/components/schemas/Date
  dateModification:#/components/schemas/Date
  cancellationReason?: string
  productionPb?: string
  conflict?: string
  duration?: string
  localization?: string
  streetName?: string
  streetFron?: string
  streetTo?: string
  contact: {
    id: string
    officeId: string
    num: string
    prefix: string
    name: string
    email: string
    phone: string
    title?: string
    phoneExtensionNumber?: string
    cell?: string
    fax?: string
    typeNotfc?: string
    paget?: string
    profile?: string
    globalRole?: string
    idInterim?: string
    inAutoNotification?: string
    inDiffusion?: string
    areaName?: string
    role?: string
    partnerType?: string
    partnerId?: string
  }
  // Audit fields following vdm standard
  audit: {
    createdAt:#/components/schemas/Date
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/rtuProjects/countBy

- Summary  
  Gets a count of RTU projects.

- Description  
  Allows to get a filtered count of all RTU projects by a count key.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
countBy?: string
```

```ts
areaId?: string | string[]
```

```ts
partnerId?: string | string[]
```

```ts
status?: string | string[]
```

```ts
phase?: string | string[]
```

```ts
// a date used a timestamp, start and end dates
fromDateStart?: string
```

```ts
// a date used a timestamp, start and end dates
toDateStart?: string
```

```ts
// a date used a timestamp, start and end dates
fromDateEnd?: string
```

```ts
// a date used a timestamp, start and end dates
toDateEnd?: string
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Succesful

`application/json`

```ts
// The count of items based on a key.
{
  id?:  &
  // The number of items
  count?: number
}[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/rtuProjects/search

- Summary  
  Retrieves all RTU projects.

- Description  
  Allows to retrieve all RTU projects based on the search criterias.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// The RTU project search request.
{
  // The bbox for spatial search. A comma separated list of coordinates.
  bbox?: string
  // The area ID.
  areaId?: #/components/schemas/StringOrStringArray
  // The partner ID.
  partnerId?: #/components/schemas/StringOrStringArray
  // The status.
  status?: #/components/schemas/StringOrStringArray
  // The phase.
  phase?: #/components/schemas/StringOrStringArray
  // Lower bound of the start date of the project.
  fromDateStart?: #/components/schemas/Date
  // Upper bound of the start date of the project.
  toDateStart?: #/components/schemas/Date
  // Lower bound of the end date of the project.
  fromDateEnd?: #/components/schemas/Date
  // Upper bound of the end date of the project.
  toDateEnd?: #/components/schemas/Date
  // GeoJSon geometry object
  intersectGeometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // The number of items to return.
  limit?: integer
  // The result offset for pagination.
  offset?: integer
  // Sort results.
  orderBy?: string
  // Comma separated list or array of strings of fields/attributes to return.
  fields?: string | string[]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// a paginated collection of RTU projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    id: string
    name: string
    description?: string
    areaId: string
    partnerId: string
    noReference: string
    geometryPin:#/components/schemas/Point3D
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
    status: string
    type: string
    phase: string
    // a date used a timestamp, start and end dates
    dateStart: string
    dateEnd:#/components/schemas/Date
    dateEntry:#/components/schemas/Date
    dateModification:#/components/schemas/Date
    cancellationReason?: string
    productionPb?: string
    conflict?: string
    duration?: string
    localization?: string
    streetName?: string
    streetFron?: string
    streetTo?: string
    contact: {
      id: string
      officeId: string
      num: string
      prefix: string
      name: string
      email: string
      phone: string
      title?: string
      phoneExtensionNumber?: string
      cell?: string
      fax?: string
      typeNotfc?: string
      paget?: string
      profile?: string
      globalRole?: string
      idInterim?: string
      inAutoNotification?: string
      inDiffusion?: string
      areaName?: string
      role?: string
      partnerType?: string
      partnerId?: string
    }
    // Audit fields following vdm standard
    audit: {
      createdAt:#/components/schemas/Date
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/export/projects

- Summary  
  Starts an export to Info-RTU.

- Description  
  Allows to start an export to Info-RTU.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 202 Accepted

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 409 undefined

- 503 undefined

---

### [GET]/v1/rtuExportLogs

- Summary  
  Lists all the Info-RTU export logs.

- Description  
  Allows to view a list of the Info-RTU export logs based on the query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
fields?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// A paginated collection of Info-RTU export logs
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    // The id of the object
    id: string
    status: string
    // a date used a timestamp, start and end dates
    startDateTime: string
    endDateTime:#/components/schemas/Date
    errorDescription?: string
    projects: {
      id: string
      status: string
      projectName: string
      streetName: string
      streetFrom: string
      streetTo: string
      errorDescriptions?: string[]
    }[]
    // Audit fields following vdm standard
    audit: {
      createdAt:#/components/schemas/Date
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/rtuExportLogs/{id}

- Summary  
  Returns one specific Info-RTU export log based on the identifier.

- Description  
  Allows to retrieve one specific Info-RTU export log based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  // The id of the object
  id: string
  status: string
  // a date used a timestamp, start and end dates
  startDateTime: string
  endDateTime:#/components/schemas/Date
  errorDescription?: string
  projects: {
    id: string
    status: string
    projectName: string
    streetName: string
    streetFrom: string
    streetTo: string
    errorDescriptions?: string[]
  }[]
  // Audit fields following vdm standard
  audit: {
    createdAt:#/components/schemas/Date
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/rtuImportLogs

- Summary  
  Lists all the Info-RTU import logs.

- Description  
  Allows to view a list of the Info-RTU import logs based on the query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
fields?: string | string[]
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// A paginated collection of Info-RTU import logs
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    // The id of the object
    id: string
    // a date used a timestamp, start and end dates
    startDateTime: string
    endDateTime:#/components/schemas/Date
    status: string
    errorDescription?: string
    failedProjects: {
      projectId: string
      projectNoReference: string
      projectName: string
      streetName: string
      streetFrom: string
      streetTo: string
      errorDescriptions?: string[]
    }[]
    // Audit fields following vdm standard
    audit: {
      createdAt:#/components/schemas/Date
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/rtuImportLogs/{id}

- Summary  
  Returns one specific Info-RTU import log based on the identifier.

- Description  
  Allows to retrieve one specific Info-RTU import log based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  // The id of the object
  id: string
  // a date used a timestamp, start and end dates
  startDateTime: string
  endDateTime:#/components/schemas/Date
  status: string
  errorDescription?: string
  failedProjects: {
    projectId: string
    projectNoReference: string
    projectName: string
    streetName: string
    streetFrom: string
    streetTo: string
    errorDescriptions?: string[]
  }[]
  // Audit fields following vdm standard
  audit: {
    createdAt:#/components/schemas/Date
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/requirements

- Summary  
  Creates a requirement.

- Description  
  Allows to create a requirement.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// A constraint or technical requirement.
{
  // The requirement type. Must be a taxonomy code that belongs to the group requirementType.
  typeId: string;
  // The requirement subtype. Must be a taxonomy code that belongs to the group requirementSubtype.
  subtypeId: string;
  // The requirement description.
  text: string;
  // A requirement item.
  items: {
    // The identifier of the requirement item.
    id: string;
    // The requirement item type. Must be a taxonomy code that belongs to the group requirementTargetType.
    type: string;
  }
  [];
}
```

#### Responses

- 201 Created

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainRequirement"
    },
    {
      "description": "The enriched requirement"
    }
  ],
  "required": [
    "id",
    "audit"
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/requirements

- Summary  
  Retrieves all requirements.

- Description  
  Allows to retrieve all requirements based on the query parameters.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
limit?: integer
```

```ts
offset?: integer
```

```ts
orderBy?: string
```

```ts
fields?: string | string[]
```

```ts
itemId?: string | string[]
```

```ts
itemType?: string
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// A paginated collection of Requirements
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/PlainRequirement &[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [PUT]/v1/requirements/{id}

- Summary  
  Modifies one specific requirement based on the identifier.

- Description  
  Allows to modify one specific requirement based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### RequestBody

- application/json

```ts
// A constraint or technical requirement.
{
  // The requirement type. Must be a taxonomy code that belongs to the group requirementType.
  typeId: string;
  // The requirement subtype. Must be a taxonomy code that belongs to the group requirementSubtype.
  subtypeId: string;
  // The requirement description.
  text: string;
  // A requirement item.
  items: {
    // The identifier of the requirement item.
    id: string;
    // The requirement item type. Must be a taxonomy code that belongs to the group requirementTargetType.
    type: string;
  }
  [];
}
```

#### Responses

- 200 Successful

`application/json`

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainRequirement"
    },
    {
      "description": "The enriched requirement"
    }
  ],
  "required": [
    "id",
    "audit"
  ]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/requirements/{id}

- Summary  
  Deletes one specific requirement based on the identifier.

- Description  
  Allows to delete one specific requirement based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/submissions

- Summary  
  Creates a submission.

- Description  
  Allows to create a submission.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  // Identifier of the program book in which the submission is located.
  programBookId: string
  projectIds?: string[]
}
```

#### Responses

- 201 Created

`application/json`

```ts
// A submission.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/submissions/search

- Summary  
  Retrieves all submissions.

- Description  
  Allows to retrieve all submissions based on the search criterias.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// The submissions search request.
{
  submissionNumber?: string[]
  drmNumber?: string[]
  programBookId?: string[]
  projectIds?: string[]
  status?: string[]
  progressStatus?: string[]
  // The number of items to return.
  limit?: integer
  // The result offset for pagination.
  offset?: integer
  // Sort results.
  orderBy?: string
  fields?: string[]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// A paginated collection of Submissions
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  // A submission.
  items: {
  }[]
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [GET]/v1/submissions/countBy

- Summary  
  Gets a count of submissions.

- Description  
  Allows to get a filtered count of all submissions by a count key.

- Security  
  BearerAuth

#### Parameters(Query)

```ts
countBy?: string
```

```ts
drmNumber?: string | string[]
```

```ts
programBookId?: string | string[]
```

```ts
projectId?: string | string[]
```

```ts
status?: string
```

```ts
progressStatus?: string
```

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// The count of items based on a key.
{
  id?:  &
  // The number of items
  count?: number
}[]
```

- 400 undefined

- 401 undefined

- 403 undefined

- 405 undefined

- 503 undefined

---

### [PATCH]/v1/submissions/{submissionNumber}

- Summary  
  Modifies one specific submission based on the submission number.

- Description  
  Allows to modify one specific submission based on the submission number.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  // Submission status. Must be a taxonomy code that belongs to group submissionStatus.
  status?: string
  // Submission progress status. Must be a taxonomy code that belongs to group submissionProgressStatus.
  progressStatus?: string
  progressStatusChangeDate?: #/components/schemas/Date &
  // Comment about the submission.
  comment?: string
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// A submission.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/submissions/{submissionNumber}

- Summary  
  Retrieves one specific submission based on the identifier.

- Description  
  Allows to retrieve one specific submission based on the identifier.

- Security  
  BearerAuth

#### Headers

```ts
accept?: string
```

```ts
Accept-Language: string
```

#### Responses

- 200 Successful

`application/json`

```ts
// A submission.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 503 undefined

---

### [POST]/v1/submissions/{submissionNumber}/add/project/{id}

- Summary  
  Add one specific project to a specific submission.

- Description  
  Allows to add one specific project to a specific submission based on the identifier and the submission number.

- Security  
  BearerAuth

#### Responses

- 200 Successful

`application/json`

```ts
// A submission.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/submissions/{submissionNumber}/remove/project/{id}

- Summary  
  Removes one specific project from a specific submission.

- Description  
  Allows to remove one specific project from a specific submission based on the identifier and the submission number.

- Security  
  BearerAuth

#### Responses

- 200 Successful

`application/json`

```ts
// A submission.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/submissions/{submissionNumber}/documents

- Summary  
  Attaches a document to submission based on the identifier.

- Description  
  Allows to upload a document to submission based on the identifier. Proxies the storage API.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- multipart/form-data

```ts
// the attached document and metadata
{
  file: string;
  documentName: string;
}
```

#### Responses

- 201 Created

`application/json`

```ts
// the persisted attached documents
//
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [POST]/v1/submissions/{submissionNumber}/requirements

- Summary  
  Adds a requirement to a specific submission.

- Description  
  Allows to add a requirement to a specific submission based on the submission number.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// A requirement.
{
  // The requirement subtype. Must be a taxonomy code that belongs to the group submissionRequirementSubtype.
  subtypeId: string
  // The requirement description.
  text: string
  projectIds?: string[]
}
```

#### Responses

- 201 Created

`application/json`

```ts
// A requirement.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [PUT]/v1/submissions/{submissionNumber}/requirements/{id}

- Summary  
  Modifies one specific requirement of a specific submission.

- Description  
  Allows to modify one specific requirement of a specific submission based on the identifier and the submission number.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
// A requirement.
{
  // The requirement subtype. Must be a taxonomy code that belongs to the group submissionRequirementSubtype.
  subtypeId: string
  // The requirement description.
  text: string
  projectIds?: string[]
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// A requirement.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/submissions/{submissionNumber}/requirements/{id}

- Summary  
  Deletes one specific requirement of a specific submission.

- Description  
  Allows to delete one specific requirement of a specific submission based on the identifier and the submission number.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [PATCH]/v1/submissions/{submissionNumber}/requirements/{id}

- Summary  
  Makes obsolete or undo one specific requirement of a specific submission.

- Description  
  Allows to make obsolete or undo one specific requirement of a specific submission based on the identifier and the submission number.

- Security  
  BearerAuth

#### Headers

```ts
content-type?: string
```

#### RequestBody

- application/json

```ts
{
  // Indicates whether the requirement is obsolete or not.
  isDeprecated: boolean;
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// A requirement.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [GET]/v1/submissions/{submissionNumber}/documents/{documentId}

- Summary  
  Downloads a submission document based on the identifier and the submission number.

- Description  
  Allows to downloads a submission document based on the identifier and the submission number.

- Security  
  BearerAuth

#### Responses

- 200 The binary of the document.

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 503 undefined

---

### [PUT]/v1/submissions/{submissionNumber}/documents/{documentId}

- Summary  
  Modifies one specific document of a specific submission.

- Description  
  Allows to modify one specific document of a specific submission based on the identifier and the submission number.

- Security  
  BearerAuth

#### RequestBody

- multipart/form-data

```ts
// the attached document and metadata
{
  file: string;
  documentName: string;
}
```

#### Responses

- 200 Successful

`application/json`

```ts
// A submission.
{
}
```

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

---

### [DELETE]/v1/submissions/{submissionNumber}/documents/{documentId}

- Summary  
  Removes one specific document from a specific submission.

- Description  
  Allows to remove one specific document from a specific submission based on the identifier and the submission number.

- Security  
  BearerAuth

#### Responses

- 204 undefined

- 400 undefined

- 401 undefined

- 403 undefined

- 404 undefined

- 405 undefined

- 422 undefined

- 503 undefined

## References

### #/components/securitySchemes/BearerAuth

```ts
{
  "type": "http",
  "scheme": "bearer"
}
```

### #/components/securitySchemes/OpenID

```ts
{
  "type": "openIdConnect",
  "openIdConnectUrl": "https://auth.montreal.ca/oxauth/.well-known/openid-configuration"
}
```

### #/components/parameters/InterventionAssetTypeId

```ts
interventionAssetTypeId?: string | string[]
```

### #/components/parameters/excludeProgramBookIds

```ts
excludeProgramBookIds?: string | string[]
```

### #/components/parameters/QueryId

```ts
// The id of the object
id?: string
```

### #/components/parameters/Year

```ts
year?: integer
```

### #/components/parameters/FromYear

```ts
fromYear?: integer
```

### #/components/parameters/ToYear

```ts
toYear?: integer
```

### #/components/parameters/AnnualProgramStatus

```ts
status?: string
```

### #/components/parameters/PathFileId

```ts
// The id of the object
fileId: string;
```

### #/components/parameters/NexoImportStatus

```ts
status?: string
```

### #/components/parameters/PathAssetId

```ts
assetId: string;
```

### #/components/parameters/PathAssetType

```ts
assetType: string;
```

### #/components/parameters/PathCommentId

```ts
// The id of the object
idComment: string;
```

### #/components/parameters/PathDocumentId

```ts
// The id of the object
documentId: string;
```

### #/components/parameters/PathId

```ts
// The id of the object
id: string;
```

### #/components/parameters/PathInterventionId

```ts
interventionId: string;
```

### #/components/parameters/PathNoteId

```ts
// The id of the object
noteId: string;
```

### #/components/parameters/PathProgramBookId

```ts
// The id of the object
programBookId: string;
```

### #/components/parameters/PathProjectId

```ts
projectId: string;
```

### #/components/parameters/PathPriorityScenarioId

```ts
// The id of the object
priorityScenarioId: string;
```

### #/components/parameters/PathTaxonomyGroup

```ts
group: string;
```

### #/components/parameters/PathTaxonomyCode

```ts
code: string;
```

### #/components/parameters/Id

```ts
// The id of the object
id: string;
```

### #/components/parameters/Ids

```ts
id?: string | string[]
```

### #/components/parameters/ObjectId

```ts
// The id of the object
objectId: string;
```

### #/components/parameters/Accept

```ts
accept?: string
```

### #/components/parameters/Accept-Language

```ts
Accept-Language: string
```

### #/components/parameters/AssetId

```ts
assetId?: string | string[]
```

### #/components/parameters/AssetOwnerId

```ts
assetOwnerId?: string | string[]
```

### #/components/parameters/AssetTypeId

```ts
assetTypeId?: string | string[]
```

### #/components/parameters/Bbox

```ts
// Comma separated list of coordinates
bbox?: string
```

### #/components/parameters/BoroughId

```ts
boroughId?: string | string[]
```

### #/components/parameters/DecisionTypeId

```ts
decisionTypeId?: string | string[]
```

### #/components/parameters/Budget

```ts
budget?: number
```

### #/components/parameters/FromBudget

```ts
fromBudget?: number
```

### #/components/parameters/ToBudget

```ts
toBudget?: number
```

### #/components/parameters/CategoryId

```ts
categoryId?: string | string[]
```

### #/components/parameters/ProjectId

```ts
projectId?: string | string[]
```

### #/components/parameters/Content-Type

```ts
content-type?: string
```

### #/components/parameters/ContinuationToken

```ts
// A base 64 server timestamp_id continuation token for syncing. {timestamp}-{id}
after?: string
```

### #/components/parameters/CountBy

```ts
countBy?: string
```

### #/components/parameters/Date

```ts
date?: string
```

### #/components/parameters/EndYear

```ts
endYear?: integer
```

### #/components/parameters/FromEndYear

```ts
fromEndYear?: integer
```

### #/components/parameters/ToEndYear

```ts
toEndYear?: integer
```

### #/components/parameters/ETag

```ts
if-match?: integer
```

### #/components/parameters/Estimate

```ts
estimate?: integer
```

### #/components/parameters/FromEstimate

```ts
fromEstimate?: number
```

### #/components/parameters/ToEstimate

```ts
toEstimate?: number
```

### #/components/parameters/ExecutorId

```ts
executorId?: string | string[]
```

### #/components/parameters/Expand

```ts
expand?: string[]
```

### #/components/parameters/Fields

```ts
fields?: string | string[]
```

### #/components/parameters/InChargeId

```ts
inChargeId?: string | string[]
```

### #/components/parameters/InterventionAreaBbox

```ts
// Comma separated list of coordinates
interventionAreaBbox?: string
```

### #/components/parameters/InterventionTypeId

```ts
type?: string
```

### #/components/parameters/InterventionYear

```ts
interventionYear?: integer
```

### #/components/parameters/FromInterventionYear

```ts
fromInterventionYear?: integer
```

### #/components/parameters/ToInterventionYear

```ts
toInterventionYear?: integer
```

### #/components/parameters/Limit

```ts
limit?: integer
```

### #/components/parameters/ProjectLimit

```ts
projectLimit?: integer
```

### #/components/parameters/LogicalLayers

```ts
[];
```

### #/components/parameters/MedalId

```ts
medalId?: string | string[]
```

### #/components/parameters/Offset

```ts
offset?: integer
```

### #/components/parameters/ProjectOffset

```ts
projectOffset?: integer
```

### #/components/parameters/OrderBy

```ts
orderBy?: string
```

### #/components/parameters/ProjectOrderBy

```ts
projectOrderBy?: string
```

### #/components/parameters/PlanificationYear

```ts
planificationYear?: integer
```

### #/components/parameters/FromPlanificationYear

```ts
fromPlanificationYear?: integer
```

### #/components/parameters/ToPlanificationYear

```ts
toPlanificationYear?: integer
```

### #/components/parameters/ProgramId

```ts
programId?: string | string[]
```

### #/components/parameters/ProgramBookId

```ts
programBookId?: string | string[]
```

### #/components/parameters/Project

```ts
project?: string
```

### #/components/parameters/ProjectTypeId

```ts
projectTypeId?: string | string[]
```

### #/components/parameters/Q

```ts
q?: string
```

### #/components/parameters/ReferenceId

```ts
referenceId?: string
```

### #/components/parameters/RequestorId

```ts
requestorId?: string | string[]
```

### #/components/parameters/StartYear

```ts
startYear?: integer
```

### #/components/parameters/FromStartYear

```ts
fromStartYear?: integer
```

### #/components/parameters/ToStartYear

```ts
toStartYear?: integer
```

### #/components/parameters/Status

```ts
status?: string
```

### #/components/parameters/ProgressStatus

```ts
progressStatus?: string
```

### #/components/parameters/SubCategoryId

```ts
subCategoryId?: string | string[]
```

### #/components/parameters/InterventionProgramId

```ts
interventionProgramId?: string | string[]
```

### #/components/parameters/IsGeolocated

```ts
isGeolocated?: boolean
```

### #/components/parameters/TaxonomyCode

```ts
taxonomyCode: string;
```

### #/components/parameters/TaxonomyCodeQuery

```ts
taxonomyCode?: string
```

### #/components/parameters/TermId

```ts
termId: string;
```

### #/components/parameters/TermCode

```ts
termCode?: string
```

### #/components/parameters/WorkTypeId

```ts
workTypeId?: string | string[]
```

### #/components/parameters/Key

```ts
key: string;
```

### #/components/parameters/AreaId

```ts
areaId?: string | string[]
```

### #/components/parameters/PartnerId

```ts
partnerId?: string | string[]
```

### #/components/parameters/RtuStatus

```ts
status?: string | string[]
```

### #/components/parameters/Phase

```ts
phase?: string | string[]
```

### #/components/parameters/FromDateStart

```ts
// a date used a timestamp, start and end dates
fromDateStart?: string
```

### #/components/parameters/ToDateStart

```ts
// a date used a timestamp, start and end dates
toDateStart?: string
```

### #/components/parameters/FromDateEnd

```ts
// a date used a timestamp, start and end dates
fromDateEnd?: string
```

### #/components/parameters/ToDateEnd

```ts
// a date used a timestamp, start and end dates
toDateEnd?: string
```

### #/components/parameters/DrmNumber

```ts
drmNumber?: string | string[]
```

### #/components/parameters/SubmissionNumber

```ts
submissionNumber?: string | string[]
```

### #/components/parameters/IdQuery

```ts
id?: string | string[]
```

### #/components/parameters/ItemId

```ts
itemId?: string | string[]
```

### #/components/parameters/ItemType

```ts
itemType?: string
```

### #/components/parameters/PathSubmissionNumber

```ts
submissionNumber: string;
```

### #/components/parameters/DecisionRequired

```ts
decisionRequired?: boolean
```

### #/components/responses/Created

- application/json

```ts
{
  "required": [
    "created"
  ],
  "properties": {
    "id": {
      "$ref": "#/components/schemas/Uuid"
    }
  }
}
```

### #/components/responses/Accepted

```ts
{
  "description": "The resource was deleted"
}
```

### #/components/responses/NoContent

```ts
{
  "description": "No content"
}
```

### #/components/responses/NotFound

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/responses/InvalidRequest

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/responses/Unauthorized

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/responses/Forbidden

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/responses/InvalidInput

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/responses/UnexpectedError

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/responses/UnprocessableEntity

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/responses/Conflict

- application/json

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/schemas/DiagnosticsInfo

```ts
{
  name: string;
  description: string;
  version: string;
}
```

### #/components/schemas/ConflictualType

```ts
{
  "type": "string",
  "enum": [
    "intervention",
    "project"
  ],
  "description": "Is a enum of intervention or a project",
  "example": "intervention"
}
```

### #/components/schemas/ConflictualItem

```ts
// a conflictualItem write - read -
{
  id: string;
  // Is a enum of intervention or a project
  type: string;
}
```

### #/components/schemas/History

```ts
// history for intervention and project
{
  // The id of the object
  id?: string
  // This is type of the element the constraint is affected
  objectTypeId: string
  referenceId: string
  actionId: string
  // This is type of modification like constraint
  categoryId?: string
  // An history for a modification on a intervention or a project
  summary: {
    statusFrom?: string
    statusTo?: string
    comments?: string
  }
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/PlainIntervention

```ts
{
  "allOf": [
    {
      "description": "a plain intervention feature write - for taxonomyCode read -"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "estimate": {
          "type": "number",
          "description": "the initial work estimate in dollars",
          "example": 100000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea"
  ]
}
```

### #/components/schemas/PlainPaginatedInterventions

```ts
// a paginated collection of interventions
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseIntervention &[]
}
```

### #/components/schemas/EnrichedAnnualProgram

```ts
// An enriched annual program
{
  // The id of the object
  id: string
  // The identifier of the executor. Comes from taxonomies.
  executorId: string
  // The annual program's year.
  year: number
  // The annual program's description
  description?: string
  // The maximum budget cap in thousands of dollars for a project to be in the program book.
  budgetCap: number
  sharedRoles?: string[]
  programBooks?:  & #/components/schemas/PlainProgramBook &[]
  // The annual program's status.
  status: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // Tells whether the user has limited access to this annual program. Usually true when the user can see a program book but not the annual program info. When true only the id, executorId and the year are returned.
  limitedAccess?: boolean
}
```

### #/components/schemas/BaseIntervention

```ts
{
  id?: string
  // must be a taxonomy code that belongs to group executor
  executorId: string
  // an external intervention or project reference
  externalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  medalId?: string
  importRevisionDate?: string
}
```

### #/components/schemas/EnrichedIntervention

```ts
{
  "allOf": [
    {
      "description": "an enriched intervention feature"
    },
    {
      "$ref": "#/components/schemas/BaseIntervention"
    },
    {
      "properties": {
        "interventionName": {
          "type": "string",
          "description": "Nom de l'intervention",
          "example": "Réparation borne d'incendie 2029"
        },
        "interventionTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)",
          "example": "follow-up"
        },
        "workTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)",
          "example": "construction"
        },
        "requestorId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "boroughId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "status": {
          "description": "reinforced (populated && || validated) by the state machine",
          "type": "string"
        },
        "interventionYear": {
          "type": "integer",
          "description": "year the intervention is done",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "planificationYear": {
          "type": "integer",
          "description": "year the intervention is planned",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "endYear": {
          "type": "integer",
          "description": "year the intervention is supposedly completed",
          "example": 2021,
          "minimum": 2000,
          "maximum": 3000
        },
        "programId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe programType"
        },
        "contact": {
          "description": "the contact for the intervention (text field for v1), the user identity by default as of v2 ++",
          "type": "string"
        },
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Asset"
          }
        },
        "interventionArea": {
          "$ref": "#/components/schemas/InterventionArea"
        },
        "roadSections": {
          "$ref": "#/components/schemas/FeatureCollection"
        },
        "importFlag": {
          "type": "string"
        },
        "version": {
          "type": "integer"
        },
        "estimate": {
          "$ref": "#/components/schemas/Budget"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/InterventionAnnualDistribution"
        },
        "project": {
          "$ref": "#/components/schemas/Project"
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/InterventionDecision"
          }
        },
        "decisionRequired": {
          "type": "boolean"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "streetName": {
          "type": "string",
          "description": "Suggested street name"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        },
        "designData": {
          "$ref": "#/components/schemas/DesignData"
        }
      }
    }
  ],
  "required": [
    "interventionName",
    "interventionTypeId",
    "workTypeId",
    "requestorId",
    "boroughId",
    "interventionYear",
    "planificationYear",
    "estimate",
    "assets",
    "interventionArea",
    "audit"
  ]
}
```

### #/components/schemas/EnrichedPaginatedInterventions

```ts
// a paginated collection of interventions
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseIntervention &[]
}
```

### #/components/schemas/EnrichedProgramBook

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "annualProgramId": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainProgramBook"
    },
    {
      "description": "The enriched program book",
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualProgram": {
          "$ref": "#/components/schemas/EnrichedAnnualProgram"
        },
        "objectives": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedObjective"
          }
        },
        "projects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjects": {
          "$ref": "#/components/schemas/EnrichedPaginatedProjects"
        },
        "removedProjectsIds": {
          "type": "array",
          "description": "An array of removed projects ids for this book.",
          "items": {
            "type": "string"
          }
        },
        "priorityScenarios": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PriorityScenario"
          }
        },
        "isAutomaticLoadingInProgress": {
          "type": "boolean",
          "description": "Indicates whether an automatic loading is in progress or not."
        }
      },
      "required": [
        "id",
        "status",
        "annualProgramId",
        "audit"
      ]
    }
  ]
}
```

### #/components/schemas/EnrichedPaginatedProgramBooks

```ts
// a paginated collection of program books
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/PlainProgramBook &[]
}
```

### #/components/schemas/EnrichedInterventionHistory

```ts
undefined?:  & #/components/schemas/BaseIntervention &[]
```

### #/components/schemas/PlainAnnualProgram

```ts
// An enriched annual program
{
  // The identifier of the executor. Comes from taxonomies.
  executorId: string
  // The annual program's year.
  year: number
  // The annual program's description
  description?: string
  // The maximum budget cap in thousands of dollars for a project to be in the program book.
  budgetCap: number
  sharedRoles?: string[]
  // The annual program's status.
  status?: string
}
```

### #/components/schemas/PlainProgramBook

```ts
// The plain version program book
{
  // The name of the program book
  name: string
  projectTypes?: string[]
  // The name of the person in charge of the program book. Free text field.
  inCharge?: string
  boroughIds?: string[]
  sharedRoles?: string[]
  // The status of the program book. Value from taxonomies.
  status?: string
  programTypes?: string[]
  // The description of the program book
  description?: string
}
```

### #/components/schemas/BaseProject

```ts
{
  // The project identifier
  id?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  boroughId?: string
  // year the project ends
  endYear?: integer
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  executorId?: string
  // an external intervention or project reference
  externalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  globalBudget: {
    allowance?: number
    burnedDown?: number
    balance?: number
  }
  importFlag?: string
  // Someone in charge of this project. Corresponds to requestors taxonomies
  inChargeId?: string
  interventionIds?: string[]
  servicePriorities: {
    // must have taxonomy code that belongs to the group service
    service: string
    // must have taxonomy code that belongs to the group priorityType
    priorityId: string
  }[]
  // description du projet
  projectName?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  projectTypeId?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  riskId?: string
  // year the project starts
  startYear?: integer
  // taxonomy code that belong to projectStatus group
  status?: string
  // Suggested street name
  streetName?: string
  subCategoryIds?: string[]
}
```

### #/components/schemas/PlainProject

```ts
{
  "allOf": [
    {
      "description": "a plain project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "annualPeriods": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PlainProjectAnnualPeriod"
          }
        },
        "annualProjectDistributionSummary": {
          "$ref": "#/components/schemas/PlainProjectAnnualDistributionSummary"
        }
      }
    }
  ],
  "required": [
    "boroughId",
    "executorId",
    "startYear",
    "endYear"
  ]
}
```

### #/components/schemas/PlainPaginatedProjects

```ts
// a paginated collection of plain projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseProject &[]
}
```

### #/components/schemas/InputDrmProject

```ts
{
  projectIds?: string[]
  isCommonDrmNumber: boolean
}
```

### #/components/schemas/DrmProject

```ts
{
  projectId: string;
  drmNumber: string;
}
```

### #/components/schemas/RtuExport

```ts
{
  status?: string
  // a date used a timestamp, start and end dates
  exportAt?: string
}
```

### #/components/schemas/EnrichedProject

```ts
{
  "allOf": [
    {
      "description": "an enriched project feature"
    },
    {
      "$ref": "#/components/schemas/BaseProject"
    },
    {
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "moreInformationAudit": {
          "$ref": "#/components/schemas/Audit"
        },
        "annualDistribution": {
          "$ref": "#/components/schemas/EnrichedProjectAnnualDistribution"
        },
        "contact": {
          "type": "string",
          "example": "Jean Girard"
        },
        "decisions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ProjectDecision"
          }
        },
        "documents": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedDocument"
          }
        },
        "geometryPin": {
          "$ref": "#/components/schemas/Point"
        },
        "interventions": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedIntervention"
          }
        },
        "length": {
          "$ref": "#/components/schemas/Length"
        },
        "medalId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "roadNetworkTypeId": {
          "type": "string",
          "description": "code de taxonomie appartenant au groupe GROUPE_TAXO"
        },
        "streetFrom": {
          "type": "string",
          "description": "From limit of the street name"
        },
        "streetTo": {
          "type": "string",
          "description": "To limit of the street name"
        },
        "isOpportunityAnalysis": {
          "type": "boolean",
          "description": "There is at least one opportunity notice created"
        },
        "drmNumber": {
          "type": "string",
          "description": "The DRM number"
        },
        "submissionNumber": {
          "type": "string",
          "description": "The submission number"
        },
        "rtuExport": {
          "$ref": "#/components/schemas/RtuExport"
        },
        "comments": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Comment"
          }
        }
      }
    }
  ]
}
```

### #/components/schemas/EnrichedPaginatedProjects

```ts
// a paginated collection of enriched projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseProject &[]
}
```

### #/components/schemas/EnrichedProjectAnnualDistribution

```ts
{
  distributionSummary: {
    // calculated. the sum of the interventions total budget and additional costs total budget.
    //
    totalBudget?: number
    additionalCostTotals: {
      // taxonomy code corresponding to the group additionalCost
      //
      type?: string
      // calculated. the sum of that type of additional costs throughout the project
      //
      amount?: number
      note?: string
    }[]
    // calculated. the sum of the additional costs total budget.
    //
    totalAdditionalCosts?: number
    // calculated. the sum of the interventions total budget.
    //
    totalInterventionBudgets?: number
    totalAnnualBudget: {
      // calculated.
      //
      totalAllowance?: number
      note?: string
    }
  }
  annualPeriods: {
    // calulated. must range between [0, (project.endYear - project.startYear)] years starts at index 0
    //
    rank?: number
    // calculated. the year of the annual period. allows searches and validations
    //
    year?: number
    // the project must share the year with the programBook. example - a project planned between 2021 and 2023 have 3 annuals periods of three different years (2021, 2022, 2023) attached to their respective programBooks
    //
    programBookId?: string
    programBook?:  & #/components/schemas/PlainProgramBook &
    // code of the taxonomy corresponding to the group annual period status (subset of project taxonomy statuses)
    //
    status?: string
    // calculated. code of the taxonomy corresponding to the projectCategory for that year
    //
    categoryId?: string
    // calculated. the sum of the annual project budget. write only for a non-geolocalized project
    //
    annualBudget?: number
    additionalCosts: {
      // taxonomy code corresponding to the group additionalCost
      //
      type: string
      amount: number
      // the external account reference (PTI program) of the additionnal costs
      //
      accountId?: number
    }[]
    // calculated. the sum of the additional costs for the year period.
    //
    additionalCostsTotalBudget?: number
    interventionIds?: string[]
    // calculated. the sum of the interventions costs for the year period.
    //
    interventionsTotalBudget?: number
    // input for a non-geolocated project.
    //
    annualAllowance?: number
    // the account external reference number (PTI program) for a non-geolocalized project
    //
    accountId?: number
  }[]
}
```

### #/components/schemas/AnnualProjectDistributionSummary

```ts
{
  // calculated. the sum of the interventions total budget and additional costs total budget.
  //
  totalBudget?: number
  additionalCostTotals: {
    // taxonomy code corresponding to the group additionalCost
    //
    type?: string
    // calculated. the sum of that type of additional costs throughout the project
    //
    amount?: number
    note?: string
  }[]
  // calculated. the sum of the additional costs total budget.
  //
  totalAdditionalCosts?: number
  // calculated. the sum of the interventions total budget.
  //
  totalInterventionBudgets?: number
  totalAnnualBudget: {
    // calculated.
    //
    totalAllowance?: number
    note?: string
  }
}
```

### #/components/schemas/AdditionalCostsTotalAmount

```ts
{
  // taxonomy code corresponding to the group additionalCost
  //
  type?: string
  // calculated. the sum of that type of additional costs throughout the project
  //
  amount?: number
  note?: string
}
```

### #/components/schemas/PlainProjectAnnualDistribution

```ts
{
  annualProjectDistributionSummary: {
    additionalCostsNotes: {
      // taxonomy code corresponding to the group additionalCost
      //
      type?: string
      // calculated. the sum of that type of additional costs throughout the project
      //
      amount?: number
      note?: string
    }[]
    totalAnnualBudgetNote?: string
  }
  annualPeriods: {
    additionalCosts: {
      // taxonomy code corresponding to the group additionalCost
      //
      type: string
      amount: number
      // the external account reference (PTI program) of the additionnal costs
      //
      accountId?: number
    }[]
    annualPeriodInterventions: {
      interventionId?: string
      year?: number
      annualAllowance?: number
      accountId?: number
    }[]
    // input for a non-geolocated project.
    //
    annualAllowance?: number
    // the account external reference number (PTI program) for a non-geolocalized project
    //
    accountId?: number
    // calculated. the year of the annual period. allows searches and validations
    //
    year?: number
  }[]
}
```

### #/components/schemas/PlainProjectAnnualDistributionSummary

```ts
{
  additionalCostsNotes: {
    // taxonomy code corresponding to the group additionalCost
    //
    type?: string
    // calculated. the sum of that type of additional costs throughout the project
    //
    amount?: number
    note?: string
  }[]
  totalAnnualBudgetNote?: string
}
```

### #/components/schemas/PlainProjectAnnualPeriod

```ts
{
  additionalCosts: {
    // taxonomy code corresponding to the group additionalCost
    //
    type: string
    amount: number
    // the external account reference (PTI program) of the additionnal costs
    //
    accountId?: number
  }[]
  annualPeriodInterventions: {
    interventionId?: string
    year?: number
    annualAllowance?: number
    accountId?: number
  }[]
  // input for a non-geolocated project.
  //
  annualAllowance?: number
  // the account external reference number (PTI program) for a non-geolocalized project
  //
  accountId?: number
  // calculated. the year of the annual period. allows searches and validations
  //
  year?: number
}
```

### #/components/schemas/AnnualPeriodInterventions

```ts
{
  interventionId?: string
  year?: number
  annualAllowance?: number
  accountId?: number
}
```

### #/components/schemas/EnrichedProjectAnnualPeriod

```ts
{
  // calulated. must range between [0, (project.endYear - project.startYear)] years starts at index 0
  //
  rank?: number
  // calculated. the year of the annual period. allows searches and validations
  //
  year?: number
  // the project must share the year with the programBook. example - a project planned between 2021 and 2023 have 3 annuals periods of three different years (2021, 2022, 2023) attached to their respective programBooks
  //
  programBookId?: string
  programBook?:  & #/components/schemas/PlainProgramBook &
  // code of the taxonomy corresponding to the group annual period status (subset of project taxonomy statuses)
  //
  status?: string
  // calculated. code of the taxonomy corresponding to the projectCategory for that year
  //
  categoryId?: string
  // calculated. the sum of the annual project budget. write only for a non-geolocalized project
  //
  annualBudget?: number
  additionalCosts: {
    // taxonomy code corresponding to the group additionalCost
    //
    type: string
    amount: number
    // the external account reference (PTI program) of the additionnal costs
    //
    accountId?: number
  }[]
  // calculated. the sum of the additional costs for the year period.
  //
  additionalCostsTotalBudget?: number
  interventionIds?: string[]
  // calculated. the sum of the interventions costs for the year period.
  //
  interventionsTotalBudget?: number
  // input for a non-geolocated project.
  //
  annualAllowance?: number
  // the account external reference number (PTI program) for a non-geolocalized project
  //
  accountId?: number
}
```

### #/components/schemas/AdditionalCost

```ts
{
  // taxonomy code corresponding to the group additionalCost
  //
  type: string
  amount: number
  // the external account reference (PTI program) of the additionnal costs
  //
  accountId?: number
}
```

### #/components/schemas/InterventionAnnualDistribution

```ts
// the ventilation of the intervention within its related project
//
{
  distributionSummary: {
    // the interventionId
    //
    id?: string
    // calculated.
    //
    totalAllowance?: number
    // calculated. in km
    //
    totalLength?: number
    note?: string
  }
  annualPeriods: {
    // calulated. must range between [0, (project.endYear - project.startYear)] years starts at index 0
    //
    rank?: number
    year?: number
    annualAllowance?: number
    annualLength?: number
    // the account external reference number (PTI program)
    //
    accountId?: number
  }[]
}
```

### #/components/schemas/AnnualInterventionDistributionSummary

```ts
{
  // the interventionId
  //
  id?: string
  // calculated.
  //
  totalAllowance?: number
  // calculated. in km
  //
  totalLength?: number
  note?: string
}
```

### #/components/schemas/AnnualBudgetDistributionSummary

```ts
{
  // calculated.
  //
  totalAllowance?: number
  note?: string
}
```

### #/components/schemas/InterventionAnnualPeriod

```ts
{
  // calulated. must range between [0, (project.endYear - project.startYear)] years starts at index 0
  //
  rank?: number
  year?: number
  annualAllowance?: number
  annualLength?: number
  // the account external reference number (PTI program)
  //
  accountId?: number
}
```

### #/components/schemas/CountBy

```ts
// The count of items based on a key.
{
  id?:  &
  // The number of items
  count?: number
}
```

### #/components/schemas/Project

```ts
// the project integration
{
  // The external reference id of the object
  id?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  typeId?: string
}
```

### #/components/schemas/InterventionSearchRequest

```ts
// The intervention search request.
{
  // The intervention ID to filter on.
  id?: #/components/schemas/StringOrStringArray
  // Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
  q?: string
  // The program book ID to filter on.
  programBookId?: #/components/schemas/UuidOrUuidArray
  // The program ID.
  programId?: #/components/schemas/StringOrStringArray
  // The intervention type ID.
  interventionTypeId?: #/components/schemas/StringOrStringArray
  // The work type ID.
  workTypeId?: #/components/schemas/StringOrStringArray
  // The requestor ID.
  requestorId?: #/components/schemas/StringOrStringArray
  // The borough ID.
  boroughId?: #/components/schemas/StringOrStringArray
  // The decision typeId.
  decisionTypeId?: #/components/schemas/StringOrStringArray
  // The intervention status.
  status?: #/components/schemas/StringOrStringArray
  // The intervention year to search.
  interventionYear?: integer
  // The intervention year to search from.
  fromInterventionYear?: integer
  // The intervention year to search to.
  toInterventionYear?: integer
  // The planification year to search.
  planificationYear?: integer
  // The planification year to search from.
  fromPlanificationYear?: integer
  // The planification year to search to.
  toPlanificationYear?: integer
  // The estimate to search.
  estimate?: integer
  // The estimate to search from.
  fromEstimate?: integer
  // The estimate to search to.
  toEstimate?: integer
  // The asset ID.
  assetId?: #/components/schemas/StringOrStringArray
  // The asset type ID.
  assetTypeId?: #/components/schemas/StringOrStringArray
  // The asset owner ID.
  assetOwnerId?: #/components/schemas/StringOrStringArray
  // The bbox for spatial search. A comma separated list of coordinates.
  interventionAreaBbox?: #/components/schemas/SearchBbox
  // The only possible value is 'null'. If null is specified, it will return interventions without projects.
  project?: string
  // The executor ID.
  executorId?: #/components/schemas/StringOrStringArray
  // The medal ID.
  medalId?: #/components/schemas/StringOrStringArray
  decisionRequired?: boolean
  // GeoJSon geometry object
  intersectGeometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
}
```

### #/components/schemas/OrderedProjectsPaginatedSearchRequest

```ts
{
  "allOf": [
    {
      "description": "The ordered project search request object sent as a parameter.",
      "properties": {
        "projectLimit": {
          "type": "integer",
          "description": "The number of items to return",
          "minimum": 1,
          "maximum": 100000,
          "default": 20
        },
        "projectOffset": {
          "type": "integer",
          "description": "The result offset for pagination.",
          "minimum": 0
        },
        "projectOrderBy": {
          "type": "string",
          "description": "Sort results, for example:\n-initialRank\n",
          "maxLength": 250
        }
      }
    }
  ]
}
```

### #/components/schemas/InterventionPaginatedSearchRequest

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/InterventionSearchRequest"
    },
    {
      "description": "The intervention search request object sent as a parameter.",
      "properties": {
        "limit": {
          "type": "integer",
          "description": "The number of items to return",
          "minimum": 1,
          "maximum": 100000,
          "default": 20
        },
        "offset": {
          "type": "integer",
          "description": "The result offset for pagination.",
          "minimum": 0
        },
        "orderBy": {
          "type": "string",
          "description": "Sort results, for example:\n-estimate,priority\n",
          "maxLength": 250
        },
        "expand": {
          "description": "The expand parameters for more information to be brought back.",
          "example": [
            "project"
          ],
          "oneOf": [
            {
              "$ref": "#/components/schemas/StringOrStringArray"
            }
          ]
        },
        "fields": {
          "description": "Comma separated list or array of strings of fields/attributes to return",
          "example": [
            "interventionTypeId",
            "boroughId"
          ],
          "oneOf": [
            {
              "$ref": "#/components/schemas/StringOrStringArray"
            }
          ]
        }
      }
    }
  ]
}
```

### #/components/schemas/InterventionCountBySearchRequest

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/InterventionSearchRequest"
    },
    {
      "description": "The intervention count by request object.",
      "properties": {
        "countBy": {
          "type": "string",
          "description": "The object key to count the interventions by.",
          "maxLength": 50
        }
      },
      "required": [
        "countBy"
      ]
    }
  ]
}
```

### #/components/schemas/AssetsLastInterventionSearchRequest

```ts
{
  assetIds?: string[]
  // an external intervention or project reference
  assetExternalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  planificationYear: integer
}
```

### #/components/schemas/AssetLastIntervention

```ts
{
  assetId?: string
  // an external intervention or project reference
  assetExternalReferenceId: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }
  intervention: {
    id: string
    planificationYear: integer
  }
}
```

### #/components/schemas/LastIntervention

```ts
{
  id: string;
  planificationYear: integer;
}
```

### #/components/schemas/ProjectSearchRequest

```ts
// The project search request object sent as a parameter.
{
  // The program book ID excluded.
  excludeProgramBookIds?: #/components/schemas/UuidOrUuidArray
  // Search criteria used for the project ID, project's name, project's DRM number and project's submission number. Checks if it contains the search criteria.
  q?: string
  // Code(s) of the taxonomy corresponding to the group assetType.
  interventionAssetTypeId?: #/components/schemas/StringOrStringArray
  // The project ID.
  id?: #/components/schemas/StringOrStringArray
  // The program book ID to filter on.
  programBookId?: #/components/schemas/UuidOrUuidArray
  // The project type ID.
  projectTypeId?: string | string[]
  // The executor ID.
  executorId?: #/components/schemas/StringOrStringArray
  fromYear?: integer
  // The project category ID.
  categoryId?: #/components/schemas/StringOrStringArray
  // The project sub-category ID.
  subCategoryId?: #/components/schemas/StringOrStringArray
  // The borough ID.
  boroughId?: #/components/schemas/StringOrStringArray
  // The status of the project.
  status?: string | string[]
  // The start year to search from.
  startYear?: integer
  // The year to search from.
  fromStartYear?: integer
  // The year to search to.
  toStartYear?: integer
  // The end year to search from.
  endYear?: integer
  // The year to search from.
  fromEndYear?: integer
  // The year to search to.
  toEndYear?: integer
  // The bbox for spatial search. A comma separated list of coordinates.
  bbox?: string
  // The budget to search from.
  fromBudget?: integer
  // The budget to search.
  budget?: integer
  // The budget to search to.
  toBudget?: integer
  // code of the taxonomy corresponding to the group requestor
  inChargeId?: #/components/schemas/StringOrStringArray
  // The workType ID.
  workTypeId?: #/components/schemas/StringOrStringArray
  // Boolean whether the request should only return non-geolocated projects
  isGeolocated?: boolean
  // The medal ID.
  medalId?: #/components/schemas/StringOrStringArray
  // Code(s) of the taxonomy corresponding to the group programType
  interventionProgramId?: #/components/schemas/StringOrStringArray
  // The submission number.
  submissionNumber?: #/components/schemas/StringOrStringArray
  // Unwanted ids
  excludeIds?: #/components/schemas/StringOrStringArray
  // GeoJSon geometry object
  intersectGeometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
}
```

### #/components/schemas/ProjectPaginatedSearchRequest

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/ProjectSearchRequest"
    },
    {
      "properties": {
        "limit": {
          "type": "integer",
          "description": "The number of items to return",
          "minimum": 1,
          "maximum": 100000,
          "default": 20
        },
        "offset": {
          "type": "integer",
          "description": "The result offset for pagination.",
          "minimum": 0
        },
        "expand": {
          "description": "The expand parameters for more information to be brought back.",
          "oneOf": [
            {
              "type": "string",
              "maxLength": 250
            },
            {
              "type": "array",
              "items": {
                "type": "string",
                "maxLength": 250
              }
            }
          ]
        },
        "fields": {
          "description": "Comma separated list or array of strings of fields/attributes to return",
          "oneOf": [
            {
              "type": "string",
              "maxLength": 250
            },
            {
              "type": "array",
              "items": {
                "type": "string",
                "maxLength": 250
              }
            }
          ]
        },
        "orderBy": {
          "type": "string",
          "description": "Sort results, for example:\n-estimate,priority\n",
          "maxLength": 250
        },
        "isGeolocated": {
          "description": "Boolean whether the request should only return non-geolocated projects",
          "type": "boolean",
          "default": true
        }
      }
    }
  ]
}
```

### #/components/schemas/ProjectCountBySearchRequest

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/ProjectSearchRequest"
    },
    {
      "description": "The project count by request object.",
      "properties": {
        "countBy": {
          "type": "string",
          "description": "The object key to count the projects by.",
          "maxLength": 50
        }
      },
      "required": [
        "countBy"
      ]
    }
  ]
}
```

### #/components/schemas/RtuProjectSearchRequest

```ts
// The RTU project search request.
{
  // The bbox for spatial search. A comma separated list of coordinates.
  bbox?: string
  // The area ID.
  areaId?: #/components/schemas/StringOrStringArray
  // The partner ID.
  partnerId?: #/components/schemas/StringOrStringArray
  // The status.
  status?: #/components/schemas/StringOrStringArray
  // The phase.
  phase?: #/components/schemas/StringOrStringArray
  // Lower bound of the start date of the project.
  fromDateStart?: #/components/schemas/Date
  // Upper bound of the start date of the project.
  toDateStart?: #/components/schemas/Date
  // Lower bound of the end date of the project.
  fromDateEnd?: #/components/schemas/Date
  // Upper bound of the end date of the project.
  toDateEnd?: #/components/schemas/Date
  // GeoJSon geometry object
  intersectGeometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // The number of items to return.
  limit?: integer
  // The result offset for pagination.
  offset?: integer
  // Sort results.
  orderBy?: string
  // Comma separated list or array of strings of fields/attributes to return.
  fields?: string | string[]
}
```

### #/components/schemas/PlainComment

```ts
// input for comment
{
  // code of the taxonomy corresponding to the group comment
  categoryId: string
  // the body content of the comment
  text: string
  isPublic?: boolean
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
}
```

### #/components/schemas/Comment

```ts
// the comments on the intervention
{
}
```

### #/components/schemas/ExternalReferenceId

```ts
// an external intervention or project reference
{
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  type: string;
  // the external id value
  value: string;
}
```

### #/components/schemas/SubmissionDocumentRequest

```ts
// the attached document and metadata
{
  file: string;
  documentName: string;
}
```

### #/components/schemas/PlainDocument

```ts
// the attached document and metadata
//
{
  // code of the taxonomy corresponding to the group document type (*'type de fichier' dans les maquettes)
  //
  type?: string
  file?: string
  documentName: string
  // states if shareable and readable from the referenced project sheet
  //
  isProjectVisible?: boolean
  notes?: string
  // 1. a document attached by a requestor requires the validation of an AGIR planner 2. a document attached by a planner is automatically validated 3. the attachment of a document to a project is always performed by a planner,
  //    so the document is automatically validated on the POST /project/{id}/document
  //
  validationStatus?: string
}
```

### #/components/schemas/EnrichedDocument

```ts
// the persisted attached documents
//
{
}
```

### #/components/schemas/InterventionDecision

```ts
// a decision attached to an intervention or project
{
  // The id of the object
  id?: string
  previousPlanificationYear?: integer
  // code of the taxonomy corresponding to the group intervention decision type
  typeId: string
  // project year and/or intervention year change
  targetYear?: integer
  // the body content of the rational
  text: string
  // code of the taxonomy corresponding to the group refusalReason
  refusalReasonId?: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/DecisionList

```ts
// a decision attached to an intervention or project
{
  // The id of the object
  id?: string
  previousPlanificationYear?: integer
  // code of the taxonomy corresponding to the group intervention decision type
  typeId: string
  // project year and/or intervention year change
  targetYear?: integer
  // the body content of the rational
  text: string
  // code of the taxonomy corresponding to the group refusalReason
  refusalReasonId?: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}[]
```

### #/components/schemas/ProjectDecision

```ts
// a decision attached to an intervention or project
{
  // The id of the object
  id?: string
  // code of the taxonomy corresponding to the group project decision type
  typeId: string
  // project year and/or intervention year change
  startYear?: integer
  // project year and/or intervention year change
  endYear?: integer
  previousStartYear?: integer
  previousEndYear?: integer
  annualPeriodYear?: integer
  // the body content of the rational
  text: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/Priority

```ts
{
  id?: number
  weights: {
    id?: number
    code?: number
    value?: number
  }[]
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/PriorityWeight

```ts
{
  id?: number
  code?: number
  value?: number
}
```

### #/components/schemas/Objective

```ts
{
  // The id of the object
  id?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  organizationId?: string
  length?: number
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  types?: string[]
  budget?: number
  year?: number
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/Rule

```ts
{
  // The id of the object
  id?: string
  // code of the taxonomy corresponding to the group rule type
  typeId?: string
  // a date used a timestamp, start and end dates
  startDate: string
  endDate:#/components/schemas/Date
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
}
```

### #/components/schemas/Budget

```ts
{
  allowance?: number
  burnedDown?: number
  balance?: number
}
```

### #/components/schemas/Asset

```ts
{
  // The external reference id of the object
  id?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  typeId: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  ownerId: string
  length: {
    value?: number
    unit?: string
  }
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // Asset Diameter
  diameter?: string
  // Asset material
  material?: string
  // Suggested street name
  suggestedStreetName?: string
  // external resources
  roadSections?: #/components/schemas/FeatureCollection
  // external resouces
  workArea?: #/components/schemas/Feature
  // an external intervention or project reference
  externalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  assetDesignData: {
    // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
    upstreamAssetType?: string
    // ID of the upstream asset.
    upstreamAssetId?: string
    // Depth of the upstream asset.
    upstreamDepth?: string
    // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
    downstreamAssetType?: string
    // ID of the downstream asset.
    downstreamAssetId?: string
    // Depth of the downstream asset.
    downstreamDepth?: string
    // Number of connections.
    numberOfConnections?: integer
    // Deformation of the asset.
    deformation?: integer
    // Allows to identify the presence of infiltration.
    hasInfiltration?: boolean
    // Description of the infiltration.
    infiltrationChaining?: string
    // ID of the asset from which the infiltration starts.
    infiltrationAssetId?: string
    // Allows to identify the presence of an obstruction.
    hasObstruction?: boolean
    // Description of the obstruction.
    obstructionChaining?: string
    // ID of the asset from which the obstruction starts.
    obstructionAssetId?: string
    comment?: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }
}
```

### #/components/schemas/AssetDesignData

```ts
{
  // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
  upstreamAssetType?: string
  // ID of the upstream asset.
  upstreamAssetId?: string
  // Depth of the upstream asset.
  upstreamDepth?: string
  // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
  downstreamAssetType?: string
  // ID of the downstream asset.
  downstreamAssetId?: string
  // Depth of the downstream asset.
  downstreamDepth?: string
  // Number of connections.
  numberOfConnections?: integer
  // Deformation of the asset.
  deformation?: integer
  // Allows to identify the presence of infiltration.
  hasInfiltration?: boolean
  // Description of the infiltration.
  infiltrationChaining?: string
  // ID of the asset from which the infiltration starts.
  infiltrationAssetId?: string
  // Allows to identify the presence of an obstruction.
  hasObstruction?: boolean
  // Description of the obstruction.
  obstructionChaining?: string
  // ID of the asset from which the obstruction starts.
  obstructionAssetId?: string
  comment?: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/AssetList

```ts
{
  // The external reference id of the object
  id?: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  typeId: string
  // code de taxonomie appartenant au groupe GROUPE_TAXO
  ownerId: string
  length: {
    value?: number
    unit?: string
  }
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // Asset Diameter
  diameter?: string
  // Asset material
  material?: string
  // Suggested street name
  suggestedStreetName?: string
  // external resources
  roadSections?: #/components/schemas/FeatureCollection
  // external resouces
  workArea?: #/components/schemas/Feature
  // an external intervention or project reference
  externalReferenceIds: {
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    type: string
    // the external id value
    value: string
  }[]
  assetDesignData: {
    // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
    upstreamAssetType?: string
    // ID of the upstream asset.
    upstreamAssetId?: string
    // Depth of the upstream asset.
    upstreamDepth?: string
    // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
    downstreamAssetType?: string
    // ID of the downstream asset.
    downstreamAssetId?: string
    // Depth of the downstream asset.
    downstreamDepth?: string
    // Number of connections.
    numberOfConnections?: integer
    // Deformation of the asset.
    deformation?: integer
    // Allows to identify the presence of infiltration.
    hasInfiltration?: boolean
    // Description of the infiltration.
    infiltrationChaining?: string
    // ID of the asset from which the infiltration starts.
    infiltrationAssetId?: string
    // Allows to identify the presence of an obstruction.
    hasObstruction?: boolean
    // Description of the obstruction.
    obstructionChaining?: string
    // ID of the asset from which the obstruction starts.
    obstructionAssetId?: string
    comment?: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }
}[]
```

### #/components/schemas/AssetsWorkAreaSearchRequest

```ts
// The assets search criterias.
{
  assets: {
    // The asset ID.
    id: string
    // The asset type. Must be a taxonomy code that belongs to group assetType.
    type: string
  }[]
  expand?: string[]
}
```

### #/components/schemas/AssetsWorkArea

```ts
// The assets and the combined surface areas geometry.
{
  // #/components/schemas/AssetList
  assets: {
    // The external reference id of the object
    id?: string
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    typeId: string
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    ownerId: string
    length: {
      value?: number
      unit?: string
    }
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
    // Asset Diameter
    diameter?: string
    // Asset material
    material?: string
    // Suggested street name
    suggestedStreetName?: string
    // external resources
    roadSections?: #/components/schemas/FeatureCollection
    // external resouces
    workArea?: #/components/schemas/Feature
    // an external intervention or project reference
    externalReferenceIds: {
      // code de taxonomie appartenant au groupe GROUPE_TAXO
      type: string
      // the external id value
      value: string
    }[]
    assetDesignData: {
      // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
      upstreamAssetType?: string
      // ID of the upstream asset.
      upstreamAssetId?: string
      // Depth of the upstream asset.
      upstreamDepth?: string
      // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
      downstreamAssetType?: string
      // ID of the downstream asset.
      downstreamAssetId?: string
      // Depth of the downstream asset.
      downstreamDepth?: string
      // Number of connections.
      numberOfConnections?: integer
      // Deformation of the asset.
      deformation?: integer
      // Allows to identify the presence of infiltration.
      hasInfiltration?: boolean
      // Description of the infiltration.
      infiltrationChaining?: string
      // ID of the asset from which the infiltration starts.
      infiltrationAssetId?: string
      // Allows to identify the presence of an obstruction.
      hasObstruction?: boolean
      // Description of the obstruction.
      obstructionChaining?: string
      // ID of the asset from which the obstruction starts.
      obstructionAssetId?: string
      comment?: string
      // Audit fields following vdm standard
      audit: {
        // a date used a timestamp, start and end dates
        createdAt?: string
        createdBy: {
          userName: string
          displayName: string
        }
        lastModifiedAt:#/components/schemas/Date
        lastModifiedBy:#/components/schemas/Author
        expiredAt:#/components/schemas/Date
        expiredBy:#/components/schemas/Author
      }
    }
  }[]
  // GeoJSon Feature
  workArea: {
    type: string
    id?: string | number
    geometry:#/components/schemas/Geometry
  }
}
```

### #/components/schemas/InterventionArea

```ts
{
  isEdited?: boolean
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  geometryPin:#/components/schemas/Point3D
}
```

### #/components/schemas/Taxonomy

```ts
// the taxonomy object
{
  // The id of the object
  id?: string
  group: string
  code: string
  label: {
    fr?: string
    en?: string
  }
  description:#/components/schemas/LocalizedText
  isActive?: boolean
  displayOrder?: number
  valueString1?: string
  valueString2?: string
  valueBoolean1?: boolean
}
```

### #/components/schemas/TaxonomyList

```ts
// the taxonomy object
{
  // The id of the object
  id?: string
  group: string
  code: string
  label: {
    fr?: string
    en?: string
  }
  description:#/components/schemas/LocalizedText
  isActive?: boolean
  displayOrder?: number
  valueString1?: string
  valueString2?: string
  valueBoolean1?: boolean
}[]
```

### #/components/schemas/Audit

```ts
// Audit fields following vdm standard
{
  // a date used a timestamp, start and end dates
  createdAt?: string
  createdBy: {
    userName: string
    displayName: string
  }
  lastModifiedAt:#/components/schemas/Date
  lastModifiedBy:#/components/schemas/Author
  expiredAt:#/components/schemas/Date
  expiredBy:#/components/schemas/Author
}
```

### #/components/schemas/Uuid

```ts
{
  "type": "string",
  "description": "The id of the object",
  "pattern": "^[\\.@!0-9a-fA-Z]*$",
  "example": "2819c223-7f76-453a-919d-413861904646",
  "readOnly": true
}
```

### #/components/schemas/UuidOrUuidArray

```ts
{
  "oneOf": [
    {
      "$ref": "#/components/schemas/Uuid"
    },
    {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/Uuid"
      }
    }
  ]
}
```

### #/components/schemas/ProjectCategory

```ts
{
  year: integer;
  // code de taxonomie appartenant au groupe projectCategory
  categoryId: string;
}
```

### #/components/schemas/ProjectIdRequest

```ts
{
  projectId: string;
}
```

### #/components/schemas/ReferenceId

```ts
{
  "type": "string",
  "description": "The external reference id of the object",
  "pattern": "^[\\.@!0-9a-fA-Z]*$",
  "example": "28.12"
}
```

### #/components/schemas/Uri

```ts
{
  "type": "string",
  "description": "the uri of a document",
  "pattern": "^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?",
  "example": "https://storage.ville.montreal.qc.ca/store/doc/id"
}
```

### #/components/schemas/Author

```ts
{
  userName: string;
  displayName: string;
}
```

### #/components/schemas/Date

```ts
{
  "type": "string",
  "description": "a date used a timestamp, start and end dates",
  "format": "date-time",
  "example": "2019-05-13T08:42:34Z"
}
```

### #/components/schemas/Interval

```ts
{
  "type": "string",
  "format": "day-time",
  "description": "a number of day",
  "example": "365"
}
```

### #/components/schemas/FeatureCollection

```ts
// GeoJSon Feature collection
{
  type: string
  // GeoJSon Feature
  features: {
    type: string
    id?: string | number
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
  }[]
}
```

### #/components/schemas/Feature

```ts
// GeoJSon Feature
{
  type: string
  id?: string | number
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
}
```

### #/components/schemas/Geometry

```ts
// GeoJSon geometry object
{
  // The type of the feature's geometry
  type: string
  coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
}
```

### #/components/schemas/SearchAssetsRequest

```ts
// Describes asset search parameters
{
  assetTypes?: string[]
  advancedIntersect?: boolean
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  // Search criteria used for the asset ID
  id?: string
}
```

### #/components/schemas/GeometryType

```ts
{
  "type": "string",
  "description": "The type of the feature's geometry",
  "enum": [
    "Polygon",
    "Point",
    "MultiPoint",
    "LineString",
    "MultiLineString",
    "MultiPolygon"
  ]
}
```

### #/components/schemas/Point

```ts
number[]
```

### #/components/schemas/MultiPoint

```ts
undefined:#/components/schemas/Point3D[]
```

### #/components/schemas/LineString

```ts
// #/components/schemas/Point3D
number[][]
```

### #/components/schemas/MultiLineString

```ts
// #/components/schemas/LineString
// #/components/schemas/Point3D
number[][][]
```

### #/components/schemas/Polygon

```ts
// #/components/schemas/Point3D
number[][][]
```

### #/components/schemas/MultiPolygon

```ts
// #/components/schemas/Polygon
// #/components/schemas/Point3D
number[][][][]
```

### #/components/schemas/Point3D

```ts
number[]
```

### #/components/schemas/Paging

```ts
{
  offset?: integer
  limit?: integer
  totalCount?: integer
}
```

### #/components/schemas/ContinuationToken

```ts
{
  "type": "string",
  "description": "A base 64 server timestamp_id continuation token for syncing. {timestamp}-{id}",
  "example": "MjAyMC0wMy0wM1QxNjoyOTo0MS03YzQ3NjUxYy1jNDM3LTQ0MDAtOWQ0Yi0wNTU5YmFlNWY4ZDI="
}
```

### #/components/schemas/Created

```ts
{
  "required": [
    "created"
  ],
  "properties": {
    "id": {
      "$ref": "#/components/schemas/Uuid"
    }
  }
}
```

### #/components/schemas/ErrorResponse

```ts
{
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiError"
    }
  }
}
```

### #/components/schemas/ApiError

```ts
{
  "required": [
    "code",
    "message"
  ],
  "properties": {
    "code": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "target": {
      "type": "string"
    },
    "details": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/ApiError"
      }
    },
    "innererror": {
      "$ref": "#/components/schemas/ApiInnerError"
    }
  }
}
```

### #/components/schemas/ApiInnerError

```ts
{
  "required": [
    "code",
    "message"
  ],
  "properties": {
    "code": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "innererror": {
      "$ref": "#/components/schemas/ApiInnerError"
    }
  }
}
```

### #/components/schemas/LocalizedText

```ts
{
  fr?: string
  en?: string
}
```

### #/components/schemas/Length

```ts
{
  value?: number
  unit?: string
}
```

### #/components/schemas/Borough

```ts
{
  id: string;
  name: string;
}
```

### #/components/schemas/SearchBbox

```ts
{
  "type": "string",
  "description": "The bbox for spatial search. A comma separated list of coordinates.",
  "example": "-73.69024,45.494472,-73.531264,45.53972",
  "maxLength": 250
}
```

### #/components/schemas/StringOrStringArray

```ts
{
  "oneOf": [
    {
      "type": "string",
      "maxLength": 50
    },
    {
      "type": "array",
      "items": {
        "type": "string",
        "maxLength": 50
      }
    }
  ]
}
```

### #/components/schemas/ShpProperty

```ts
// a shape file for import of interventions and projects
{
  // The id of the object
  ID: string
  // Reference number
  NUM_REF: string
  // Name of file
  NOM: string
  // Description of file
  DESCR: string
  PARTENAIRE: string
  STATUT: string
  TYPE: string
  PHASE: string
  // Realisation probability
  PROB_REALI: string
  // Intervention
  INTERVNT: string
  DT_SAISI: string
  DT_DEBUT: string
  DT_FIN: string
  LOCALIS: string
  // Project id
  projectId?: string
}
```

### #/components/schemas/BicProject

```ts
// project imported by BIC
{
  ANNEE_ACTUELLE?: string
  ANNEE_DEBUT: string
  ANNEE_FIN: string
  ANNEE_PROGRAMATION: number
  ANNEE_REVISEE?: number
  ARRONDISSEMENT_AGIR: string
  CATEGORIE_PROJET?: string
  CLASSIFICATION?: string
  COMMENTAIRES_DI_BIC?: string
  COMMENTAIRE_INTERVENTION?: string
  COMMENTAIRE_PROJET?: string
  COTE_GLOBALE?: number
  COTE_PRIORITE_GLOBAL?: number
  DESC_TYPE_TRAVAUX_TRC?: string
  DIVISION_REQUERANT_INITIAL?: string
  ESTIMATION_REQUERANT?: string | number
  ESTIMATION_BUDG_GLOBAL?: string
  ETAT_PROJET?: string
  EXECUTANT_AGIR: string
  ID_ARRONDISSEMENT?: number
  ID_EXECUTANT?: string
  ID_PROJET?: string | number
  ID_TYPE_TRAVAUX_TRC?: string | number
  LONGUEUR_GLOBAL?: number
  LONGUEUR_INTERV_REQUERANT?: number
  MEDAILLE_AMENAGEMENT?: string
  NO_PROJET?: string
  NO_REFERENCE_REQ?: string
  NOM_ARRONDISSEMENT?: string
  NOM_VOIE?: string
  PROGRAMME?: string
  PROJET_REQUERANT?: string
  PROPRIETAIRE_ACTIF?: string
  PRIORITE_REQ_AGIR?: string
  REQUERANT_AGIR: string
  REQUERANT_INITIAL?: string
  RISQUE_AUTRE_COMMENT?: string
  RISQUE_ENFOUISS_COMMENT?: string
  RISQUE_ACQUIS_TERRAIN?: string
  RISQUE_ENTENTE?: string
  COMMENTAIRE_ARRONDISSEMENT?: string
  COMMENTAIRE_MTQ_INFO_RTU?: string
  STATUT_INTERVENTION?: string
  STATUT_PROJET: string
  STATUT_SUIVI?: string
  TITRE_PROJET?: string
  TYPE_ACTIF_AGIR?: string
  TYPE_INTERVENTION?: string
  TYPE_PROJET?: string
  TYPE_RESEAU?: string
  TYPE_TRAVAUX_AGIR?: string
  VOIE_A?: string
  VOIE_DE?: string
  PROJET_NOM_VOIE?: string
  PROJET_VOIE_A?: string
  PROJET_VOIE_DE?: string
  PROJET_COMMENTAIRE_INFO?: string
  PROJET_COMMENTAIRE_REQ?: string
  PROJET_COMMENTAIRE_HISTO?: string
  PROJET_EXIGENCE?: string
  PROJET_CONTRAINTE?: string
  BUDGET_ANNEE_1?: number
  BUDGET_ANNEE_2?: number
  BUDGET_ANNEE_3?: number
  NO_SOUMISSION?: string
}
```

### #/components/schemas/GenerationReport

```ts
// The report returned from the generateReport function
{
  // The total amount of projects
  totalProjects?: number
  // The amount of successful generations
  totalGenerations?: number
}
```

### #/components/schemas/HistorySummary

```ts
// An history for a modification on a intervention or a project
{
  statusFrom?: string
  statusTo?: string
  comments?: string
}
```

### #/components/schemas/User

```ts
// The user
{
  accessToken: string
  iss: string
  exp: number
  iat: number
  keyId: number
  displayName: string
  aud: string
  name: string
  sub: string
  inum: string
  email: string
  userName: string
  givenName: string
  familyName: string
  userType: string
  mtlIdentityId?: string
  privileges: {
    domain: string
    application: string
    role: string
    permissions?: string[]
    // A set of description
    restrictions: {
    }
  }[]
}
```

### #/components/schemas/GdaPrivileges

```ts
{
  domain: string
  application: string
  role: string
  permissions?: string[]
  // A set of description
  restrictions: {
  }
}
```

### #/components/schemas/BaseObjective

```ts
{
  // The objective\'s name
  name: string
  // The target type of objective
  targetType: string
  // The type of objective
  objectiveType: string
  // The requestor ID. Filters which projects will be part of the objective calculation.
  requestorId?: string
  assetTypeIds?: string[]
  workTypeIds?: string[]
  // The flag that indicate if the objective is a key objective for the program book.
  pin?: boolean
}
```

### #/components/schemas/PlainObjective

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/BaseObjective"
    },
    {
      "description": "The plain objective. Used to create or update objectives."
    },
    {
      "properties": {
        "referenceValue": {
          "type": "number",
          "description": "The reference value. This is the target value of the objective.",
          "minimum": 1,
          "example": 29
        }
      }
    }
  ],
  "required": [
    "referenceValue"
  ]
}
```

### #/components/schemas/EnrichedObjective

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseObjective"
    },
    {
      "description": "The enriched objective. Contains the complete objective information."
    },
    {
      "properties": {
        "values": {
          "$ref": "#/components/schemas/ObjectiveValues"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "required": [
        "id",
        "values",
        "audit"
      ]
    }
  ]
}
```

### #/components/schemas/ObjectiveValues

```ts
// The objective values. Contains the reference and the calclated values.
{
  // The calculated value. This is the current actual value of the objective.
  calculated: number;
  // The reference value. This is the target value of the objective.
  reference: number;
}
```

### #/components/schemas/ImportProjectRequest

```ts
{
  // project imported by BIC
  bicProjects: {
    ANNEE_ACTUELLE?: string
    ANNEE_DEBUT: string
    ANNEE_FIN: string
    ANNEE_PROGRAMATION: number
    ANNEE_REVISEE?: number
    ARRONDISSEMENT_AGIR: string
    CATEGORIE_PROJET?: string
    CLASSIFICATION?: string
    COMMENTAIRES_DI_BIC?: string
    COMMENTAIRE_INTERVENTION?: string
    COMMENTAIRE_PROJET?: string
    COTE_GLOBALE?: number
    COTE_PRIORITE_GLOBAL?: number
    DESC_TYPE_TRAVAUX_TRC?: string
    DIVISION_REQUERANT_INITIAL?: string
    ESTIMATION_REQUERANT?: string | number
    ESTIMATION_BUDG_GLOBAL?: string
    ETAT_PROJET?: string
    EXECUTANT_AGIR: string
    ID_ARRONDISSEMENT?: number
    ID_EXECUTANT?: string
    ID_PROJET?: string | number
    ID_TYPE_TRAVAUX_TRC?: string | number
    LONGUEUR_GLOBAL?: number
    LONGUEUR_INTERV_REQUERANT?: number
    MEDAILLE_AMENAGEMENT?: string
    NO_PROJET?: string
    NO_REFERENCE_REQ?: string
    NOM_ARRONDISSEMENT?: string
    NOM_VOIE?: string
    PROGRAMME?: string
    PROJET_REQUERANT?: string
    PROPRIETAIRE_ACTIF?: string
    PRIORITE_REQ_AGIR?: string
    REQUERANT_AGIR: string
    REQUERANT_INITIAL?: string
    RISQUE_AUTRE_COMMENT?: string
    RISQUE_ENFOUISS_COMMENT?: string
    RISQUE_ACQUIS_TERRAIN?: string
    RISQUE_ENTENTE?: string
    COMMENTAIRE_ARRONDISSEMENT?: string
    COMMENTAIRE_MTQ_INFO_RTU?: string
    STATUT_INTERVENTION?: string
    STATUT_PROJET: string
    STATUT_SUIVI?: string
    TITRE_PROJET?: string
    TYPE_ACTIF_AGIR?: string
    TYPE_INTERVENTION?: string
    TYPE_PROJET?: string
    TYPE_RESEAU?: string
    TYPE_TRAVAUX_AGIR?: string
    VOIE_A?: string
    VOIE_DE?: string
    PROJET_NOM_VOIE?: string
    PROJET_VOIE_A?: string
    PROJET_VOIE_DE?: string
    PROJET_COMMENTAIRE_INFO?: string
    PROJET_COMMENTAIRE_REQ?: string
    PROJET_COMMENTAIRE_HISTO?: string
    PROJET_EXIGENCE?: string
    PROJET_CONTRAINTE?: string
    BUDGET_ANNEE_1?: number
    BUDGET_ANNEE_2?: number
    BUDGET_ANNEE_3?: number
    NO_SOUMISSION?: string
  }[]
  // GeoJSon Feature
  features: {
    type: string
    id?: string | number
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
  }[]
}
```

### #/components/schemas/BicImportLog

```ts
{
  // The id of the object
  id: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/PaginatedBicImportLogs

```ts
// a paginated collection of import logs
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    // The id of the object
    id: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }[]
}
```

### #/components/schemas/PlainUserPreference

```ts
{
}
```

### #/components/schemas/EnrichedUserPreference

```ts
{
  // The unique key of the user's preference
  key: string
  // Username
  userId: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/PriorityScenario

```ts
{
  id?: string
  name?: string
  priorityLevels?: #/components/schemas/PlainPriorityLevel &[]
  // a paginated collection of enriched projects
  orderedProjects: {
    paging: {
      offset?: integer
      limit?: integer
      totalCount?: integer
    }
    items: {
      projectId?: string
      // level rank, must be 1 or higher
      //
      levelRank?: number
      // initial rank, must be 1 or higher
      //
      initialRank?: number
      // project rank, start at 1
      //
      rank?: number
      // Manually ordered rank indicator
      //
      isManuallyOrdered?: boolean
      // note to justified the rank change
      //
      note?: string
      // Audit fields following vdm standard
      audit: {
        // a date used a timestamp, start and end dates
        createdAt?: string
        createdBy: {
          userName: string
          displayName: string
        }
        lastModifiedAt:#/components/schemas/Date
        lastModifiedBy:#/components/schemas/Author
        expiredAt:#/components/schemas/Date
        expiredBy:#/components/schemas/Author
      }
      objectivesCalculation: {
        // The id of the object
        objectiveId: string
        objectiveSum: number
        objectivePercent: number
      }[]
    }[]
  }
  isOutdated?: boolean
  status?: string
  audit:#/components/schemas/Audit
}
```

### #/components/schemas/PlainPriorityLevel

```ts
{
  // priority rank. 1 is defined by the system
  //
  rank: number
  // priority level criteria
  //
  criteria: {
    projectCategory: {
      // category must have taxonomy code that belongs to the group projectCategory
      category: string
      // subCategory must have taxonomy code that belongs to the groupe projectSubCategory
      subCategory?: string
    }[]
    workTypeId?: string[]
    requestorId?: string[]
    assetTypeId?: string[]
    interventionType?: string[]
    servicePriorities: {
      // must have taxonomy code that belongs to the group service
      service: string
      // must have taxonomy code that belongs to the group priorityType
      priorityId: string
    }[]
  }
  // a sort criteria of a priority level
  sortCriterias: {
    // The name of the sort criteria
    name: string
    // service must be a taxonomy code that belongs to group service
    service?: string
    // The rank of the sort criteria
    rank: number
  }[]
}
```

### #/components/schemas/EnrichedPriorityLevel

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/PlainPriorityLevel"
    },
    {
      "properties": {
        "isSystemDefined": {
          "type": "boolean"
        },
        "projectCount": {
          "type": "number",
          "description": "Count of projects that match the criteria\n"
        }
      }
    }
  ]
}
```

### #/components/schemas/OrderedProject

```ts
{
  projectId?: string
  // level rank, must be 1 or higher
  //
  levelRank?: number
  // initial rank, must be 1 or higher
  //
  initialRank?: number
  // project rank, start at 1
  //
  rank?: number
  // Manually ordered rank indicator
  //
  isManuallyOrdered?: boolean
  // note to justified the rank change
  //
  note?: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  objectivesCalculation: {
    // The id of the object
    objectiveId: string
    objectiveSum: number
    objectivePercent: number
  }[]
}
```

### #/components/schemas/PaginatedOrderedProjects

```ts
// a paginated collection of enriched projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    projectId?: string
    // level rank, must be 1 or higher
    //
    levelRank?: number
    // initial rank, must be 1 or higher
    //
    initialRank?: number
    // project rank, start at 1
    //
    rank?: number
    // Manually ordered rank indicator
    //
    isManuallyOrdered?: boolean
    // note to justified the rank change
    //
    note?: string
    // Audit fields following vdm standard
    audit: {
      // a date used a timestamp, start and end dates
      createdAt?: string
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
    objectivesCalculation: {
      // The id of the object
      objectiveId: string
      objectiveSum: number
      objectivePercent: number
    }[]
  }[]
}
```

### #/components/schemas/ProjectRank

```ts
{
  // new rank, must be 1 or higher
  //
  newRank?: number
  // manually ordered rank indicator
  //
  isManuallyOrdered?: boolean
  note?: string
}
```

### #/components/schemas/PriorityLevelCriteria

```ts
// priority level criteria
//
{
  projectCategory: {
    // category must have taxonomy code that belongs to the group projectCategory
    category: string
    // subCategory must have taxonomy code that belongs to the groupe projectSubCategory
    subCategory?: string
  }[]
  workTypeId?: string[]
  requestorId?: string[]
  assetTypeId?: string[]
  interventionType?: string[]
  servicePriorities: {
    // must have taxonomy code that belongs to the group service
    service: string
    // must have taxonomy code that belongs to the group priorityType
    priorityId: string
  }[]
}
```

### #/components/schemas/BaseOpportunityNotice

```ts
{
  // the reference to the project
  projectId: string
  object: string
  assets: {
    // The external reference id of the object
    id?: string
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    typeId: string
    // code de taxonomie appartenant au groupe GROUPE_TAXO
    ownerId: string
    length: {
      value?: number
      unit?: string
    }
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
    // Asset Diameter
    diameter?: string
    // Asset material
    material?: string
    // Suggested street name
    suggestedStreetName?: string
    // external resources
    roadSections?: #/components/schemas/FeatureCollection
    // external resouces
    workArea?: #/components/schemas/Feature
    // an external intervention or project reference
    externalReferenceIds: {
      // code de taxonomie appartenant au groupe GROUPE_TAXO
      type: string
      // the external id value
      value: string
    }[]
    assetDesignData: {
      // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
      upstreamAssetType?: string
      // ID of the upstream asset.
      upstreamAssetId?: string
      // Depth of the upstream asset.
      upstreamDepth?: string
      // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
      downstreamAssetType?: string
      // ID of the downstream asset.
      downstreamAssetId?: string
      // Depth of the downstream asset.
      downstreamDepth?: string
      // Number of connections.
      numberOfConnections?: integer
      // Deformation of the asset.
      deformation?: integer
      // Allows to identify the presence of infiltration.
      hasInfiltration?: boolean
      // Description of the infiltration.
      infiltrationChaining?: string
      // ID of the asset from which the infiltration starts.
      infiltrationAssetId?: string
      // Allows to identify the presence of an obstruction.
      hasObstruction?: boolean
      // Description of the obstruction.
      obstructionChaining?: string
      // ID of the asset from which the obstruction starts.
      obstructionAssetId?: string
      comment?: string
      // Audit fields following vdm standard
      audit: {
        // a date used a timestamp, start and end dates
        createdAt?: string
        createdBy: {
          userName: string
          displayName: string
        }
        lastModifiedAt:#/components/schemas/Date
        lastModifiedBy:#/components/schemas/Author
        expiredAt:#/components/schemas/Date
        expiredBy:#/components/schemas/Author
      }
    }
  }[]
  // requestorId must have taxonomy codes that belong to group requestor
  //
  requestorId: string
  contactInfo?: string
  followUpMethod: string
  maxIterations: number
}
```

### #/components/schemas/PlainOpportunityNotice

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "description": "The opportunity notice. Used to create or update opportunity notice."
    },
    {
      "properties": {
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PlainNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/PlainOpportunityNoticeResponse"
        }
      }
    }
  ]
}
```

### #/components/schemas/EnrichedOpportunityNotice

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        }
      }
    },
    {
      "$ref": "#/components/schemas/BaseOpportunityNotice"
    },
    {
      "properties": {
        "status": {
          "type": "string"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        },
        "notes": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/EnrichedNote"
          }
        },
        "response": {
          "$ref": "#/components/schemas/EnrichedOpportunityNoticeResponse"
        }
      }
    },
    {
      "required": [
        "status",
        "audit"
      ]
    }
  ]
}
```

### #/components/schemas/EnrichedOpportunityNoticePaginated

```ts
// a paginated collection of enriched opportunity notice
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items?:  & #/components/schemas/BaseOpportunityNotice &  &[]
}
```

### #/components/schemas/PlainNote

```ts
{
  text: string;
}
```

### #/components/schemas/EnrichedNote

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/PlainNote"
    },
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "required": [
        "id",
        "audit"
      ]
    }
  ]
}
```

### #/components/schemas/PlainOpportunityNoticeResponse

```ts
{
  requestorDecision?: string
  requestorDecisionNote?: string
  // a date used a timestamp, start and end dates
  requestorDecisionDate?: string
  planningDecision?: string
  planningDecisionNote?: string
}
```

### #/components/schemas/EnrichedOpportunityNoticeResponse

```ts
{
  "allOf": [
    {
      "$ref": "#/components/schemas/PlainOpportunityNoticeResponse"
    },
    {
      "properties": {
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "required": [
        "audit"
      ]
    }
  ]
}
```

### #/components/schemas/ObjectiveCalculation

```ts
{
  // The id of the object
  objectiveId: string;
  objectiveSum: number;
  objectivePercent: number;
}
```

### #/components/schemas/PlainNexoImportFile

```ts
// a NEXO import file
{
  file: string;
  // must be a taxonomy code that belongs to group nexoFileType
  fileType: string;
}
```

### #/components/schemas/NexoImportLog

```ts
// a NEXO import log
{
  // The id of the object
  id: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
  // must be a taxonomy code that belongs to group nexoImportStatus
  status: string
  // a NEXO import file
  files: {
    id: string
    name: string
    contentType: string
    // must be a taxonomy code that belongs to group nexoFileType
    type: string
    // must be a taxonomy code that belongs to group nexoImportStatus
    status: string
    numberOfItems?: integer
    errorDescription?: string
    projects: {
      id: string
      // must be a taxonomy code that belongs to group nexoImportStatus
      importStatus: string
      // must be a taxonomy code that belongs to group modificationType
      modificationType?: string
      description?: string
    }[]
    interventions?:  & #/components/schemas/NexoLogProject[]
  }[]
}
```

### #/components/schemas/NexoImportFile

```ts
// a NEXO import file
{
  id: string
  name: string
  contentType: string
  // must be a taxonomy code that belongs to group nexoFileType
  type: string
  // must be a taxonomy code that belongs to group nexoImportStatus
  status: string
  numberOfItems?: integer
  errorDescription?: string
  projects: {
    id: string
    // must be a taxonomy code that belongs to group nexoImportStatus
    importStatus: string
    // must be a taxonomy code that belongs to group modificationType
    modificationType?: string
    description?: string
  }[]
  interventions?:  & #/components/schemas/NexoLogProject[]
}
```

### #/components/schemas/NexoLogIntervention

```ts
{
  "allOf": [
    {
      "properties": {
        "lineNumber": {
          "type": "integer"
        }
      }
    },
    {
      "$ref": "#/components/schemas/NexoLogProject"
    }
  ],
  "required": [
    "lineNumber"
  ]
}
```

### #/components/schemas/NexoLogProject

```ts
{
  id: string
  // must be a taxonomy code that belongs to group nexoImportStatus
  importStatus: string
  // must be a taxonomy code that belongs to group modificationType
  modificationType?: string
  description?: string
}
```

### #/components/schemas/ServicePriority

```ts
{
  // must have taxonomy code that belongs to the group service
  service: string;
  // must have taxonomy code that belongs to the group priorityType
  priorityId: string;
}
```

### #/components/schemas/AllowedMimeType

```ts
{
  "type": "string",
  "enum": [
    "application/pdf",
    "application/msword",
    "image/x-dwg",
    "application/octet-stream",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/tiff"
  ]
}
```

### #/components/schemas/ProjectCategoryCriteria

```ts
{
  // category must have taxonomy code that belongs to the group projectCategory
  category: string
  // subCategory must have taxonomy code that belongs to the groupe projectSubCategory
  subCategory?: string
}
```

### #/components/schemas/PriorityLevelSortCriteria

```ts
// a sort criteria of a priority level
{
  // The name of the sort criteria
  name: string
  // service must be a taxonomy code that belongs to group service
  service?: string
  // The rank of the sort criteria
  rank: number
}
```

### #/components/schemas/RtuProject

```ts
{
  id: string
  name: string
  description?: string
  areaId: string
  partnerId: string
  noReference: string
  geometryPin:#/components/schemas/Point3D
  // GeoJSon geometry object
  geometry: {
    // The type of the feature's geometry
    type: string
    coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
  }
  status: string
  type: string
  phase: string
  // a date used a timestamp, start and end dates
  dateStart: string
  dateEnd:#/components/schemas/Date
  dateEntry:#/components/schemas/Date
  dateModification:#/components/schemas/Date
  cancellationReason?: string
  productionPb?: string
  conflict?: string
  duration?: string
  localization?: string
  streetName?: string
  streetFron?: string
  streetTo?: string
  contact: {
    id: string
    officeId: string
    num: string
    prefix: string
    name: string
    email: string
    phone: string
    title?: string
    phoneExtensionNumber?: string
    cell?: string
    fax?: string
    typeNotfc?: string
    paget?: string
    profile?: string
    globalRole?: string
    idInterim?: string
    inAutoNotification?: string
    inDiffusion?: string
    areaName?: string
    role?: string
    partnerType?: string
    partnerId?: string
  }
  // Audit fields following vdm standard
  audit: {
    createdAt:#/components/schemas/Date
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/RtuProjectContact

```ts
{
  id: string
  officeId: string
  num: string
  prefix: string
  name: string
  email: string
  phone: string
  title?: string
  phoneExtensionNumber?: string
  cell?: string
  fax?: string
  typeNotfc?: string
  paget?: string
  profile?: string
  globalRole?: string
  idInterim?: string
  inAutoNotification?: string
  inDiffusion?: string
  areaName?: string
  role?: string
  partnerType?: string
  partnerId?: string
}
```

### #/components/schemas/PaginatedRtuProjects

```ts
// a paginated collection of RTU projects
{
  paging: {
    offset?: integer
    limit?: integer
    totalCount?: integer
  }
  items: {
    id: string
    name: string
    description?: string
    areaId: string
    partnerId: string
    noReference: string
    geometryPin:#/components/schemas/Point3D
    // GeoJSon geometry object
    geometry: {
      // The type of the feature's geometry
      type: string
      coordinates: #/components/schemas/Point | #/components/schemas/MultiPoint | #/components/schemas/LineString | #/components/schemas/MultiLineString | #/components/schemas/Polygon | #/components/schemas/MultiPolygon
    }
    status: string
    type: string
    phase: string
    // a date used a timestamp, start and end dates
    dateStart: string
    dateEnd:#/components/schemas/Date
    dateEntry:#/components/schemas/Date
    dateModification:#/components/schemas/Date
    cancellationReason?: string
    productionPb?: string
    conflict?: string
    duration?: string
    localization?: string
    streetName?: string
    streetFron?: string
    streetTo?: string
    contact: {
      id: string
      officeId: string
      num: string
      prefix: string
      name: string
      email: string
      phone: string
      title?: string
      phoneExtensionNumber?: string
      cell?: string
      fax?: string
      typeNotfc?: string
      paget?: string
      profile?: string
      globalRole?: string
      idInterim?: string
      inAutoNotification?: string
      inDiffusion?: string
      areaName?: string
      role?: string
      partnerType?: string
      partnerId?: string
    }
    // Audit fields following vdm standard
    audit: {
      createdAt:#/components/schemas/Date
      createdBy: {
        userName: string
        displayName: string
      }
      lastModifiedAt:#/components/schemas/Date
      lastModifiedBy:#/components/schemas/Author
      expiredAt:#/components/schemas/Date
      expiredBy:#/components/schemas/Author
    }
  }[]
}
```

### #/components/schemas/SubmissionCreateRequest

```ts
{
  // Identifier of the program book in which the submission is located.
  programBookId: string
  projectIds?: string[]
}
```

### #/components/schemas/SubmissionsSearchRequest

```ts
// The submissions search request.
{
  submissionNumber?: string[]
  drmNumber?: string[]
  programBookId?: string[]
  projectIds?: string[]
  status?: string[]
  progressStatus?: string[]
  // The number of items to return.
  limit?: integer
  // The result offset for pagination.
  offset?: integer
  // Sort results.
  orderBy?: string
  fields?: string[]
}
```

### #/components/schemas/SubmissionPatchRequest

```ts
{
  // Submission status. Must be a taxonomy code that belongs to group submissionStatus.
  status?: string
  // Submission progress status. Must be a taxonomy code that belongs to group submissionProgressStatus.
  progressStatus?: string
  progressStatusChangeDate?: #/components/schemas/Date &
  // Comment about the submission.
  comment?: string
}
```

### #/components/schemas/Submission

```ts
// A submission.
{
}
```

### #/components/schemas/StatusHistoryItem

```ts
{
  // Must be a taxonomy code that belongs to group submissionStatus.
  status: string;
  comment: string;
  // a date used a timestamp, start and end dates
  createdAt: string;
  createdBy: {
    userName: string;
    displayName: string;
  }
}
```

### #/components/schemas/ProgressHistoryItem

```ts
{
  // Must be a taxonomy code that belongs to group submissionProgressStatus.
  progressStatus: string;
  // a date used a timestamp, start and end dates
  createdAt: string;
  createdBy: {
    userName: string;
    displayName: string;
  }
}
```

### #/components/schemas/SubmissionRequirementRequest

```ts
// A requirement.
{
  // The requirement subtype. Must be a taxonomy code that belongs to the group submissionRequirementSubtype.
  subtypeId: string
  // The requirement description.
  text: string
  projectIds?: string[]
}
```

### #/components/schemas/SubmissionRequirement

```ts
// A requirement.
{
}
```

### #/components/schemas/RtuExportLog

```ts
{
  // The id of the object
  id: string
  status: string
  // a date used a timestamp, start and end dates
  startDateTime: string
  endDateTime:#/components/schemas/Date
  errorDescription?: string
  projects: {
    id: string
    status: string
    projectName: string
    streetName: string
    streetFrom: string
    streetTo: string
    errorDescriptions?: string[]
  }[]
  // Audit fields following vdm standard
  audit: {
    createdAt:#/components/schemas/Date
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/RtuImportLog

```ts
{
  // The id of the object
  id: string
  // a date used a timestamp, start and end dates
  startDateTime: string
  endDateTime:#/components/schemas/Date
  status: string
  errorDescription?: string
  failedProjects: {
    projectId: string
    projectNoReference: string
    projectName: string
    streetName: string
    streetFrom: string
    streetTo: string
    errorDescriptions?: string[]
  }[]
  // Audit fields following vdm standard
  audit: {
    createdAt:#/components/schemas/Date
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/PlainRequirement

```ts
// A constraint or technical requirement.
{
  // The requirement type. Must be a taxonomy code that belongs to the group requirementType.
  typeId: string;
  // The requirement subtype. Must be a taxonomy code that belongs to the group requirementSubtype.
  subtypeId: string;
  // The requirement description.
  text: string;
  // A requirement item.
  items: {
    // The identifier of the requirement item.
    id: string;
    // The requirement item type. Must be a taxonomy code that belongs to the group requirementTargetType.
    type: string;
  }
  [];
}
```

### #/components/schemas/Requirement

```ts
{
  "allOf": [
    {
      "properties": {
        "id": {
          "$ref": "#/components/schemas/Uuid"
        },
        "audit": {
          "$ref": "#/components/schemas/Audit"
        }
      }
    },
    {
      "$ref": "#/components/schemas/PlainRequirement"
    },
    {
      "description": "The enriched requirement"
    }
  ],
  "required": [
    "id",
    "audit"
  ]
}
```

### #/components/schemas/RequirementItem

```ts
// A requirement item.
{
  // The identifier of the requirement item.
  id: string;
  // The requirement item type. Must be a taxonomy code that belongs to the group requirementTargetType.
  type: string;
}
```

### #/components/schemas/DesignData

```ts
{
  // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
  upstreamAssetType?: string
  // ID of the upstream asset.
  upstreamAssetId?: string
  // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
  downstreamAssetType?: string
  // ID of the downstream asset.
  downstreamAssetId?: string
  comment?: string
  contractRange?: string
  // Audit fields following vdm standard
  audit: {
    // a date used a timestamp, start and end dates
    createdAt?: string
    createdBy: {
      userName: string
      displayName: string
    }
    lastModifiedAt:#/components/schemas/Date
    lastModifiedBy:#/components/schemas/Author
    expiredAt:#/components/schemas/Date
    expiredBy:#/components/schemas/Author
  }
}
```

### #/components/schemas/InterventionExtractSearchRequest

```ts
// The intervention search request.
{
  // The planification year to search.
  planificationYear: integer
  // Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
  q?: string
  programId?: string[]
  interventionTypeId?: string[]
  workTypeId?: string[]
  requestorId?: string[]
  boroughId?: string[]
  decisionTypeId?: string[]
  status?: string[]
  // The estimate to search from.
  fromEstimate?: integer
  // The estimate to search to.
  toEstimate?: integer
  executorId?: string[]
  medalId?: string[]
  decisionRequired?: boolean
  assetTypeId?: string[]
  fields?: string[]
}
```

### #/components/schemas/ProjectExtractSearchRequest

```ts
// The project search request object sent as a parameter.
{
  // Search criteria used for the project ID, project's name, project's DRM number and project's submission number. Checks if it contains the search criteria.
  q?: string
  interventionAssetTypeId?: string[]
  // The id of the object
  programBookId?: string[]
  projectTypeId?: string[]
  executorId?: string[]
  categoryId?: string[]
  subCategoryId?: string[]
  boroughId?: string[]
  status?: string[]
  // The year to search.
  year: integer
  // The budget to search from.
  fromBudget?: integer
  // The budget to search to.
  toBudget?: integer
  workTypeId?: string[]
  medalId?: string[]
  interventionProgramId?: string[]
  submissionNumber?: string[]
  // Boolean whether the request should only return geolocated or non-geolocated projects.
  isGeolocated?: boolean
  fields?: string[]
}
```
