import { InventoryItemElement } from "./InventoryModel";

export class LaborFormModel {
    private laborLines: HTMLTableElement;
    private laborForm: HTMLFormElement;
    private formSection: HTMLElement;
    private formTitle: HTMLElement;
    private technicianSelect: HTMLSelectElement;
    private laborTypeSelect: HTMLSelectElement;
    private laborItemDesc: any;
    private laborItemNumber: any;
    private activityStartTimeDate: Date;
    private activityEndTimeDate: Date;
    private thisFormRow: number | null = null;
    private invtype: string;
    private activity: any;
    private team: any;
    private resource: any;
    private invpool: string = "install"; // Removed duplicate declaration and ensured consistent usage
    private quantity: string = "1";
    private laborServiceActivity: string = "Labor";
    private inventoryItemElements: InventoryItemElement[] = [];
    readonly status_new = "new";
    readonly status_current = "current";
    readonly status_changed = "changed";
    readonly status_removed = "removed";

    private formCellsMapping = {
        "technician-name": {
            type: "select-text",
            index: 0,
            editable: { edit: false, load: true },
        },
        "technician-id": {
            type: "select-option",
            from_select: "technician-name",
            index: 1,
            editable: { edit: false, load: false },
            uniqueKey: true,
        },
        "start-time": { type: "input", index: 2 },
        "end-time": { type: "input", index: 3 },
        "labor-type": {
            type: "select-text",
            index: 4,
            editable: { edit: false, load: true },
        },
        "labor-type-id": {
            type: "select-option",
            from_select: "labor-type",
            index: 5,
            editable: { edit: false, load: false },
            uniqueKey: true,
        },
        "text-description": { type: "input", index: 6 },
        "status-label": {
            type: "input",
            index: 7,
            editable: { edit: false, load: false },
            deleteLock: [this.status_current, this.status_changed],
            defaultValue: this.status_new,
        },
        "invid-label": {
            type: "input",
            index: 8,
            editable: { edit: false, load: false },
        },
    };
    constructor(config: {
        laborLines: HTMLTableElement;
        laborForm: HTMLFormElement;
        formSection: HTMLElement;
        formTitle: HTMLElement;
        technicianSelect: HTMLSelectElement;
        laborTypeSelect: HTMLSelectElement;
        laborItemDesc: any;
        laborItemNumber: any;
        activityStartTimeDate: Date;
        activityEndTimeDate: Date;
        invtype: string;
        activity: any;
        team: any;
        resource: any;
        laborServiceActivity: string;
        inventoryItemElements: InventoryItemElement[];
    }) {
        this.invtype = config.invtype;
        this.activity = config.activity;
        this.team = config.team;
        this.resource = config.resource;
        this.laborLines = config.laborLines;
        this.laborForm = config.laborForm;
        this.formSection = config.formSection;
        this.formTitle = config.formTitle;
        this.technicianSelect = config.technicianSelect;
        this.laborTypeSelect = config.laborTypeSelect;
        this.laborItemDesc = config.laborItemDesc;
        this.laborItemNumber = config.laborItemNumber;
        this.activityStartTimeDate = config.activityStartTimeDate;
        this.activityEndTimeDate = config.activityEndTimeDate;
        this.laborServiceActivity = config.laborServiceActivity;
        this.inventoryItemElements = config.inventoryItemElements;
        this.loadForm();
    }

