/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as ko from "knockout";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "oj-c/button";
import "oj-c/progress-circle";
import "oj-c/table";
import {
  OFSCallProcedureResultMessage,
  OFSMessage,
  OFSPlugin,
} from "@ofs-users/plugin";
import {
  buildCacheKey,
  parseRuntimeConfig,
  resolveRuntimeConfig,
} from "./asset-init-loading/config";
import { AssetInitLoadingService } from "./asset-init-loading/service";
import {
  AssetFetchDiagnosticEntry,
  AssetInitLifecycleMessage,
  AssetInitOpenMessage,
  CachedDataset,
  PersistedPluginState,
  PluginEnvironment,
  RuntimeConfig,
  TableRow,
  TokenProcedureResult,
} from "./asset-init-loading/types";

const STORAGE_KEYS = {
  state: "assetInitLoadingPlugin_state",
  cachePrefix: "assetInitLoadingPlugin_cache_",
};

const DEFAULT_WAKEUP_DELAY = 15;

function hasObjectKeys(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && Object.keys(value as Record<string, unknown>).length > 0;
}

function preferIncomingValue<T>(incoming: T | undefined, existing: T | undefined): T | undefined {
  if (incoming === undefined || incoming === null) {
    return existing;
  }

  if (typeof incoming === "string") {
    return incoming.trim() ? incoming : existing;
  }

  if (typeof incoming === "object") {
    if (Array.isArray(incoming)) {
      return incoming.length > 0 ? incoming : existing;
    }

    return hasObjectKeys(incoming) ? incoming : existing;
  }

  return incoming;
}

class RootViewModel extends OFSPlugin {
  appName = ko.observable("Asset Init Loading");
  statusMessage = ko.observable("Waiting for the plugin to initialize.");
  errorMessage = ko.observable("");
  loading = ko.observable(false);
  searchQuery = ko.observable("");
  providerLabel = ko.observable("No user context");
  endpointText = ko.observable("Assets endpoint not resolved yet.");
  totalRowsCount = ko.observable(0);
  visibleRowsCount = ko.observable(0);
  cacheTimestamp = ko.observable("No cached data yet.");
  diagnosticsRequestUrl = ko.observable("No request captured yet.");
  diagnosticsResponseText = ko.observable("No response captured yet.");
  diagnosticsResolvedQuery = ko.observable("No resolved context captured yet.");
  diagnosticsSecuredData = ko.observable("No securedData captured yet.");
  rows = ko.observableArray<TableRow>([]);
  filteredRows = ko.observableArray<TableRow>([]);
  columnsByKey = ko.observable<Record<string, { field: string; headerText: string; weight: number }>>({});
  columnOrder = ko.observable<string[]>([]);

  rowsDataProvider = ko.observable(
    new ArrayDataProvider([] as TableRow[], {
      keyAttributes: "rowId",
    })
  );

  subtitleText: ko.PureComputed<string>;
  resultSummaryText: ko.PureComputed<string>;
  hasRows: ko.PureComputed<boolean>;

  closePlugin: () => void;
  refreshNow: () => void;
  clearSearch: () => void;

  private currentConfig: RuntimeConfig | null = null;
  private currentState: PersistedPluginState = {};
  private currentEnvironment: PluginEnvironment | null = null;
  private activeCacheKey: string | null = null;
  private tokenCallId: string | null = null;
  private pendingTokenResolve: ((token: string) => void) | null = null;
  private pendingTokenReject: ((error: Error) => void) | null = null;

  constructor() {
    super("assetInitLoadingPlugin");

    this.subtitleText = ko.pureComputed(() => {
      if (this.errorMessage()) {
        return this.errorMessage();
      }
      return this.statusMessage();
    });

    this.resultSummaryText = ko.pureComputed(() => {
      const total = this.totalRowsCount();
      const visible = this.visibleRowsCount();

      if (total === 0) {
        return "No cached asset rows are available yet.";
      }
      if (visible === total) {
        return `Showing all ${total} cached asset rows.`;
      }

      return `Showing ${visible} of ${total} cached asset rows.`;
    });

    this.hasRows = ko.pureComputed(() => this.filteredRows().length > 0);

    this.closePlugin = () => this.close();
    this.refreshNow = () => {
      void this.refreshDataset("open");
    };
    this.clearSearch = () => {
      this.searchQuery("");
      this.applyFilter();
    };

    this.searchQuery.subscribe(() => this.applyFilter());
  }

