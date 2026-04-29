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
import { StockingLocationsService } from "./stocking-locations/service";
import {
  StockingLocationRow,
  StockingLocationsOpenMessage,
  TokenProcedureResult,
} from "./stocking-locations/types";

interface PluginConfig {
  faUrl: string;
  fsUrl: string;
  scope: string;
  enableLogging: boolean;
}

class RootViewModel extends OFSPlugin {
  appName = ko.observable("Service Logistics Stocking Locations");
  statusMessage = ko.observable("Waiting for the plugin to open.");
  errorMessage = ko.observable("");
  loading = ko.observable(false);
  searchQuery = ko.observable("");
  providerLabel = ko.observable("All technicians");
  endpointText = ko.observable("Endpoint not initialized yet.");
  totalLocationsCount = ko.observable(0);
  visibleLocationsCount = ko.observable(0);
  locations = ko.observableArray<StockingLocationRow>([]);
  filteredLocations = ko.observableArray<StockingLocationRow>([]);

  locationsDataProvider = ko.observable(
    new ArrayDataProvider([] as StockingLocationRow[], {
      keyAttributes: "techSubinventoryId",
    })
  );

  subtitleText: ko.PureComputed<string>;
  resultSummaryText: ko.PureComputed<string>;
  hasLocations: ko.PureComputed<boolean>;

  locationColumnsByKey: Record<string, { field: string; headerText: string; weight: number }>;
  locationColumnOrder: string[];

  closePlugin: () => void;
  refreshLocations: () => void;
  clearSearch: () => void;

  private currentConfig: PluginConfig | null = null;
  private openData: StockingLocationsOpenMessage | null = null;
  private tokenCallId: string | null = null;

