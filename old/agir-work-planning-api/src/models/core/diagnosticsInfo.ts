/**
 * The informations sent from a "/diagnostics/vXXX/info"
 * endpoint
 */
export interface IDiagnosticsInfo {
  name: string;
  description: string;
  version: string;

  // TODO... more info
}