    // Reset the form to its initial state
    resetForm(): void {
        this.trackStep("RESET", "START");
        (this.laborForm as HTMLFormElement).reset();
        this.setInputValue(
            "start-time",
            this.formatTime(this.activityStartTimeDate)
        );
        this.setInputValue(
            "end-time",
            this.formatTime(this.activityEndTimeDate)
        );
        // Using all elements in formCellsMapping, make ALL of them editable
        Object.entries(this.formCellsMapping).forEach(([id, config]) => {
            if (["select-option", "input"].includes(config.type)) {
                if (config.type === "select-option") {
                    id = "from_select" in config ? config.from_select : "";
                }
                if ("editable" in config && config.editable.load === false) {
                    this.makeElementReadOnly(id);
                } else {
                    this.makeElementEditable(id);
                }
                // if they have a default value, set it
                if ("defaultValue" in config) {
                    this.setInputValue(id, config.defaultValue);
                }
            }
            // if they have a deleteLock, set it to the default value
        });
        this.trackStep("RESET", "END");
        console.log(`Current inventory pool: ${this.invpool}`); // Example usage of invpool
    }
    // Populate the technician dropdown
    private populateTechnicianDropdown(): void {
        this.trackStep("POPULATE TECHNICIANS", "START");
        Object.entries(this.team).forEach(([key, member]: [string, any]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = member.pname;
            this.technicianSelect.appendChild(option);
        });
        this.trackStep("POPULATE TECHNICIANS", "END");
    }
    private trackStep(
        action: string,
        step: string,
        additionalInfo: string = ""
    ): void {
        console.debug(
            `LaborFormModel - ${action} of Form ${
                this.thisFormRow !== null
                    ? `Row ${this.thisFormRow + 1}`
                    : "New Row"
            }  Step : ${step} ${additionalInfo || ""}`
        );
    }
    // Populate the labor type dropdown
    private populateLaborTypeDropdown(): void {
        const laborTypeOptions = Object.entries(this.laborItemDesc.enum).filter(
            ([key, value]: [string, any]) => !value.inactive
        );
        laborTypeOptions.forEach(([key, value]: [string, any]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = value.text;
            this.laborTypeSelect.appendChild(option);
        });
    }

    // Get the value of an input field
    getInputValue(id: string): string {
        return (document.getElementById(id) as HTMLInputElement).value;
    }

    // Set the value of an input field
    setInputValue(id: string, value: string): void {
        (document.getElementById(id) as HTMLInputElement).value = value;
    }

    hideForm = (): void => {
        this.trackStep("HIDE", "START");
        this.formSection.style.display = "none";
        this.resetForm();
        this.trackStep("HIDE", "END");
    };
    updateStatusLabel = (): void => {
        this.trackStep(
            "UPDATE STATUS",
            "START",
            `Form status: ${this.getInputValue("status-label")}`
        );
        let currentStatus = this.getInputValue("status-label");
        if (currentStatus === this.status_current) {
            this.setInputValue("status-label", this.status_changed);
        }
        this.trackStep(
            "UPDATE STATUS",
            "START",
            `Form status: ${this.getInputValue("status-label")}`
        );
    };
    showForm = (
        action: "add" | "edit",
        rowNumber: number | null = null
    ): void => {
        this.trackStep(
            "SHOW",
            "START",
            `Row Number: ${rowNumber} and action: ${action}`
        );
        this.thisFormRow = rowNumber;
        this.formSection.style.display = "block";
        this.formTitle.textContent =
            action === "add" ? "Add Labor Line" : "Edit Labor Line";
        if (action === "edit" && rowNumber) {
            const row = this.laborLines.rows[rowNumber - 1];

            this.thisFormRow = rowNumber - 1;
            Object.entries(this.formCellsMapping).forEach(([id, config]) => {
                console.debug(
                    `Validating config for id ${id} and ${JSON.stringify(
                        config.type
                    )}`
                );
                if (["select-option", "input"].includes(config.type)) {
                    if (config.type === "select-option") {
                        id = "from_select" in config ? config.from_select : "";
                    }
                    console.debug(
                        `Form element: ${id},  Content Before: ${this.getInputValue(
                            id
                        )} `
                    );
                    this.setInputValue(
                        id,
                        row.cells[config.index].textContent || ""
                    );
                    console.debug(
                        `Form element: ${id},  Content After: ${this.getInputValue(
                            id
                        )}`
                    );
                    if (
                        "editable" in config &&
                        config.editable.edit === false
                    ) {
                        this.makeElementReadOnly(id);
                    }
                }
            });
            this.updateStatusLabel();
        } else {
            this.resetForm();
        }
        this.trackStep("SHOW", "END");
    };
    // Get the selected value and description from a dropdown
    getSelectedElement(id: string): { value: string; description: string } {
        const selectElement = document.getElementById(id) as HTMLSelectElement;
        const selectedOption =
            selectElement.options[selectElement.selectedIndex];
        return {
            value: selectedOption.value,
            description: selectedOption.textContent || "",
        };
    }

