import { OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

export interface PluginEnvironment {
  faUrl?: string;
  fsUrl?: string;
  [key: string]: unknown;
}

export interface PluginUser {
  ulogin?: string;
  displayName?: string;
  languageCode?: string;
  [key: string]: unknown;
}

export interface RuntimeConfig {
  assetsPath: string;
  pageLimit: number;
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
  user?: PluginUser;
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
  diagnostics?: AssetFetchDiagnostics;
  errorMessage?: string;
}

export interface AssetFetchDiagnosticEntry {
  step: "getUserDetails" | "getResource" | "getAssets";
  pageNumber?: number;
  requestUrl: string;
  status: number;
  statusText: string;
  responseBodyPreview: string;
}

export interface AssetFetchDiagnostics {
  userLogin: string;
  mainResourceId?: string;
  operatingOrganizationCode?: string;
  assetsPath: string;
  requests: AssetFetchDiagnosticEntry[];
}

export interface TableRow extends Record<string, string> {
  rowId: string;
}

export interface TableColumn {
  field: string;
  headerText: string;
  weight: number;
}

export interface AssetInitLifecycleMessage extends OFSMessage {
  securedData?: Record<string, unknown>;
  environment?: PluginEnvironment;
  provider?: Record<string, unknown>;
  activity?: Record<string, unknown>;
  user?: PluginUser;
  openParams?: Record<string, unknown> | string;
}

export interface AssetInitOpenMessage extends OFSOpenMessage {
  securedData?: Record<string, unknown>;
  environment?: PluginEnvironment;
  activity?: Record<string, unknown>;
  user?: PluginUser;
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

export interface AssetPageResponse {
  count?: number;
  hasMore?: boolean;
  limit?: number;
  offset?: number;
  items?: unknown[];
  [key: string]: unknown;
}
