export interface IApiLocationConfig {
  addresses: string;
}

export interface IApiPlanningConfig {
  annualPrograms: string;
  assets: string;
  bicImportLogs: string;
  documents: string;
  drmNumber: string;
  submissionNumber: string;
  importInternalProjects: string;
  info: string;
  interventions: string;
  me: string;
  nexoImports: string;
  opportunityNotices: string;
  programBooks: string;
  projects: string;
  rtuExportLogs: string;
  rtuImportLogs: string;
  rtuProjects: string;
  search: string;
  taxonomies: string;
  requirements: string;
}

export interface IApiSpatialAnalysisConfig {
  url: string;
}

export interface IServicesConfig {
  import: {
    internal: {
      chunkSize: number;
    };
  };
  notifications: {
    timeouts: {
      default: number;
      warning: number;
      success: number;
    };
  };
  taxonomies: {
    refreshInterval: number;
  };
  pagination: {
    limitMax: number;
  };
}