    // Format a Date object to a time string (HH:mm)
    private formatTime(inputDate: Date): string {
        return (
            ("0" + inputDate.getHours()).slice(-2) +
            ":" +
            ("0" + inputDate.getMinutes()).slice(-2)
        );
    }
    // Format a Date object to a time string (HH:mm)
    private formatTimeToRow(inputDate: string): string {
        // String in format THH.mm:ss
        // I want just digit HH:MM
        const time = inputDate.split("T")[1];
        return time ? time.slice(0, 5) : "";
    }
    makeElementReadOnly = (id: string): void => {
        const element = document.getElementById(id);
        if (element) {
            (element as HTMLInputElement).setAttribute("disabled", "true");
        } else {
            console.error(`Element with id ${id} not found.`);
        }
    };

    makeElementEditable = (id: string): void => {
        const element = document.getElementById(id);
        if (element) {
            (element as HTMLInputElement).removeAttribute("disabled");
        } else {
            console.error(`Element with id ${id} not found.`);
        }
    };
    confirmForm = (): void => {
        this.trackStep("CONFIRM", "START");
        const values: string[] = Object.entries(this.formCellsMapping)
            .flatMap(([id, config]) => {
                if (["select-option", "input"].includes(config.type)) {
                    if (config.type === "select-option") {
                        const { value, description } = this.getSelectedElement(
                            "from_select" in config ? config.from_select : ""
                        );
                        return [description, value];
                    } else {
                        return [this.getInputValue(id)];
                    }
                }
                return []; // Return an empty array for unsupported types
            })
            .flat();

        if (this.thisFormRow !== null) {
            this.trackStep(
                "CONFIRM",
                "START",
                `Editing row: ${this.thisFormRow}`
            );
            const row = this.laborLines.rows[this.thisFormRow];
            values.forEach((value, i) => (row.cells[i].textContent = value));
        } else {
            // Validate if the row already exists using the formCellsMapping and elements with uniqueKey
            const isDuplicate = Array.from(this.laborLines.rows).some((row) =>
                Object.entries(this.formCellsMapping)
                    .filter(
                        ([id, config]) =>
                            "uniqueKey" in config && config.uniqueKey
                    )
                    .every(([id, config]) => {
                        if (["select-option", "input"].includes(config.type)) {
                            if (config.type === "select-option") {
                                return (
                                    row.cells[config.index].textContent ===
                                    this.getSelectedElement(
                                        "from_select" in config
                                            ? config.from_select
                                            : ""
                                    ).value
                                );
                            } else {
                                return (
                                    row.cells[config.index].textContent ===
                                    this.getInputValue(id)
                                );
                            }
                        }
                    })
            );

            if (isDuplicate) {
                console.error(
                    "This combination already exists. Please edit the existing row"
                );
                alert(
                    "This combination already exists. Please edit the existing row"
                );
                return;
            }
            this.trackStep("CONFIRM", "START", `Adding new row`);
            const row = this.laborLines.insertRow();
            values.forEach((value) => (row.insertCell().textContent = value));
            this.trackStep(
                "CONFIRM",
                "PROCESS",
                `Form will have the showForm : this.showForm("edit", ${row.rowIndex})`
            );
            const actionsCell = row.insertCell();
            actionsCell.appendChild(
                this.createButton("Edit", "btn btn-secondary", () =>
                    this.showForm("edit", row.rowIndex)
                )
            );
            actionsCell.appendChild(
                this.createButton("Delete", "btn btn-danger", () =>
                    this.laborLines.deleteRow(row.rowIndex - 1)
                )
            );
        }
        this.hideForm();
        this.trackStep("CONFIRM", "END");
    };
    loadForm = (): void => {
        this.trackStep("LOAD", "START");
        this.resetForm();
        this.populateTechnicianDropdown();
        this.populateLaborTypeDropdown();
        this.loadLaborLines();
    };
    createButton = (
        text: string,
        className: string,
        onClick: () => void
    ): HTMLButtonElement => {
        const button = document.createElement("button");
        button.className = className;
        button.textContent = text;
        button.onclick = onClick;
        return button;
    };