  constructor() {
    super("stockingLocationsPlugin");

    this.locationColumnsByKey = {
      stockLocationName: { field: "stockLocationName", headerText: "Stock location", weight: 4 },
      subinventory: { field: "subinventory", headerText: "Subinventory", weight: 3 },
      organizationCode: { field: "organizationCode", headerText: "Org code", weight: 2 },
      technicianLabel: { field: "technicianLabel", headerText: "Technician", weight: 3 },
      defaultFlag: { field: "defaultFlag", headerText: "Default", weight: 1 },
      enabledFlag: { field: "enabledFlag", headerText: "Enabled", weight: 1 },
      allowPartsOrdersFlag: { field: "allowPartsOrdersFlag", headerText: "Parts orders", weight: 2 },
    };
    this.locationColumnOrder = [
      "stockLocationName",
      "subinventory",
      "organizationCode",
      "technicianLabel",
      "defaultFlag",
      "enabledFlag",
      "allowPartsOrdersFlag",
    ];

    this.subtitleText = ko.pureComputed(() => {
      if (this.errorMessage()) {
        return this.errorMessage();
      }
      return this.statusMessage();
    });
    this.resultSummaryText = ko.pureComputed(() => {
      const total = this.totalLocationsCount();
      const visible = this.visibleLocationsCount();

      if (total === 0) {
        return "No technician subinventories loaded yet.";
      }
      if (visible === total) {
        return `Showing all ${total} locations.`;
      }

      return `Showing ${visible} of ${total} loaded locations.`;
    });
    this.hasLocations = ko.pureComputed(() => this.filteredLocations().length > 0);

    this.closePlugin = () => this.close();
    this.refreshLocations = () => {
      void this.requestLocationsRefresh();
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
    console.log("[stockingLocationsPlugin]", ...args);
  }

  private info(...args: unknown[]): void {
    console.info("[stockingLocationsPlugin]", ...args);
  }

  private warn(...args: unknown[]): void {
    console.warn("[stockingLocationsPlugin]", ...args);
  }

  private fail(message: string, detail?: unknown): void {
    this.errorMessage(message);
    this.statusMessage(message);
    console.error("[stockingLocationsPlugin]", message, detail);
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

  async init(message: OFSMessage): Promise<OFSMessage> {
    this.info("INIT received", message);
    return {
      apiVersion: 1,
      method: "initEnd",
    };
  }

  open(data: StockingLocationsOpenMessage): void {
    this.openData = data;
    this.currentConfig = this.buildConfig(data);
    this.providerLabel(data.provider?.pname || data.provider?.pid || "All technicians");

    this.log("Received open message", data);
    this.info("OPEN received", {
      provider: data.provider,
      faUrl: this.currentConfig.faUrl,
      fsUrl: this.currentConfig.fsUrl,
      scopeConfigured: Boolean(this.currentConfig.scope),
      securedDataKeys: Object.keys(data.securedData || {}),
      environment: data.environment,
    });

    void this.requestLocationsRefresh();
  }

  callProcedureResult(message: OFSCallProcedureResultMessage): void {
    this.info("callProcedureResult received", {
      callId: message.callId,
      tokenCallId: this.tokenCallId,
      resultData: message.resultData,
    });

    const callId = message.callId;

    if (callId === this.tokenCallId) {
      void this.handleTokenResult(message);
    } else {
      this.log("Ignoring unrelated callProcedureResult", message);
    }
  }

  error(message: OFSMessage & { callId?: string; reason?: string; description?: string }): void {
    this.loading(false);
    this.warn("error message received from OFS", message);
    this.fail(
      message.description ||
        message.reason ||
        "OFS returned an error while processing the plugin request.",
      message
    );
  }

  private buildConfig(data: StockingLocationsOpenMessage): PluginConfig {
    const scope = this.deriveScopeFromFsUrl(data.environment?.fsUrl || "");

    return {
      faUrl: data.environment?.faUrl || "",
      fsUrl: data.environment?.fsUrl || "",
      scope,
      enableLogging: String(data.securedData?.enableLogging || "").toLowerCase() === "true",
    };
  }

  private async requestLocationsRefresh(): Promise<void> {
    if (!this.currentConfig) {
      return;
    }

    if (!this.currentConfig.faUrl) {
      this.fail("Missing Fusion URL in openData.environment.faUrl.");
      return;
    }
    if (!this.currentConfig.fsUrl) {
      this.fail("Missing OFS URL in openData.environment.fsUrl.");
      return;
    }
    if (!this.currentConfig.scope) {
      this.fail("Could not derive scope from openData.environment.fsUrl.", {
        fsUrl: this.currentConfig.fsUrl,
      });
      return;
    }
    this.errorMessage("");
    this.loading(true);
    this.statusMessage("Requesting Fusion access token...");
    this.endpointText(`${this.currentConfig.faUrl.replace(/\/+$/, "")}/fscmRestApi/resources/11.13.18.05/technicianSubinventories`);
    await this.requestTokenByScope();
  }

  private async requestTokenByScope(): Promise<void> {
    const scope = this.currentConfig?.scope || "";

    this.info("Requesting token by scope", {
      faUrl: this.currentConfig?.faUrl,
      fsUrl: this.currentConfig?.fsUrl,
      scope,
      scopeSource: "environment.fsUrl",
    });

    this.tokenCallId = this.getAccessTokenByScope(scope);
    this.info("getAccessTokenByScope requested", {
      callId: this.tokenCallId,
    });
  }

  private async handleTokenResult(message: OFSCallProcedureResultMessage): Promise<void> {
    this.tokenCallId = null;
    this.info("Processing token result");

    const result = (message.resultData || {}) as TokenProcedureResult;

    if (result.status !== "success" || !result.token) {
      this.loading(false);
      this.fail(result.detail || result.status || "Failed to get access token.", result);
      return;
    }

    this.info("Token received successfully", {
      tokenLength: result.token.length,
    });

    await this.loadLocations(result.token);
  }

  private async loadLocations(token: string): Promise<void> {
    if (!this.currentConfig) {
      return;
    }

    try {
      this.statusMessage("Loading technician stocking locations...");
      this.info("Loading technician stocking locations from Fusion", {
        faUrl: this.currentConfig.faUrl,
      });
      const service = new StockingLocationsService(
        this.currentConfig.faUrl,
        token,
        (...args: unknown[]) => this.log(...args)
      );

      const locations = await service.fetchAllLocations();
      this.locations(locations);
      this.totalLocationsCount(locations.length);
      this.statusMessage(`Loaded ${locations.length} technician stocking locations.`);
      this.info("Stocking locations loaded", {
        totalLocations: locations.length,
      });
      this.applyFilter();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.fail("Failed to load technician stocking locations.", {
        message,
        error,
      });
    } finally {
      this.loading(false);
    }
  }

  private applyFilter(): void {
    const query = this.searchQuery().trim().toLowerCase();
    const filtered = this.locations().filter((location) => {
      if (!query) {
        return true;
      }

      return [
        location.stockLocationName,
        location.subinventory,
        location.organizationCode,
        location.organizationName,
        location.technicianLabel,
        location.partyId,
        location.defaultFlag,
        location.enabledFlag,
        location.allowPartsOrdersFlag,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    this.filteredLocations(filtered);
    this.visibleLocationsCount(filtered.length);
    this.locationsDataProvider(
      new ArrayDataProvider(filtered, {
        keyAttributes: "techSubinventoryId",
      })
    );
  }
}

export default new RootViewModel();
