export class LaborFormModel {
    private laborForm: HTMLFormElement;
    private technicianSelect: HTMLSelectElement;
    private laborTypeSelect: HTMLSelectElement;
    private laborItemDesc: any;
    private laborItemNumber: any;

    constructor(
        laborForm: HTMLFormElement,
        technicianSelect: HTMLSelectElement,
        laborTypeSelect: HTMLSelectElement,
        laborItemDesc: any,
        laborItemNumber: any
    ) {
        this.laborForm = laborForm;
        this.technicianSelect = technicianSelect;
        this.laborTypeSelect = laborTypeSelect;
        this.laborItemDesc = laborItemDesc;
        this.laborItemNumber = laborItemNumber;
    }

    // Reset the form to its initial state
    resetForm(activityStartTimeDate: Date, activityEndTimeDate: Date): void {
        this.laborForm.reset();
        this.setInputValue(
            "start-time",
            this.formatTime(activityStartTimeDate)
        );
        this.setInputValue("end-time", this.formatTime(activityEndTimeDate));
    }

    // Populate the technician dropdown
    populateTechnicianDropdown(teamMembers: any, resource: any): void {
        Object.entries(teamMembers).forEach(([key, member]: [string, any]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = member.name;
            this.technicianSelect.appendChild(option);
        });

        if (resource) {
            const resourceOption = document.createElement("option");
            resourceOption.value = resource.pid;
            resourceOption.textContent = resource.pname;
            this.technicianSelect.appendChild(resourceOption);
        }
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
}
