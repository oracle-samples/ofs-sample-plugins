import { OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

export interface PluginEnvironment {
  faUrl?: string;
  fsUrl?: string;
  [key: string]: unknown;
}

export interface RuntimeConfig {
  fusionPath: string;
  queryParams: Record<string, string>;
  pageLimit: number;
  itemsPath?: string;
  title: string;
  subtitle: string;
  emptyStateMessage: string;
  enableLogging: boolean;
}

export interface PersistedPluginState {
  runtimeConfig?: RuntimeConfig;
  environment?: PluginEnvironment;
  provider?: Record<string, unknown>;
  activity?: Record<string, unknown>;
  openParams?: Record<string, unknown> | string;
  securedData?: Record<string, unknown>;
}

export interface CachedDataset {
  cacheKey: string;
  fetchedAt: string;
  endpoint: string;
  rowCount: number;
  rows: TableRow[];
  columnOrder: string[];
  columnsByKey: Record<string, TableColumn>;
  diagnostics?: FusionFetchDiagnostics;
  errorMessage?: string;
}

export interface FusionFetchDiagnosticEntry {
  pageNumber: number;
  requestUrl: string;
  status: number;
  statusText: string;
  responseBodyPreview: string;
}

export interface FusionFetchDiagnostics {
  resolvedFusionPath: string;
  resolvedQueryParams: Record<string, string>;
  requests: FusionFetchDiagnosticEntry[];
}

export interface TableRow extends Record<string, string> {
  rowId: string;
}

export interface TableColumn {
  field: string;
  headerText: string;
  weight: number;
}

export interface FusionInitLifecycleMessage extends OFSMessage {
  securedData?: Record<string, unknown>;
  environment?: PluginEnvironment;
  provider?: Record<string, unknown>;
  activity?: Record<string, unknown>;
  openParams?: Record<string, unknown> | string;
}

export interface FusionInitOpenMessage extends OFSOpenMessage {
  securedData?: Record<string, unknown>;
  environment?: PluginEnvironment;
  activity?: Record<string, unknown>;
  openParams?: Record<string, unknown> | string;
  provider?: {
    pid?: string;
    pname?: string;
    [key: string]: unknown;
  };
}

export interface TokenProcedureResult {
  token?: string;
  status?: string;
  detail?: string;
}

export interface FusionPageResponse {
  count?: number;
  hasMore?: boolean;
  limit?: number;
  offset?: number;
  items?: unknown[];
  [key: string]: unknown;
}
