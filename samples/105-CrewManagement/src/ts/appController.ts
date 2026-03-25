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
import { OFSPlugin } from "./ofs-plugin-core/plugin";
import {
    BUCKET_TABLE_COLUMNS,
    parseCrewOpenConfig,
} from "./crew/config";
import { BucketCache } from "./crew/cache";
import {
    BucketRow,
    CrewCalendarRow,
    CrewOpenConfig,
    CrewOpenMessage,
} from "./crew/types";
import { ResourcesService } from "./crew/resources-service";
import { CrewsService } from "./crew/crews-service";
import { CrewApiClient } from "./crew/api-client";

class RootViewModel extends OFSPlugin {
    appName = ko.observable("Crew Management");
    statusMessage = ko.observable("Waiting for the plugin to open.");
    errorMessage = ko.observable("");
    loading = ko.observable(false);
    totalBuckets = ko.observable(0);
    searchQuery = ko.observable("");
    selectedBucketId = ko.observable("");
    buckets = ko.observableArray<BucketRow>([]);
    filteredBuckets = ko.observableArray<BucketRow>([]);
    calendarRows = ko.observableArray<CrewCalendarRow>([]);

    bucketsDataProvider = ko.observable(
        new ArrayDataProvider([] as BucketRow[], {
            keyAttributes: "resourceId",
        })
    );
    calendarDataProvider = ko.observable(
        new ArrayDataProvider([] as CrewCalendarRow[], {
            keyAttributes: "technicianResourceId",
        })
    );

    subtitleText: ko.PureComputed<string>;
    hasBuckets: ko.PureComputed<boolean>;
    hasCalendarRows: ko.PureComputed<boolean>;

    bucketColumnsByKey: Record<string, { field: string; headerText: string; weight: number }>;
    bucketColumnOrder: string[];
    calendarColumnsByKey: Record<string, { field: string; headerText: string; weight: number }>;
    calendarColumnOrder: string[];

    closePlugin: () => void;
    refreshBuckets: () => void;
    retrieveCrews: () => void;
    clearSearch: () => void;

    private currentConfig: CrewOpenConfig = parseCrewOpenConfig(undefined, undefined);
    private readonly bucketCache = new BucketCache();
    private resourcesService?: ResourcesService;
    private crewsService?: CrewsService;

    constructor() {
        super("crewManagementPlugin");

        this.bucketColumnsByKey = {
            resourceName: { field: "resourceName", headerText: "Bucket", weight: 4 },
            resourceType: { field: "resourceType", headerText: "Type", weight: 4 },
            resourceId: { field: "resourceId", headerText: "Resource ID", weight: 4 },
        };
        this.bucketColumnOrder = BUCKET_TABLE_COLUMNS.map((column) => column.field);

        this.calendarColumnsByKey = {
            technicianName: { field: "technicianName", headerText: "Technician", weight: 3 },
            technicianType: { field: "technicianType", headerText: "Type", weight: 2 },
            assistantsCount: { field: "assistantsCount", headerText: "Assistants", weight: 2 },
            assistantsLabel: { field: "assistantsLabel", headerText: "Crew Members", weight: 5 },
        };
        this.calendarColumnOrder = [
            "technicianName",
            "technicianType",
            "assistantsCount",
            "assistantsLabel",
        ];

        this.subtitleText = ko.pureComputed(() => {
            if (this.errorMessage()) {
                return this.errorMessage();
            }
            return this.statusMessage();
        });

        this.hasBuckets = ko.pureComputed(() => this.filteredBuckets().length > 0);
        this.hasCalendarRows = ko.pureComputed(() => this.calendarRows().length > 0);

        this.closePlugin = () => this.close();
        this.refreshBuckets = () => {
            void this.loadBuckets(true);
        };
        this.retrieveCrews = () => {
            void this.loadCrewsForSelection();
        };
        this.clearSearch = () => {
            this.searchQuery("");
            this.applyBucketFilter();
        };

        this.searchQuery.subscribe(() => this.applyBucketFilter());
    }

