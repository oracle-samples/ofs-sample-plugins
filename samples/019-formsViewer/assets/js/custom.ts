/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSOpenMessage } from "@ofs-users/plugin";

interface CustomOFSOpenMessage extends OFSOpenMessage {
    activity?: {
        aid: string;
        appt_number?: string;
        submittedForms?: SubmittedFormsResponse;
        [key: string]: any;
    };
    openParams?: { [key: string]: string };
    securedData?: { [key: string]: string };
}

interface FormIdentifier {
    formSubmitId: string;
    formLabel: string;
}

interface FormDetails {
    [key: string]: any;
}

interface ActivityDetails {
    activityId?: number;
    apptNumber?: string;
    activityType?: string;
    startTime?: string;
    endTime?: string;
    resourceId?: string;
    resourceInternalId?: number;
    [key: string]: any;
}

interface ResourceDetails {
    resourceInternalId?: number;
    name?: string;
    [key: string]: any;
}

interface SubmittedForm {
    time: string;
    user: string;
    formIdentifier: FormIdentifier;
    formDetails?: FormDetails;
    activityDetails?: ActivityDetails;
    resourceDetails?: ResourceDetails;
}

interface SubmittedFormsResponse {
    hasMore: boolean;
    totalResults: number;
    offset: number;
    limit: number;
    items: SubmittedForm[];
    links?: any[];
}

interface TableColumn {
    key: string;
    label: string;
    sortable: boolean;
    isFormDetail?: boolean;
}

export class CustomPlugin extends OFSPlugin {
    private activityId: string = "";
    private formLabelFilter: string = "";
    private columnOrder: string[] = [];
    private formsData: SubmittedForm[] = [];
    private filteredData: SubmittedForm[] = [];
    private currentSortColumn: string = "";
    private currentSortDirection: "asc" | "desc" = "desc";

