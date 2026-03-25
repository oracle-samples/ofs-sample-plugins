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
import { OFSPlugin } from "@ofs-users/plugin";
import {
    BUCKET_TABLE_COLUMNS,
    parseCrewOpenConfig,
} from "./crew/config";
import { ResourceCache } from "./crew/cache";
import {
    BucketRow,
    CrewAssignment,
    CrewOpenConfig,
    CrewOpenMessage,
    DescendantsScope,
    CrewViewMode,
} from "./crew/types";
import { ResourcesService } from "./crew/resources-service";
import { CrewsService } from "./crew/crews-service";

class RootViewModel extends OFSPlugin {
    appName = ko.observable("Crew Management");
    statusMessage = ko.observable("Waiting for the plugin to open.");
    errorMessage = ko.observable("");
    loading = ko.observable(false);
    totalBuckets = ko.observable(0);
    resourceCacheSource = ko.observable("not_loaded");
    resourceApiFetchCount = ko.observable(0);
    resourceCacheHitCount = ko.observable(0);
    searchQuery = ko.observable("");
    showBucketsSection = ko.observable(true);
    selectedBucketId = ko.observable("");
    descendantsScope = ko.observable<DescendantsScope>("all");
    crewViewMode = ko.observable<CrewViewMode>("list");
    dateFrom = ko.observable("");
    dateTo = ko.observable("");
    buckets = ko.observableArray<BucketRow>([]);
    filteredBuckets = ko.observableArray<BucketRow>([]);
    crewAssignments = ko.observableArray<CrewAssignment>([]);
    dateColumns = ko.observableArray<string>([]);

    bucketsDataProvider = ko.observable(
        new ArrayDataProvider([] as BucketRow[], {
            keyAttributes: "resourceId",
        })
    );
    calendarDataProvider = ko.observable(
        new ArrayDataProvider([] as CrewAssignment[], {
            keyAttributes: "crewId",
        })
    );

    subtitleText: ko.PureComputed<string>;
    cacheDiagnosticsText: ko.PureComputed<string>;
    hasBuckets: ko.PureComputed<boolean>;
    hasCrewAssignments: ko.PureComputed<boolean>;

    bucketColumnsByKey: Record<string, { field: string; headerText: string; weight: number }>;
    bucketColumnOrder: string[];
    calendarColumnsByKey: Record<string, { field: string; headerText: string; weight: number }>;
    calendarColumnOrder: string[];

    closePlugin: () => void;
    refreshBuckets: () => void;
    retrieveCrews: () => void;
    clearSearch: () => void;
    showBuckets: () => void;
    onBucketSelectionChanged: (event: any) => void;
    onBucketCurrentCellChanged: (event: any) => void;

    private currentConfig: CrewOpenConfig = parseCrewOpenConfig(undefined, undefined);
    private readonly resourceCache = new ResourceCache();
    private allResources: BucketRow[] = [];
    private resourcesService?: ResourcesService;
    private crewsService?: CrewsService;

    private debugLog(...args: unknown[]): void {
        if (!this.currentConfig.enableLogging) {
            return;
        }
        console.log("[crewManagementPlugin]", ...args);
    }

    private formatDate(date: Date): string {
        return date.toISOString().split("T")[0];
    }

    private addDays(input: string, days: number): string {
        const base = new Date(`${input}T00:00:00`);
        base.setDate(base.getDate() + days);
        return this.formatDate(base);
    }

    private ensureDateRangeDefaults(): void {
        const today = this.formatDate(new Date());
        if (!this.dateFrom()) {
            this.dateFrom(today);
        }
        if (!this.dateTo()) {
            this.dateTo(this.addDays(this.dateFrom(), 14));
        }
    }

