import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import {
  IBicImportLog,
  IBicProject,
  IEnrichedProject,
  IFeature,
  IImportProjectRequest,
  IPaginatedBicImportLogs,
  IShpProperty
} from '@villemontreal/agir-work-planning-lib';
import { environment } from 'src/environments/environment';

import { Observable } from 'rxjs';
import * as excel from '../files/excel';
import * as shapefile from '../files/shapefile';
import * as mtm from '../geomatic/mtm-converter';
import { IMappingResult as MappingResult } from '../models/import/mapping-result';

type ProjectFeature = turf.Feature<turf.LineString | turf.MultiLineString | turf.Point, IShpProperty>;

@Injectable({
  providedIn: 'root'
})
export class ImportInternalService {
  constructor(private readonly http: HttpClient) {}

  public async mapFiles(
    excelFile: File,
    intervalsPair: shapefile.IShpPair,
    intersectionsPair: shapefile.IShpPair,
    logosPair: shapefile.IShpPair
  ): Promise<MappingResult> {
    const excelData = await excel.readExcelFile<IBicProject>(excelFile);
    const intervalsShpData = await this.readShpFiles([intervalsPair]);
    const intersectionsShpData = await this.readShpFiles([intersectionsPair]);
    const logosShpData = await this.readShpFiles([logosPair]);
    return this.mapProjects(excelData, intervalsShpData, intersectionsShpData, logosShpData);
  }

  public async saveProject(importProjectRequest: IImportProjectRequest): Promise<IEnrichedProject> {
    return this.http
      .post<IEnrichedProject>(`${environment.apis.planning.importInternalProjects}`, importProjectRequest)
      .toPromise();
  }

  private mapProjects(
    bicProjects: IBicProject[],
    intervalsShpData: ProjectFeature[],
    intersectionsShpData: ProjectFeature[],
    logoShpData: ProjectFeature[]
  ): MappingResult {
    const mapping = new MappingResult();
    const bicProjectGroups = bicProjects.groupBy(x => x.NO_PROJET);
    for (const bicProjectGroup of bicProjectGroups) {
      const bicProjectNumber = bicProjectGroup.key;
      let features: IFeature[] = [];
      if (bicProjectGroup.items.find(x => x.CLASSIFICATION === 'PNI')) {
        features = intervalsShpData.filter(x => x.properties.NUM_REF === bicProjectNumber);
        if (!features.length) {
          features = intersectionsShpData.filter(x => x.properties.NUM_REF === bicProjectNumber);
          if (!features.length) {
            features = logoShpData.filter(x => x.properties.NUM_REF === bicProjectNumber);
          }
        }
      } else if (bicProjectNumber) {
        features = intervalsShpData.filter(x => x.properties.projectId === bicProjectNumber);
        if (!features.length) {
          features = intersectionsShpData.filter(x => x.properties.projectId === bicProjectNumber);
          if (!features.length) {
            features = logoShpData.filter(x => x.properties.projectId === bicProjectNumber);
          }
        }
      }
      if (features?.length) {
        const projectWithFeatures: IImportProjectRequest = {
          bicProjects: bicProjectGroup.items,
          features
        };
        mapping.projectsWithFeatures.push(projectWithFeatures);
      } else {
        mapping.projectsWithoutFeatures.push({
          bicProjects: bicProjectGroup.items,
          features
        });
      }
    }
    return mapping;
  }

  private async readShpFiles(shpPairs: shapefile.IShpPair[]): Promise<ProjectFeature[]> {
    const features = await shapefile.readFilePairs<ProjectFeature>(shpPairs);
    return features.map(x => {
      // Set the project ID
      const r = /(?<=_)(.*?)(?= )/.exec(x.properties.NOM);
      if (r && r.length) {
        x.properties.projectId = r[0];
      }
      // Convert MTM Zone 8 to WGS84
      x.geometry.type === 'Point' ? mtm.convert(x.geometry.coordinates) : mtm.toWsg84(x.geometry.coordinates);
      return x;
    });
  }

  public getBicImports(): Observable<IPaginatedBicImportLogs> {
    return this.http.get<IPaginatedBicImportLogs>(
      `${environment.apis.planning.bicImportLogs}?orderBy=-createdAt&limit=1`
    );
  }

  public postBicImportLog(): Promise<IBicImportLog> {
    return this.http
      .post<IBicImportLog>(`${environment.apis.planning.bicImportLogs}`, { body: null })
      .toPromise();
  }
}