    open(data: CustomOFSOpenMessage) {
        // Initialize debug view
        const input_data = document.getElementById("input_data");
        if (input_data) {
            input_data.textContent = JSON.stringify(data, null, 2);
        }

        // Get configuration from openParams (priority) or securedData (fallback)
        const openParams = data.openParams || {};
        const securedData = data.securedData || {};

        // Check if proxy is available (it's provided by the OFSPlugin base class)
        if (!this.proxy) {
            console.error("Proxy not available! Plugin may not have an application configured.");
        }

        // FORM_LABEL: openParams takes precedence over securedData
        this.formLabelFilter = openParams.FORM_LABEL || securedData.FORM_LABEL || "";

        // COLUMN_ORDER: openParams takes precedence over securedData
        const columnOrderString = openParams.COLUMN_ORDER || securedData.COLUMN_ORDER || "time,user,formLabel,formDetails";
        this.columnOrder = columnOrderString.split(',').map(col => col.trim());

        // Get activity ID
        this.activityId = data.activity?.aid || "";

        // Update UI with activity info
        const activityInfo = document.getElementById("activity-info");
        if (activityInfo && data.activity) {
            activityInfo.textContent = `Activity: ${data.activity.appt_number || this.activityId}`;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Fetch and display forms
        this.fetchSubmittedForms();
    }

    private setupEventListeners() {
        const refreshButton = document.getElementById("refresh_button");
        const closeButton = document.getElementById("close_button");

        if (refreshButton) {
            refreshButton.addEventListener("click", () => this.fetchSubmittedForms());
        }

        if (closeButton) {
            closeButton.addEventListener("click", () => this.closePlugin());
        }
    }

    private async fetchSubmittedForms() {
        if (!this.activityId) {
            this.showError("No activity ID provided");
            return;
        }

        if (!this.proxy) {
            this.showError("Plugin proxy not initialized. Please ensure an application is configured.");
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            const activityIdNum = parseInt(this.activityId);
            const response = await this.proxy.getSubmittedForms(activityIdNum);

            if (response && response.data && response.data.items) {
                if (response.data.items.length === 0) {
                    this.formsData = [];
                    this.showNoForms();
                } else {
                    this.formsData = response.data.items;
                    this.filterAndDisplayForms();
                }
            } else {
                this.showError("Invalid response from API");
            }
        } catch (error) {
            console.error("Error fetching submitted forms:", error);
            this.showError(`Failed to fetch forms: ${(error as Error).message || error}`);
        } finally {
            this.showLoading(false);
        }
    }

    private filterAndDisplayForms() {
        // Filter by formLabel if specified
        if (this.formLabelFilter) {
            this.filteredData = this.formsData.filter(form =>
                form.formIdentifier.formLabel === this.formLabelFilter
            );
        } else {
            this.filteredData = [...this.formsData];
        }

        if (this.filteredData.length === 0) {
            this.showNoForms();
        } else {
            this.renderFormsTable();
        }
    }

    private renderFormsTable() {
        const formsContainer = document.getElementById("forms-container");
        const noFormsDiv = document.getElementById("no-forms");
        const tableHeader = document.getElementById("table-header");
        const tableBody = document.getElementById("table-body");

        if (!formsContainer || !tableHeader || !tableBody || !noFormsDiv) return;

        // Show container, hide no forms message
        formsContainer.classList.remove("d-none");
        noFormsDiv.classList.add("d-none");

        // Clear existing content
        tableHeader.innerHTML = "";
        tableBody.innerHTML = "";

        // Generate table headers based on column order
        const columns = this.getTableColumns();
        columns.forEach(column => {
            const th = document.createElement("th");
            th.textContent = column.label;
            if (column.sortable) {
                th.style.cursor = "pointer";
                th.onclick = () => this.sortBy(column.key);

                // Add sort indicator if this is the current sort column
                if (this.currentSortColumn === column.key) {
                    const indicator = this.currentSortDirection === "asc" ? " ↑" : " ↓";
                    th.textContent += indicator;
                }
            }
            tableHeader.appendChild(th);
        });

        // Sort data if needed
        const sortedData = this.getSortedData();

        // Generate table rows
        sortedData.forEach(form => {
            const tr = document.createElement("tr");

            columns.forEach(column => {
                const td = document.createElement("td");
                td.innerHTML = this.getCellContent(form, column.key);
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });
    }

    private getTableColumns(): TableColumn[] {
        const columns: TableColumn[] = [];

        // Get all unique field names from formDetails, activityDetails, and resourceDetails
        const formDetailsFields = new Set<string>();
        const activityDetailsFields = new Set<string>();
        const resourceDetailsFields = new Set<string>();

        this.filteredData.forEach(form => {
            if (form.formDetails) {
                Object.keys(form.formDetails).forEach(fieldName => {
                    formDetailsFields.add(fieldName);
                });
            }
            if (form.activityDetails) {
                Object.keys(form.activityDetails).forEach(fieldName => {
                    activityDetailsFields.add(fieldName);
                });
            }
            if (form.resourceDetails) {
                Object.keys(form.resourceDetails).forEach(fieldName => {
                    resourceDetailsFields.add(fieldName);
                });
            }
        });

        this.columnOrder.forEach(columnKey => {
            switch (columnKey) {
                case "time":
                    columns.push({ key: "time", label: "Time", sortable: true });
                    break;
                case "user":
                    columns.push({ key: "user", label: "User", sortable: true });
                    break;
                case "formLabel":
                    columns.push({ key: "formLabel", label: "Form", sortable: true });
                    break;
                case "formSubmitId":
                    columns.push({ key: "formSubmitId", label: "Submit ID", sortable: true });
                    break;
                case "formDetails":
                    // Add a column for each formDetails field
                    formDetailsFields.forEach(fieldName => {
                        columns.push({
                            key: `formDetails.${fieldName}`,
                            label: fieldName,
                            sortable: true,
                            isFormDetail: true
                        });
                    });
                    break;
                case "activityDetails":
                    // Add a column for each activityDetails field
                    activityDetailsFields.forEach(fieldName => {
                        columns.push({
                            key: `activityDetails.${fieldName}`,
                            label: fieldName,
                            sortable: true
                        });
                    });
                    break;
                case "resourceDetails":
                    // Add a column for each resourceDetails field
                    resourceDetailsFields.forEach(fieldName => {
                        columns.push({
                            key: `resourceDetails.${fieldName}`,
                            label: fieldName,
                            sortable: true
                        });
                    });
                    break;
                default:
                    // Check if it's a specific field name from formDetails, activityDetails, or resourceDetails
                    if (formDetailsFields.has(columnKey)) {
                        columns.push({
                            key: `formDetails.${columnKey}`,
                            label: columnKey,
                            sortable: true,
                            isFormDetail: true
                        });
                    } else if (activityDetailsFields.has(columnKey)) {
                        columns.push({
                            key: `activityDetails.${columnKey}`,
                            label: columnKey,
                            sortable: true
                        });
                    } else if (resourceDetailsFields.has(columnKey)) {
                        columns.push({
                            key: `resourceDetails.${columnKey}`,
                            label: columnKey,
                            sortable: true
                        });
                    }
                    // If not found in any collection, silently skip this column
                    break;
            }
        });

        return columns;
    }

    private getCellContent(form: SubmittedForm, columnKey: string): string {
        // Check if this is a formDetails field (format: "formDetails.FIELD_NAME")
        if (columnKey.startsWith("formDetails.")) {
            const fieldName = columnKey.substring("formDetails.".length);
            const value = form.formDetails?.[fieldName];
            return this.formatFieldValue(value);
        }

        // Check if this is an activityDetails field
        if (columnKey.startsWith("activityDetails.")) {
            const fieldName = columnKey.substring("activityDetails.".length);
            const value = form.activityDetails?.[fieldName];
            return this.formatFieldValue(value);
        }

        // Check if this is a resourceDetails field
        if (columnKey.startsWith("resourceDetails.")) {
            const fieldName = columnKey.substring("resourceDetails.".length);
            const value = form.resourceDetails?.[fieldName];
            return this.formatFieldValue(value);
        }

        switch (columnKey) {
            case "time":
                return this.formatDateTime(form.time);
            case "user":
                return form.user || "-";
            case "formLabel":
                return form.formIdentifier.formLabel || "-";
            case "formSubmitId":
                return form.formIdentifier.formSubmitId || "-";
            default:
                return "-";
        }
    }

    private formatFieldValue(value: any): string {
        if (value === null || value === undefined) {
            return "-";
        }
        if (typeof value === 'object') {
            // Handle nested objects (like file references)
            if ('filename' in value && 'href' in value) {
                return value.filename;
            }
            return JSON.stringify(value);
        }
        return String(value);
    }

    private formatDateTime(dateTimeString: string): string {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString();
        } catch {
            return dateTimeString;
        }
    }


    private sortBy(columnKey: string) {
        if (this.currentSortColumn === columnKey) {
            // Toggle direction
            this.currentSortDirection = this.currentSortDirection === "asc" ? "desc" : "asc";
        } else {
            // New column, default to descending
            this.currentSortColumn = columnKey;
            this.currentSortDirection = "desc";
        }

        this.renderFormsTable();
    }

    private getSortedData(): SubmittedForm[] {
        if (!this.currentSortColumn) {
            return this.filteredData;
        }

        const sorted = [...this.filteredData].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            // Check if sorting by a nested field (formDetails, activityDetails, or resourceDetails)
            if (this.currentSortColumn.includes(".")) {
                const [section, fieldName] = this.currentSortColumn.split(".", 2);

                if (section === "formDetails") {
                    aValue = a.formDetails?.[fieldName];
                    bValue = b.formDetails?.[fieldName];
                } else if (section === "activityDetails") {
                    aValue = a.activityDetails?.[fieldName];
                    bValue = b.activityDetails?.[fieldName];
                } else if (section === "resourceDetails") {
                    aValue = a.resourceDetails?.[fieldName];
                    bValue = b.resourceDetails?.[fieldName];
                }

                // Handle undefined values
                if (aValue === undefined || aValue === null) aValue = "";
                if (bValue === undefined || bValue === null) bValue = "";

                // Convert to string for comparison
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            } else {
                switch (this.currentSortColumn) {
                    case "time":
                        aValue = new Date(a.time).getTime();
                        bValue = new Date(b.time).getTime();
                        break;
                    case "user":
                        aValue = a.user;
                        bValue = b.user;
                        break;
                    case "formLabel":
                        aValue = a.formIdentifier.formLabel;
                        bValue = b.formIdentifier.formLabel;
                        break;
                    case "formSubmitId":
                        aValue = parseInt(a.formIdentifier.formSubmitId);
                        bValue = parseInt(b.formIdentifier.formSubmitId);
                        break;
                    default:
                        return 0;
                }
            }

            if (aValue < bValue) return this.currentSortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return this.currentSortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return sorted;
    }

    private showLoading(show: boolean) {
        const loadingDiv = document.getElementById("loading");
        if (loadingDiv) {
            loadingDiv.classList.toggle("d-none", !show);
        }
    }

    private showError(message: string) {
        const errorDiv = document.getElementById("error-message");
        const formsContainer = document.getElementById("forms-container");

        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove("d-none");
        }

        if (formsContainer) {
            formsContainer.classList.add("d-none");
        }
    }

    private hideError() {
        const errorDiv = document.getElementById("error-message");
        if (errorDiv) {
            errorDiv.classList.add("d-none");
        }
    }

    private showNoForms() {
        const formsContainer = document.getElementById("forms-container");
        const noFormsDiv = document.getElementById("no-forms");

        if (formsContainer && noFormsDiv) {
            formsContainer.classList.remove("d-none");
            noFormsDiv.classList.remove("d-none");

            // Update message based on whether a filter was applied
            if (this.formLabelFilter) {
                noFormsDiv.textContent = `No forms found with label "${this.formLabelFilter}". Total forms for this activity: ${this.formsData.length}`;
            } else if (this.formsData.length === 0) {
                noFormsDiv.textContent = "No submitted forms found for this activity.";
            } else {
                noFormsDiv.textContent = "No forms to display.";
            }
        }
    }

    public close(data?: any): void {
        this.sendMessage("close" as any, data);
    }

    private closePlugin(): void {
        this.close({ method: "close" });
    }
}
