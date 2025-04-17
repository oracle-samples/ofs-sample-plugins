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
    private formCellsMapping = {
        "technician-name": {
            type: "select",
            index: 1,
            editable: false,
            uniqueKey: true,
        },
        "start-time": { type: "input", index: 2 },
        "end-time": { type: "input", index: 3 },
        "labor-type": {
            type: "select",
            index: 5,
            editable: false,
            uniqueKey: true,
        },
        "text-description": { type: "input", index: 6 },
    };
    constructor(
        laborLines: HTMLTableElement,
        laborForm: HTMLFormElement,
        formSection: HTMLElement,
        formTitle: HTMLElement,
        technicianSelect: HTMLSelectElement,
        laborTypeSelect: HTMLSelectElement,
        laborItemDesc: any,
        laborItemNumber: any,
        activityStartTimeDate: Date,
        activityEndTimeDate: Date
    ) {
        this.laborLines = laborLines;
        this.laborForm = laborForm;
        this.formSection = formSection;
        this.formTitle = formTitle;
        this.technicianSelect = technicianSelect;
        this.laborTypeSelect = laborTypeSelect;
        this.laborItemDesc = laborItemDesc;
        this.laborItemNumber = laborItemNumber;
        this.activityStartTimeDate = activityStartTimeDate;
        this.activityEndTimeDate = activityEndTimeDate;
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
            this.makeElementEditable(id);
        });
        this.trackStep("RESET", "END");
    }

    // Populate the technician dropdown
    populateTechnicianDropdown(teamMembers: any, resource: any): void {
        this.trackStep("POPULATE TECHNICIANS", "START");
        Object.entries(teamMembers).forEach(([key, member]: [string, any]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = member.pname;
            this.technicianSelect.appendChild(option);
        });

        if (resource) {
            const resourceOption = document.createElement("option");
            resourceOption.value = resource.pid;
            resourceOption.textContent = resource.pname;
            this.technicianSelect.appendChild(resourceOption);
        }
        this.trackStep("POPULATE TECHNICIANS", "END");
    }
    trackStep(action: string, step: string, additionalInfo: string = ""): void {
        console.debug(
            `LaborFormModel - ${action} of Form ${
                this.thisFormRow !== null
                    ? `Row ${this.thisFormRow + 1}`
                    : "New Row"
            }  Step : ${step} ${additionalInfo || ""}`
        );
    }
    // Populate the labor type dropdown
    populateLaborTypeDropdown(): void {
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
            const previousRow = this.laborLines.rows[rowNumber];
            this.trackStep(
                "SHOW",
                "START",
                `Row ${row || "row is null"} ${
                    previousRow || "previousRow is null"
                }`
            );
            this.thisFormRow = rowNumber - 1;
            Array.from(row.cells).forEach((cell, index) => {
                console.log(
                    `Cell Index: ${index},  Content: ${cell.textContent}`
                );
            });
            Object.entries(this.formCellsMapping).forEach(([id, config]) => {
                console.log(`Config: ${JSON.stringify(config)}`);
                const cellValue = row.cells[config.index].textContent || "";
                if (config.type === "select") {
                    this.setInputValue(
                        id,
                        row.cells[config.index].textContent || ""
                    );
                } else {
                    this.setInputValue(id, cellValue);
                }
                if ("editable" in config && !config.editable) {
                    this.makeElementReadOnly(id);
                }
            });
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
            .map(([id, config]) => {
                if (config.type === "select") {
                    const { value, description } = this.getSelectedElement(id);
                    return [description, value];
                } else {
                    return [this.getInputValue(id)];
                }
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
                        if (config.type === "select") {
                            return (
                                row.cells[config.index].textContent ===
                                this.getSelectedElement(id).value
                            );
                        } else {
                            return (
                                row.cells[config.index].textContent ===
                                this.getInputValue(id)
                            );
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
}