    open(data: CrewOpenMessage): void {
        this.currentConfig = parseCrewOpenConfig(data.openParams, data.securedData);
        if (this.currentConfig.enableLogging) {
            console.info("[crewManagementPlugin] Received open message", data);
        }

        const baseURL = (this.proxy as any)?.baseURL as string | undefined;
        const authorization = (this.proxy as any)?.authorization as string | undefined;

        if (!baseURL || !authorization) {
            this.errorMessage("Missing secured OFS credentials in open message.");
            this.statusMessage("Cannot initialize OFS proxy.");
            return;
        }

        const client = new CrewApiClient(baseURL, authorization);

        this.resourcesService = new ResourcesService(client);
        this.crewsService = new CrewsService(client);
        void this.loadBuckets(false);
    }

    private applyBucketFilter(): void {
        const query = this.searchQuery().trim().toLowerCase();
        const filtered = this.buckets().filter((bucket: BucketRow) => {
            if (!query) {
                return true;
            }

            return (
                bucket.resourceName.toLowerCase().includes(query) ||
                bucket.resourceType.toLowerCase().includes(query) ||
                bucket.resourceId.toLowerCase().includes(query)
            );
        });

        this.filteredBuckets(filtered);
        this.totalBuckets(filtered.length);
        this.bucketsDataProvider(
            new ArrayDataProvider(filtered, {
                keyAttributes: "resourceId",
            })
        );
    }

    private async loadBuckets(forceRefresh: boolean): Promise<void> {
        if (!this.resourcesService) {
            return;
        }

        this.errorMessage("");
        this.statusMessage("Loading buckets from Oracle Field Service...");
        this.loading(true);

        try {
            const cachedBuckets = this.bucketCache.get();
            const buckets =
                !forceRefresh && cachedBuckets
                    ? cachedBuckets
                    : await this.resourcesService.loadBuckets(
                          this.currentConfig.bucketTypes
                      );

            this.bucketCache.set(buckets);
            this.buckets(buckets);
            this.applyBucketFilter();
            this.statusMessage(
                buckets.length > 0
                    ? "Buckets loaded. Select one bucket and click Retrieve Crews."
                    : "No buckets found for configured bucket types."
            );
        } catch (error) {
            this.errorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to load buckets."
            );
            this.statusMessage("Unable to load buckets.");
        } finally {
            this.loading(false);
        }
    }

    private async loadCrewsForSelection(): Promise<void> {
        if (!this.resourcesService || !this.crewsService) {
            return;
        }

        const selectedBucket = this.filteredBuckets().find(
            (bucket: BucketRow) => bucket.resourceId === this.selectedBucketId()
        );

        if (!selectedBucket) {
            this.errorMessage("Select a bucket first.");
            return;
        }

        this.errorMessage("");
        this.loading(true);
        this.statusMessage(
            `Retrieving crews for bucket ${selectedBucket.resourceName}...`
        );

        try {
            const technicians = await this.resourcesService.loadDescendantTechnicians(
                selectedBucket.resourceId,
                this.currentConfig.techniciansTypes
            );
            const calendarRows = await this.crewsService.loadCrewCalendarRows(
                technicians
            );
            this.calendarRows(calendarRows);
            this.calendarDataProvider(
                new ArrayDataProvider(calendarRows, {
                    keyAttributes: "technicianResourceId",
                })
            );
            this.statusMessage(
                calendarRows.length > 0
                    ? "Crew relationships loaded and mapped to calendar rows."
                    : "No crew relationships found for selected bucket."
            );
        } catch (error) {
            this.errorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to retrieve crews."
            );
            this.statusMessage("Unable to retrieve crews.");
        } finally {
            this.loading(false);
        }
    }
}

export default new RootViewModel();