  private log(...args: unknown[]): void {
    if (!this.currentConfig?.enableLogging) {
      return;
    }
    console.log("[assetInitLoadingPlugin]", ...args);
  }

  private info(...args: unknown[]): void {
    console.info("[assetInitLoadingPlugin]", ...args);
  }

  private warn(...args: unknown[]): void {
    console.warn("[assetInitLoadingPlugin]", ...args);
  }

  private persistState(state: PersistedPluginState): void {
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
  }

  private loadState(): PersistedPluginState {
    const rawValue = localStorage.getItem(STORAGE_KEYS.state);
    if (!rawValue) {
      return {};
    }

    try {
      return JSON.parse(rawValue) as PersistedPluginState;
    } catch {
      return {};
    }
  }

  private saveDataset(dataset: CachedDataset): void {
    localStorage.setItem(
      `${STORAGE_KEYS.cachePrefix}${dataset.cacheKey}`,
      JSON.stringify(dataset)
    );
  }

  private loadDataset(cacheKey: string): CachedDataset | null {
    const rawValue = localStorage.getItem(`${STORAGE_KEYS.cachePrefix}${cacheKey}`);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as CachedDataset;
    } catch {
      return null;
    }
  }

  private deriveScopeFromFsUrl(fsUrl: string): string {
    try {
      const hostname = new URL(fsUrl).hostname;
      const [scope] = hostname.split(".");
      return scope || "";
    } catch {
      return "";
    }
  }

  private getWakeupDelay(rawValue: unknown): number {
    const parsed = Number.parseInt(String(rawValue || ""), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WAKEUP_DELAY;
  }

  private getCurrentUserLogin(): string {
    const rawValue = this.currentState.user?.ulogin;
    return typeof rawValue === "string" ? rawValue.trim() : "";
  }

  private getIdentityLabel(): string {
    const userLogin = this.getCurrentUserLogin();
    const provider = this.currentState.provider || {};
    const providerName =
      typeof provider.pname === "string"
        ? provider.pname
        : typeof provider.pid === "string"
          ? provider.pid
          : "";

    if (userLogin && providerName) {
      return `${userLogin} / ${providerName}`;
    }

    return userLogin || providerName || "No user context";
  }

  private describeResolvedContext(config: RuntimeConfig, dataset?: CachedDataset): string {
    return JSON.stringify(
      {
        assetsPath: dataset?.diagnostics?.assetsPath || config.assetsPath,
        userLogin: dataset?.diagnostics?.userLogin || this.getCurrentUserLogin(),
        mainResourceId: dataset?.diagnostics?.mainResourceId || "",
        operatingOrganizationCode:
          dataset?.diagnostics?.operatingOrganizationCode || "",
        faUrl: this.currentState.environment?.faUrl || "",
        fsUrl: this.currentState.environment?.fsUrl || "",
      },
      null,
      2
    );
  }

  private mergeState(
    message: AssetInitLifecycleMessage | AssetInitOpenMessage
  ): PersistedPluginState {
    const existingState = this.loadState();
    const mergedSecuredData = preferIncomingValue(
      message.securedData,
      existingState.securedData
    );
    const nextState: PersistedPluginState = {
      runtimeConfig: parseRuntimeConfig(mergedSecuredData),
      environment: preferIncomingValue(message.environment, existingState.environment),
      provider: preferIncomingValue(message.provider, existingState.provider),
      activity: preferIncomingValue(message.activity, existingState.activity),
      user: preferIncomingValue(message.user, existingState.user),
      openParams: preferIncomingValue(message.openParams, existingState.openParams),
      securedData: mergedSecuredData,
    };
    this.persistState(nextState);
    this.currentState = nextState;
    this.diagnosticsSecuredData(JSON.stringify(nextState.securedData || {}, null, 2));
    this.info("Merged plugin state", {
      securedDataKeys: Object.keys(nextState.securedData || {}),
      hasRuntimeConfig: Boolean(nextState.runtimeConfig),
      userLogin: nextState.user?.ulogin || "",
      environment: nextState.environment,
    });
    return nextState;
  }

  async init(message: AssetInitLifecycleMessage): Promise<OFSMessage> {
    const state = this.mergeState(message);
    this.currentConfig = state.runtimeConfig || parseRuntimeConfig(state.securedData);
    this.info("INIT received", {
      hasRuntimeConfig: Boolean(this.currentConfig),
      userLogin: state.user?.ulogin || "",
      environment: state.environment,
    });

    return {
      apiVersion: 1,
      method: "initEnd",
      wakeupNeeded: true,
      wakeOnEvents: {
        timer: {
          wakeupDelay: this.getWakeupDelay(state.securedData?.WAKEUP_DELAY),
        },
      },
    } as OFSMessage;
  }

  open(data: AssetInitOpenMessage): void {
    const state = this.mergeState(data);
    this.currentConfig = state.runtimeConfig || parseRuntimeConfig(state.securedData);
    this.currentEnvironment = state.environment || null;
    this.providerLabel(this.getIdentityLabel());

    const resolvedConfig = resolveRuntimeConfig(this.currentConfig, state);
    this.activeCacheKey = buildCacheKey(resolvedConfig, state);
    this.appName(resolvedConfig.title);
    this.endpointText(resolvedConfig.assetsPath);
    this.errorMessage("");
    this.statusMessage(resolvedConfig.subtitle);
    this.diagnosticsResolvedQuery(this.describeResolvedContext(resolvedConfig));
    this.renderCachedDataset();
  }

  async wakeup(message: AssetInitLifecycleMessage): Promise<void> {
    const state = this.mergeState(message);
    this.currentConfig = state.runtimeConfig || parseRuntimeConfig(state.securedData);
    this.currentEnvironment = state.environment || null;

    try {
      await this.refreshDataset("wakeup");
    } finally {
      this.sendSleepMessage(false);
    }
  }

  callProcedureResult(message: OFSCallProcedureResultMessage): void {
    if (message.callId !== this.tokenCallId) {
      this.log("Ignoring unrelated callProcedureResult", message);
      return;
    }

    const result = (message.resultData || {}) as TokenProcedureResult;
    this.tokenCallId = null;

    if (result.status === "success" && result.token) {
      const resolve = this.pendingTokenResolve;
      this.pendingTokenResolve = null;
      this.pendingTokenReject = null;
      resolve?.(result.token);
      return;
    }

    const reject = this.pendingTokenReject;
    this.pendingTokenResolve = null;
    this.pendingTokenReject = null;
    reject?.(
      new Error(result.detail || result.status || "Failed to get scoped access token.")
    );
  }

  error(message: OFSMessage & { callId?: string; reason?: string; description?: string }): void {
    this.loading(false);
    const detail =
      message.description ||
      message.reason ||
      "OFS returned an error while processing the plugin request.";
    this.warn("error message received from OFS", message);

    if (message.callId && message.callId === this.tokenCallId) {
      const reject = this.pendingTokenReject;
      this.pendingTokenResolve = null;
      this.pendingTokenReject = null;
      this.tokenCallId = null;
      reject?.(new Error(detail));
    }

    this.errorMessage(detail);
    this.statusMessage(detail);
  }

  private sendSleepMessage(wakeupNeeded: boolean): void {
    this.sendMessage("sleep" as any, {
      apiVersion: 1,
      method: "sleep",
      wakeupNeeded,
    } as any);
  }

  private renderCachedDataset(): void {
    if (!this.currentConfig) {
      return;
    }

    const resolvedConfig = resolveRuntimeConfig(this.currentConfig, this.currentState);
    this.activeCacheKey = buildCacheKey(resolvedConfig, this.currentState);

    const dataset = this.loadDataset(this.activeCacheKey);
    if (!dataset) {
      this.totalRowsCount(0);
      this.visibleRowsCount(0);
      this.cacheTimestamp("No cached data yet.");
      this.rows([]);
      this.filteredRows([]);
      this.columnsByKey({});
      this.columnOrder([]);
      this.rowsDataProvider(
        new ArrayDataProvider([] as TableRow[], {
          keyAttributes: "rowId",
        })
      );
      this.diagnosticsRequestUrl("No request captured yet.");
      this.diagnosticsResponseText("No response captured yet.");
      this.diagnosticsResolvedQuery(this.describeResolvedContext(resolvedConfig));
      this.appName(resolvedConfig.title);
      this.endpointText(resolvedConfig.assetsPath);
      this.statusMessage(resolvedConfig.emptyStateMessage);
      return;
    }

    const latestRequest = this.getLatestDiagnosticRequest(dataset);
    this.endpointText(latestRequest?.requestUrl || dataset.endpoint);
    this.cacheTimestamp(new Date(dataset.fetchedAt).toLocaleString());
    this.columnsByKey(dataset.columnsByKey);
    this.columnOrder(dataset.columnOrder);
    this.rows(dataset.rows);
    this.totalRowsCount(dataset.rowCount);
    this.appName(resolvedConfig.title);
    this.diagnosticsResolvedQuery(
      this.describeResolvedContext(resolvedConfig, dataset)
    );
    this.diagnosticsRequestUrl(latestRequest?.requestUrl || "No request captured yet.");
    this.diagnosticsResponseText(
      latestRequest?.responseBodyPreview || "No response captured yet."
    );
    this.statusMessage(`Showing cached data refreshed at ${this.cacheTimestamp()}.`);
    this.applyFilter();
  }

  private async refreshDataset(source: "open" | "wakeup"): Promise<void> {
    if (!this.currentConfig) {
      this.currentConfig = parseRuntimeConfig(this.currentState.securedData);
    }

    const environment = this.currentEnvironment || this.currentState.environment;
    const faUrl =
      typeof environment?.faUrl === "string" ? environment.faUrl.trim() : "";
    const fsUrl =
      typeof environment?.fsUrl === "string" ? environment.fsUrl.trim() : "";
    const scope = this.deriveScopeFromFsUrl(fsUrl);
    const userLogin = this.getCurrentUserLogin();

    if (!faUrl) {
      this.handleRefreshError(source, "Missing Fusion URL in environment.faUrl.");
      return;
    }
    if (!fsUrl || !scope) {
      this.handleRefreshError(
        source,
        "Missing OFS environment.fsUrl or could not derive the scope."
      );
      return;
    }
    if (!userLogin) {
      this.handleRefreshError(source, "Missing user.ulogin in the plugin context.");
      return;
    }

    if (source === "open") {
      this.loading(true);
      this.errorMessage("");
      this.statusMessage("Requesting scoped access token...");
    }

    try {
      const resolvedConfig = resolveRuntimeConfig(this.currentConfig, this.currentState);
      this.diagnosticsResolvedQuery(this.describeResolvedContext(resolvedConfig));
      this.info("Resolved runtime config", {
        source,
        assetsPath: resolvedConfig.assetsPath,
        userLogin,
      });

      const token = await this.requestTokenByScope(scope);
      const service = new AssetInitLoadingService(
        faUrl,
        fsUrl,
        token,
        buildCacheKey(resolvedConfig, this.currentState),
        userLogin,
        resolvedConfig,
        (...args: unknown[]) => this.log(...args)
      );
      const dataset = await service.fetchDataset();
      this.saveDataset(dataset);
      this.activeCacheKey = dataset.cacheKey;

      if (source === "open") {
        this.renderCachedDataset();
      }

      this.info("Asset dataset refreshed", {
        source,
        userLogin,
        rows: dataset.rowCount,
        endpoint: dataset.endpoint,
        operatingOrganizationCode:
          dataset.diagnostics?.operatingOrganizationCode || "",
        lastRequestUrl: this.getLatestDiagnosticRequest(dataset)?.requestUrl || "",
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.handleRefreshError(source, detail);
    } finally {
      if (source === "open") {
        this.loading(false);
      }
    }
  }

  private handleRefreshError(source: "open" | "wakeup", message: string): Error {
    this.warn(`Asset refresh failed during ${source}`, message);
    if (source === "open") {
      this.errorMessage(message);
      this.statusMessage(message);
    }
    return new Error(message);
  }

  private requestTokenByScope(scope: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.pendingTokenResolve = resolve;
      this.pendingTokenReject = reject;
      this.tokenCallId = this.getAccessTokenByScope(scope);
      this.info("Requested scoped access token", {
        callId: this.tokenCallId,
        scope,
      });
    });
  }

  private getLatestDiagnosticRequest(
    dataset: CachedDataset
  ): AssetFetchDiagnosticEntry | null {
    const requests = dataset.diagnostics?.requests || [];
    return requests.length > 0 ? requests[requests.length - 1] : null;
  }

  private applyFilter(): void {
    const query = this.searchQuery().trim().toLowerCase();
    const filtered = this.rows().filter((row) => {
      if (!query) {
        return true;
      }

      return Object.values(row).join(" ").toLowerCase().includes(query);
    });

    this.filteredRows(filtered);
    this.visibleRowsCount(filtered.length);
    this.rowsDataProvider(
      new ArrayDataProvider(filtered, {
        keyAttributes: "rowId",
      })
    );
  }
}

export default new RootViewModel();