    private validateDateRange(): string | null {
        if (!this.dateFrom() || !this.dateTo()) {
            return "dateFrom and dateTo are required.";
        }
        if (this.dateTo() < this.dateFrom()) {
            return "dateTo must be on or after dateFrom.";
        }
        const start = new Date(`${this.dateFrom()}T00:00:00`);
        const end = new Date(`${this.dateTo()}T00:00:00`);
        const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays > 14) {
            return "Date range cannot exceed 14 days.";
        }
        return null;
    }

    private buildDateColumns(dateFrom: string, dateTo: string): string[] {
        const days: string[] = [];
        const current = new Date(`${dateFrom}T00:00:00`);
        const end = new Date(`${dateTo}T00:00:00`);
        while (current.getTime() <= end.getTime()) {
            days.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }
        return days;
    }

    constructor() {
        super("crewManagementPlugin");

        this.bucketColumnsByKey = {
            resourceName: { field: "resourceName", headerText: "Bucket", weight: 4 },
            resourceType: { field: "resourceType", headerText: "Type", weight: 4 },
            resourceId: { field: "resourceId", headerText: "Resource ID", weight: 4 },
        };
        this.bucketColumnOrder = BUCKET_TABLE_COLUMNS.map((column) => column.field);

        this.calendarColumnsByKey = {
            crewName: { field: "crewName", headerText: "Crew", weight: 3 },
            leadName: { field: "leadName", headerText: "Team Lead", weight: 3 },
            membersLabel: { field: "membersLabel", headerText: "Members", weight: 6 },
            startDate: { field: "startDate", headerText: "Start", weight: 2 },
            endDate: { field: "endDate", headerText: "End", weight: 2 },
            durationDays: { field: "durationDays", headerText: "Days", weight: 1 },
        };
        this.calendarColumnOrder = [
            "crewName",
            "leadName",
            "membersLabel",
            "startDate",
            "endDate",
            "durationDays",
        ];

        this.subtitleText = ko.pureComputed(() => {
            if (this.errorMessage()) {
                return this.errorMessage();
            }
            return this.statusMessage();
        });
        this.cacheDiagnosticsText = ko.pureComputed(() => {
            const source = this.resourceCacheSource();
            const sourceLabel =
                source === "api"
                    ? "API"
                    : source === "cache"
                    ? "Session cache"
                    : "Not loaded";
            return `Source: ${sourceLabel} | API fetches: ${this.resourceApiFetchCount()} | Cache hits: ${this.resourceCacheHitCount()}`;
        });

        this.hasBuckets = ko.pureComputed(() => this.filteredBuckets().length > 0);
        this.hasCrewAssignments = ko.pureComputed(
            () => this.crewAssignments().length > 0
        );

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
        this.showBuckets = () => {
            this.showBucketsSection(true);
        };
        this.onBucketSelectionChanged = (event: any) => {
            const selectedRows = event?.detail?.value?.row;
            const values = selectedRows?.values?.();
            const firstSelected = values?.next?.().value;
            if (firstSelected !== undefined && firstSelected !== null) {
                this.selectedBucketId(String(firstSelected));
            }
        };
        this.onBucketCurrentCellChanged = (event: any) => {
            const rowKey = event?.detail?.value?.rowKey;
            if (rowKey !== undefined && rowKey !== null) {
                this.selectedBucketId(String(rowKey));
            }
        };

        this.searchQuery.subscribe(() => this.applyBucketFilter());
    }

    open(data: CrewOpenMessage): void {
        this.currentConfig = parseCrewOpenConfig(data.openParams, data.securedData);
        if (this.currentConfig.enableLogging) {
            console.log("[crewManagementPlugin] Verbose logging enabled");
            console.log("[crewManagementPlugin] Received open message", data);
        }

        if (!this.proxy) {
            this.errorMessage("Missing secured OFS credentials in open message.");
            this.statusMessage("Cannot initialize OFS proxy.");
            return;
        }
        this.ensureDateRangeDefaults();

        this.resourcesService = new ResourcesService(
            this.proxy as any,
            (...args: unknown[]) => this.debugLog(...args)
        );
        this.crewsService = new CrewsService(
            this.proxy as any,
            (...args: unknown[]) => this.debugLog(...args)
        );
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
            const cachedResources = this.resourceCache.get();
            const loadedFromCache = !forceRefresh && Array.isArray(cachedResources);
            const allResources =
                loadedFromCache && cachedResources
                    ? cachedResources
                    : await this.resourcesService.fetchAllResources();
            if (loadedFromCache) {
                this.resourceCacheSource("cache");
                this.resourceCacheHitCount(this.resourceCacheHitCount() + 1);
                this.debugLog("loadBuckets: using cached resources", {
                    totalResources: allResources.length,
                    forceRefresh,
                });
            } else {
                this.resourceCacheSource("api");
                this.resourceApiFetchCount(this.resourceApiFetchCount() + 1);
                this.debugLog("loadBuckets: fetched resources from API", {
                    totalResources: allResources.length,
                    forceRefresh,
                });
            }
            this.allResources = allResources;
            this.resourceCache.set(allResources);

            const buckets = this.resourcesService.filterBuckets(
                allResources,
                this.currentConfig.bucketTypes
            );
            this.debugLog("loadBuckets: filtered buckets", {
                bucketTypes: this.currentConfig.bucketTypes,
                totalBuckets: buckets.length,
            });
            this.showBucketsSection(true);
            this.buckets(buckets);
            this.applyBucketFilter();
            this.statusMessage(
                buckets.length > 0
                    ? `Buckets loaded (${buckets.length}) from ${
                          loadedFromCache ? "session cache" : "API"
                      } (${allResources.length} total resources). Select one bucket and click Retrieve Crews.`
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

        if (this.allResources.length === 0) {
            await this.loadBuckets(false);
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
            `Retrieving crews for bucket ${selectedBucket.resourceName} using ${
                this.descendantsScope() === "direct" ? "direct children" : "all descendants"
            } from cached resources...`
        );

        const rangeError = this.validateDateRange();
        if (rangeError) {
            this.loading(false);
            this.errorMessage(rangeError);
            return;
        }

        try {
            const technicians = this.resourcesService.findDescendantTechnicians(
                this.allResources,
                selectedBucket.resourceId,
                this.currentConfig.techniciansTypes,
                this.descendantsScope()
            );
            this.debugLog("loadCrewsForSelection: technicians resolved", {
                selectedBucketResourceId: selectedBucket.resourceId,
                descendantsScope: this.descendantsScope(),
                techniciansTypes: this.currentConfig.techniciansTypes,
                technicianIds: technicians.map((t) => t.resourceId),
                techniciansCount: technicians.length,
            });
            if (technicians.length === 0) {
                this.crewAssignments([]);
                this.dateColumns(this.buildDateColumns(this.dateFrom(), this.dateTo()));
                this.calendarDataProvider(
                    new ArrayDataProvider([] as CrewAssignment[], {
                        keyAttributes: "crewId",
                    })
                );
                this.statusMessage(
                    "No technicians found under selected bucket for configured technician types."
                );
                return;
            }
            const assignments = await this.crewsService.loadCrewAssignments(
                technicians,
                this.dateFrom(),
                this.dateTo(),
                this.allResources
            );
            this.debugLog("loadCrewsForSelection: crew assignments generated", {
                assignments: assignments.length,
            });
            this.crewAssignments(assignments);
            this.dateColumns(this.buildDateColumns(this.dateFrom(), this.dateTo()));
            this.calendarDataProvider(
                new ArrayDataProvider(assignments, {
                    keyAttributes: "crewId",
                })
            );
            this.statusMessage(
                assignments.length > 0
                    ? "Crew assignments loaded and grouped by consecutive days."
                    : "No crew assignments found for selected bucket."
            );
            if (assignments.length > 0) {
                this.showBucketsSection(false);
                this.crewViewMode("calendar");
            }
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