    private loadLaborLines = (): void => {
        // Use inventoryItemElement to fill the laborLines table
        this.trackStep(
            "LOAD LABOR LINES",
            "START",
            `I need to load ${this.inventoryItemElements.length} lines`
        );
        this.inventoryItemElements.forEach((inventoryItem: any) => {
            //inv_aid?: number | null;
            //inventory_model: any;
            //invsn: any;

            const row = this.laborLines.insertRow();
            const cells = [
                inventoryItem.invsn ? this.team[inventoryItem.invsn].pname : "",
                inventoryItem.invsn || "",
                inventoryItem.labor_start_time
                    ? this.formatTimeToRow(inventoryItem.labor_start_time)
                    : "",
                inventoryItem.labor_end_time
                    ? this.formatTimeToRow(inventoryItem.labor_end_time)
                    : "",
                this.laborItemDesc.enum[inventoryItem.labor_item_desc].text,
                inventoryItem.labor_item_desc,
                inventoryItem.description,
                this.status_current,
                inventoryItem.invid,
            ];
            cells.forEach((cell) => (row.insertCell().textContent = cell));
            const actionsCell = row.insertCell();
            actionsCell.appendChild(
                this.createButton("Edit", "btn btn-secondary", () =>
                    this.showForm("edit", row.rowIndex)
                )
            );
            actionsCell.appendChild(
                this.createButton("Delete", "btn btn-danger", () =>
                    this.laborLines.deleteRow(row.rowIndex - 1)
                )
            );
        });
    };
    getInventoryElementsToUpdate = (): InventoryItemElement[] => {
        return this.getInventoryElements([this.status_changed]);
    };
    getInventoryElementsToCreate = (): InventoryItemElement[] => {
        return this.getInventoryElements([this.status_new]);
    };
    getInventoryElementsToDelete = (): InventoryItemElement[] => {
        return this.getInventoryElements([this.status_removed]);
    };
    getRowValue(
        label_name: keyof typeof this.formCellsMapping,
        row: HTMLTableRowElement
    ) {
        if (!this.formCellsMapping[label_name]) {
            console.error(`Label ${label_name} not found in formCellsMapping`);
            return "";
        } else {
            // if type is select
            if (this.formCellsMapping[label_name].type === "select") {
                return row.cells[this.formCellsMapping[label_name].index + 1]
                    .textContent;
            } else {
                return row.cells[this.formCellsMapping[label_name].index]
                    .textContent;
            }
        }
    }

    private getInventoryElements = (
        validStatuses: string[]
    ): InventoryItemElement[] => {
        this.trackStep("CREATE INVENTORY ITEMS", "START");
        const inventoryItems: InventoryItemElement[] = [];
        // For all labor lines, create inventory elements for those with status-label in tatus_changed
        Array.from(this.laborLines.rows).forEach((row, index) => {
            const status =
                row.cells[this.formCellsMapping["status-label"].index]
                    .textContent || "not-valid";
            if (validStatuses.includes(status)) {
                const technicianId = this.getRowValue("technician-id", row);
                const laborTypeId = this.getRowValue("labor-type-id", row);
                const invid = this.getRowValue("invid-label", row);
                const start_time = this.getRowValue("start-time", row);
                const end_time = this.getRowValue("end-time", row);
                const inventoryItem: InventoryItemElement = {
                    invtype: this.invtype || "",
                    inv_aid: this.activity.aid || "",
                    inventory_model: laborTypeId || "",
                    invpool: this.invpool || "",
                    quantity: "1",
                    inv_pid: this.resource.pid || "",
                    invsn: technicianId || "",
                    invid: invid || "",
                    labor_start_time: start_time
                        ? `T${start_time || ""}:00`
                        : "",
                    labor_end_time: end_time ? `T${end_time || ""}:00` : "",
                    labor_item_number: laborTypeId || "",
                    labor_item_description: laborTypeId || "",
                    labor_service_activity: this.laborServiceActivity || "",
                };
                inventoryItems.push(inventoryItem);
            }
        });
        return inventoryItems;
    };
    deleteRow(rowIndex: number): void {
        const row = this.laborLines.rows[rowIndex - 1];
        // Check formCellsMapping to find the index for the config elements with deleteLock
        // and compare the value of the cell with the list of values
        // return true if the value is in the list
        const cells = Object.entries(this.formCellsMapping).filter(
            ([id, config]) => "deleteLock" in config
        );
        const isLocked = cells.some(([id, config]) => {
            const cellValue = row.cells[config.index].textContent || "";
            return (
                "deleteLock" in config && config.deleteLock.includes(cellValue)
            );
        });

        if (isLocked) {
            row.cells[this.formCellsMapping["status-label"].index].textContent =
                this.status_removed;
        } else {
            this.laborLines.deleteRow(row.rowIndex - 1);
        }
    }
}
