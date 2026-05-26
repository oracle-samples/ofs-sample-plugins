/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import {
    OFSPlugin,
    OFSMessage,
    OFSOpenMessage,
    OFSCallProcedureResultMessage,
} from "@ofs-users/plugin";
import { OFS } from "@ofs-users/proxy";

// Storage keys
const STORAGE_KEYS = {
    ENVIRONMENT: "initDataLoading_environment",
    SECURED_DATA: "initDataLoading_securedData",
    BUCKET_DATA: "initDataLoading_bucketData",
};

// Interfaces
interface PluginEnvironment {
    environmentName?: string;
    fsUrl?: string;
    faUrl?: string;
    [key: string]: unknown;
}

interface DataToRetrieveConfig {
    bucket_name: string;
    properties_to_fetch: string[];
}

interface BucketPropertyData {
    propertyName: string;
    value: string | null;
    error?: string;
}

interface StoredBucketData {
    bucketName: string;
    retrievedAt: string;
    properties: BucketPropertyData[];
}

interface OFSInitMessage extends OFSMessage {
    environment?: PluginEnvironment;
    securedData: any;
}

interface OFSWakeupMessage extends OFSMessage {
    environment?: PluginEnvironment;
    securedData?: any;
}

interface TokenProcedureResult {
    token?: string;
    status?: string;
    detail?: string;
}

export class CustomPlugin extends OFSPlugin {
    private customProxy: OFS | null = null;
    private securedData: any = {};
    private proxyResolve: ((value: OFS | null) => void) | null = null;
    private proxyCallId: string | null = null;
    private baseURL: string | null = null;

    constructor(tag?: string) {
        super(tag || "InitDataLoading");
    }

    private log(
        level: "debug" | "log" | "warn" | "error",
        message: string
    ): void {
        const timestamp = new Date().toLocaleTimeString();
        const formatted = `${this.tag} [${timestamp}]: ${message}`;
        console[level](formatted);
    }

    // Storage helpers
    private storeData(key: string, data: any): void {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            this.log("debug", `Stored data for key: ${key}`);
        } catch (error) {
            this.log("error", `Failed to store data for key ${key}: ${error}`);
        }
    }

    private getData<T>(key: string): T | null {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            this.log("error", `Failed to get data for key ${key}: ${error}`);
            return null;
        }
    }

    // Parse DATA_TO_RETRIEVE configuration
    private parseDataToRetrieveConfig(): DataToRetrieveConfig[] {
        try {
            const configStr = this.securedData?.DATA_TO_RETRIEVE;
            if (!configStr) {
                this.log("warn", "DATA_TO_RETRIEVE not found in securedData");
                return [];
            }
            const config = JSON.parse(configStr);
            this.log(
                "debug",
                `Parsed DATA_TO_RETRIEVE: ${JSON.stringify(config)}`
            );
            return config;
        } catch (error) {
            this.log("error", `Failed to parse DATA_TO_RETRIEVE: ${error}`);
            return [];
        }
    }

    // Get wakeup delay from config
    private getWakeupDelay(): number {
        const delay = parseInt(this.securedData?.WAKEUP_DELAY) || 30;
        return delay;
    }

    private buildFusionAccessTokenScope(
        environment: PluginEnvironment | null | undefined
    ): string {
        const environmentName =
            typeof environment?.environmentName === "string"
                ? environment.environmentName.trim().toLowerCase()
                : "";

        return environmentName
            ? `urn:opc:resource:fusion:${environmentName}:field-service-common/use`
            : "";
    }

    private resolveEnvironment(
        incomingEnvironment?: PluginEnvironment
    ): PluginEnvironment | null {
        const storedEnvironment = this.getData<PluginEnvironment>(
            STORAGE_KEYS.ENVIRONMENT
        );

        const environment = {
            ...(storedEnvironment || {}),
            ...(incomingEnvironment || {}),
        };

        return Object.keys(environment).length > 0 ? environment : null;
    }

    // Create proxy using a Fusion scoped token from the OFS plugin API.
    private async createProxy(
        environment?: PluginEnvironment
    ): Promise<OFS | null> {
        const resolvedEnvironment = this.resolveEnvironment(environment);
        const scope = this.buildFusionAccessTokenScope(resolvedEnvironment);
        const fsUrl =
            typeof resolvedEnvironment?.fsUrl === "string"
                ? resolvedEnvironment.fsUrl.trim()
                : "";

        if (!scope) {
            this.log(
                "error",
                "Cannot create proxy: missing environment.environmentName for scoped token"
            );
            return null;
        }

        if (!fsUrl) {
            this.log(
                "error",
                "Cannot create proxy: missing environment.fsUrl for OFS proxy base URL"
            );
            return null;
        }

        this.baseURL = fsUrl;

        return new Promise((resolve) => {
            this.proxyResolve = resolve;
            this.proxyCallId = this.getAccessTokenByScope(scope);

            this.log(
                "debug",
                `Requesting scoped token for ${scope}, callId: ${this.proxyCallId}`
            );

            // Timeout after 10 seconds
            setTimeout(() => {
                if (this.proxyResolve) {
                    this.log("warn", "Scoped proxy creation timed out");
                    this.proxyResolve(null);
                    this.proxyResolve = null;
                    this.proxyCallId = null;
                }
            }, 10000);
        });
    }

    // Handle callProcedureResult for scoped proxy creation.
    callProcedureResult(message: OFSCallProcedureResultMessage): void {
        this.log("debug", `callProcedureResult: ${JSON.stringify(message)}`);

        // Check if this response matches our callId
        if ((message as any).callId !== this.proxyCallId) {
            this.log("debug", "CallId mismatch, ignoring response");
            return;
        }

        if (!this.proxyResolve) {
            this.log("warn", "No pending proxy resolve, ignoring response");
            return;
        }

        const resultData = (message.resultData || {}) as TokenProcedureResult;

        if (resultData?.status === "success" && resultData?.token) {
            try {
                this.customProxy = new OFS({
                    baseURL: this.baseURL!,
                    token: resultData.token,
                });
                this.log("log", "Proxy created successfully");
                this.proxyResolve(this.customProxy);
            } catch (error) {
                this.log("error", `Failed to create proxy: ${error}`);
                this.proxyResolve(null);
            }
        } else {
            this.log(
                "error",
                `Scoped token request failed: ${JSON.stringify(resultData)}`
            );
            this.proxyResolve(null);
        }

        this.proxyResolve = null;
        this.proxyCallId = null;
    }

    // Retrieve bucket (resource) data using proxy.getResource
    private async retrieveBucketData(
        config: DataToRetrieveConfig
    ): Promise<StoredBucketData> {
        const result: StoredBucketData = {
            bucketName: config.bucket_name,
            retrievedAt: new Date().toISOString(),
            properties: [],
        };

        if (!this.customProxy) {
            this.log("error", "No proxy available for bucket data retrieval");
            return result;
        }

        try {
            this.log(
                "debug",
                `Retrieving resource "${
                    config.bucket_name
                }" with properties: ${config.properties_to_fetch.join(", ")}`
            );

            // Get specific resource by resourceId using proxy.getResource
            const response = await this.customProxy.getResource(config.bucket_name);

            this.log(
                "debug",
                `getResource response: ${JSON.stringify(response)}`
            );

            // Check if resource was found (status >= 400 indicates error)
            if (!response || response.status >= 400) {
                const errorMsg = response?.description || `Bucket "${config.bucket_name}" not found`;
                this.log("warn", errorMsg);
                for (const propName of config.properties_to_fetch) {
                    result.properties.push({
                        propertyName: propName,
                        value: null,
                        error: errorMsg,
                    });
                }
                return result;
            }

            const resourceData = response.data;

            // Extract properties from the bucket resource
            for (const propName of config.properties_to_fetch) {
                const propData: BucketPropertyData = {
                    propertyName: propName,
                    value: null,
                };

                if (propName in resourceData) {
                    propData.value = String((resourceData as any)[propName]);
                    this.log(
                        "log",
                        `Retrieved property "${propName}": ${propData.value}`
                    );
                } else {
                    propData.error = `Property "${propName}" not found on resource`;
                    this.log(
                        "warn",
                        `Property "${propName}" not found on bucket "${config.bucket_name}"`
                    );
                }

                result.properties.push(propData);
            }
        } catch (error: any) {
            this.log(
                "error",
                `Failed to retrieve bucket data: ${error.message || error}`
            );
            for (const propName of config.properties_to_fetch) {
                result.properties.push({
                    propertyName: propName,
                    value: null,
                    error: error.message || String(error),
                });
            }
        }

        return result;
    }

    // INIT - Called when plugin is first loaded
    async init(message: OFSInitMessage): Promise<OFSMessage> {
        this.log("log", "INIT called");
        this.log("debug", `Init message: ${JSON.stringify(message)}`);

        // Store environment and securedData for later use in wakeup
        if (message.environment) {
            this.storeData(STORAGE_KEYS.ENVIRONMENT, message.environment);
        }
        if (message.securedData) {
            this.storeData(STORAGE_KEYS.SECURED_DATA, message.securedData);
            this.securedData = message.securedData;
        }

        const wakeupDelay = this.getWakeupDelay();
        this.log("log", `Requesting wakeup in ${wakeupDelay} seconds`);

        // Create initEnd message with wakeup configuration
        // The base class will handle sending this message
        const initEndMessage: OFSMessage = {
            apiVersion: 1,
            method: "initEnd",
            wakeupNeeded: true,
            wakeOnEvents: {
                timer: {
                    wakeupDelay: wakeupDelay,
                },
            },
        } as OFSMessage;

        this.log("debug", `Returning initEnd: ${JSON.stringify(initEndMessage)}`);

        // Return the message - base class handles sending it
        return Promise.resolve(initEndMessage);
    }

    // Ensure scoped proxy is available for wakeup API calls.
    private async ensureProxy(message?: { environment?: PluginEnvironment }): Promise<boolean> {
        // If customProxy already exists, we're good
        if (this.customProxy) {
            this.log("debug", "customProxy already available");
            return true;
        }

        // Need to create proxy manually
        this.log("debug", "No scoped proxy available, creating one");
        this.customProxy = await this.createProxy(message?.environment);
        return this.customProxy !== null;
    }

    // WAKEUP - Called after wakeupDelay seconds
    async wakeup(message: OFSWakeupMessage): Promise<void> {
        this.log("log", "WAKEUP called - Starting bucket data retrieval");
        this.log("debug", `Wakeup message: ${JSON.stringify(message)}`);

        if (message.environment) {
            this.storeData(STORAGE_KEYS.ENVIRONMENT, message.environment);
        }

        // Restore securedData from storage if not in message
        this.securedData =
            message.securedData ||
            this.getData(STORAGE_KEYS.SECURED_DATA) ||
            {};

        // Parse configuration
        const configs = this.parseDataToRetrieveConfig();
        if (configs.length === 0) {
            this.log("warn", "No bucket configurations found, going to sleep");
            this.sendSleepMessage(false);
            return;
        }

        // Ensure proxy is available for API calls
        const proxyReady = await this.ensureProxy(message);
        if (!proxyReady) {
            this.log(
                "error",
                "Failed to create proxy, going to sleep without data"
            );
            this.sendSleepMessage(false);
            return;
        }

        // Retrieve data from all configured buckets
        const allBucketData: StoredBucketData[] = [];
        for (const config of configs) {
            const bucketData = await this.retrieveBucketData(config);
            allBucketData.push(bucketData);
        }

        // Store retrieved data in localStorage
        this.storeData(STORAGE_KEYS.BUCKET_DATA, allBucketData);
        this.log(
            "log",
            `Stored bucket data: ${allBucketData.length} bucket(s)`
        );

        // Go to sleep - no more wakeups needed after successful retrieval
        this.sendSleepMessage(false);
    }

    // Send sleep message
    private sendSleepMessage(wakeupNeeded: boolean): void {
        const sleepMessage: any = {
            apiVersion: 1,
            method: "sleep",
            wakeupNeeded: wakeupNeeded,
        };

        if (wakeupNeeded) {
            const wakeupDelay = this.getWakeupDelay();
            sleepMessage.wakeOnEvents = {
                timer: {
                    wakeupDelay: wakeupDelay,
                },
            };
        }

        this.log(
            "debug",
            `Sending sleep message: wakeupNeeded=${wakeupNeeded}`
        );
        this.sendMessage("sleep" as any, sleepMessage);
    }

    // Handle errors from OFS framework
    error(message: any): void {
        this.log("error", `OFS error: ${JSON.stringify(message)}`);

        // Handle offline errors for proxy creation
        if (this.proxyResolve) {
            this.proxyResolve(null);
            this.proxyResolve = null;
            this.proxyCallId = null;
        }
    }

    // OPEN - Called when user opens the plugin
    open(data: OFSOpenMessage): void {
        this.log("log", "OPEN called - Displaying stored data");
        this.log("debug", `Open data: ${JSON.stringify(data)}`);

        // Restore securedData
        this.securedData =
            (data as any).securedData ||
            this.getData(STORAGE_KEYS.SECURED_DATA) ||
            {};

        if ((data as any).environment) {
            this.storeData(STORAGE_KEYS.ENVIRONMENT, (data as any).environment);
        }

        // Retrieve stored bucket data
        const storedData = this.getData<StoredBucketData[]>(
            STORAGE_KEYS.BUCKET_DATA
        );

        // Update UI
        this.displayBucketData(storedData);

        // Setup button handlers
        this.setupButtonHandlers();
    }

    // Setup button click handlers
    private setupButtonHandlers(): void {
        const cancelBtn = document.getElementById("cancel_button");
        const submitBtn = document.getElementById("submit_button");

        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                this.log("debug", "Cancel button clicked");
                this.close();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener("click", () => {
                this.log("debug", "Submit button clicked");
                this.close();
            });
        }
    }

    // Display bucket data in the UI
    private displayBucketData(data: StoredBucketData[] | null): void {
        const container = document.getElementById("bucket-data-container");
        if (!container) {
            this.log("error", "bucket-data-container element not found");
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <strong>No data available yet.</strong><br>
                    Data will be retrieved during the next initialization cycle.
                </div>
            `;
            return;
        }

        let html = "";
        for (const bucket of data) {
            html += `
                <div class="card mb-3">
                    <div class="card-header">
                        <strong>Bucket:</strong> ${this.escapeHtml(
                            bucket.bucketName
                        )}
                        <br><small class="text-muted">Retrieved: ${new Date(
                            bucket.retrievedAt
                        ).toLocaleString()}</small>
                    </div>
                    <div class="card-body">
            `;

            for (const prop of bucket.properties) {
                if (prop.error) {
                    html += `
                        <div class="alert alert-danger mb-2">
                            <strong>${this.escapeHtml(
                                prop.propertyName
                            )}</strong>: Error - ${this.escapeHtml(prop.error)}
                        </div>
                    `;
                } else {
                    html += `
                        <div class="mb-2">
                            <strong>${this.escapeHtml(
                                prop.propertyName
                            )}</strong>: ${
                        prop.value
                            ? this.escapeHtml(prop.value)
                            : "<em>empty</em>"
                    }
                        </div>
                    `;
                }
            }

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // Escape HTML to prevent XSS
    private escapeHtml(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}
