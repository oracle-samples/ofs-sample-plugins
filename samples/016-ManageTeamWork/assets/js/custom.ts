/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSOpenMessage } from "@ofs-users/plugin";
// Create OFSOpenMessageCustom to extend OFSOpenMessage and include team
interface OFSOpenMessageCustom extends OFSOpenMessage {
    team: any;
    resource: any;
    activity: any;
}

export class CustomPlugin extends OFSPlugin {
    open(_data: OFSOpenMessageCustom) {
        const laborLines = document.getElementById(
            "labor-lines"
        ) as HTMLTableElement;
        const formSection = document.getElementById(
            "form-section"
        ) as HTMLElement;
        const formTitle = document.getElementById("form-title") as HTMLElement;
        const laborForm = document.getElementById(
            "labor-form"
        ) as HTMLFormElement;
        // The list of possible technicians is based on team members
        const teamMembers = _data.team?.teamMembers || {};
        const technicianSelect = document.getElementById(
            "technician-name"
        ) as HTMLSelectElement;

        // Populate the technician dropdown with team member names
        Object.entries(teamMembers).forEach(([key, member]: [string, any]) => {
            const option = document.createElement("option");
            option.value = member.external_id; // Capture external_id
            option.textContent = member.pname; // Show pname
            technicianSelect.appendChild(option);
        });

        // Add data.resource.pname and pid as an additional entry
        if (_data.resource) {
            const resourceOption = document.createElement("option");
            resourceOption.value = _data.resource.pid; // Capture pid
            resourceOption.textContent = _data.resource.pname; // Show pname
            technicianSelect.appendChild(resourceOption);
        }

        // Add main resource to the form
        const externalIdInput = document.createElement("input");
        externalIdInput.type = "hidden";
        externalIdInput.id = "external-id";
        laborForm.appendChild(externalIdInput);

        // Update external_id when technician changes
        technicianSelect.onchange = () => {
            const selectedOption =
                technicianSelect.options[technicianSelect.selectedIndex];
            externalIdInput.value = selectedOption.value;
        };
        let editIndex: number | null = null;
        const convertTime12to24 = (time12h: string): string => {
            const [time, modifier] = time12h.split(" ");

            let [hours, minutes] = time.split(":");

            if (hours === "12") {
                hours = "00";
            }

            if (modifier === "PM") {
                hours = `${parseInt(hours, 10) + 12}`;
            }

            return `${hours}:${minutes}:00`;
        };

        const convertTime24to12 = (time24h: string): string => {
            let [hours, minutes] = time24h.split(":").map(Number);
            const modifier = hours >= 12 ? "PM" : "AM";

            hours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
            return `${hours}:${minutes
                .toString()
                .padStart(2, "0")} ${modifier}`;
        };
        const gettimeinformat = (
            inputDate: Date,
            timeSeparator: " " | "T" = " "
        ): string => {
            return (
                timeSeparator +
                ("0" + inputDate.getHours()).slice(-2) +
                ":" +
                ("0" + inputDate.getMinutes()).slice(-2) +
                ":00"
            );
        };
        const gettimeinformaToSetHtml = (inputDate: Date): string => {
            return (
                ("0" + inputDate.getHours()).slice(-2) +
                ":" +
                ("0" + inputDate.getMinutes()).slice(-2)
            );
        };
        // Calculate default start and end time
        const getActivityTimeDatein24 = (
            _data: OFSOpenMessageCustom
        ): { activityStartTimeDate: Date; activityEndTimeDate: Date } => {
            let currentTimestampDate = new Date(_data.resource.currentTime);
            var etaFormated: string = convertTime12to24(_data.activity.ETA);

            let startTimestampDate = new Date(
                `${_data.activity.date} ${etaFormated}`.replace(" ", "T")
            );
            return {
                activityStartTimeDate: startTimestampDate,
                activityEndTimeDate: currentTimestampDate,
            };
        };

        const { activityStartTimeDate, activityEndTimeDate } =
            getActivityTimeDatein24(_data);

        const getInputValue = (id: string): string =>
            (document.getElementById(id) as HTMLInputElement).value;

        const setInputValue = (id: string, value: string): void => {
            (document.getElementById(id) as HTMLInputElement).value = value;
        };

        const resetForm = (): void => {
            // Console.log the labor form
            console.debug(`${this.tag} Labor Form:  ${laborForm}`);
            console.debug(
                `${this.tag} Labor Form:  ${
                    laborForm instanceof HTMLFormElement
                }`
            );
            (laborForm as HTMLFormElement).reset();
            // Adjust startTimeTxt and endTimeTxt to be just time compatible with start-time and end-time elements
            // Select the last 8 charaters of the string startTimeTxt

            setInputValue(
                "start-time",
                `${gettimeinformaToSetHtml(activityStartTimeDate)}`
            );
            setInputValue(
                "end-time",
                `${gettimeinformaToSetHtml(activityEndTimeDate)}`
            );
            console.debug(
                `${
                    this.tag
                } Labor Form Modified with start and end time with PAD ${gettimeinformaToSetHtml(
                    activityStartTimeDate
                )} and ${gettimeinformaToSetHtml(activityEndTimeDate)}`
            );
            editIndex = null;
        };

        const showForm = (
            action: "add" | "edit",
            index: number | null = null
        ): void => {
            formSection.style.display = "block";
            formTitle.textContent =
                action === "add" ? "Add Labor Line" : "Edit Labor Line";

            if (action === "edit" && index !== null) {
                editIndex = index;
                const row = laborLines.rows[index];
                [
                    "technician-name",
                    "start-time",
                    "end-time",
                    "labor-type",
                    "description",
                ].forEach((id, i) =>
                    setInputValue(id, row.cells[i].textContent || "")
                );
            } else {
                resetForm();
            }
        };

        const hideForm = (): void => {
            formSection.style.display = "none";
            resetForm();
        };

        const confirmForm = (): void => {
            const values = [
                getInputValue("technician-name"),
                getInputValue("start-time"),
                getInputValue("end-time"),
                getInputValue("labor-type"),
                getInputValue("description"),
            ];
            console.debug(
                `${this.tag} Confirm Form: ${JSON.stringify(
                    values
                )} and editIndex: ${editIndex}`
            );
            if (editIndex !== null) {
                const row = laborLines.rows[editIndex];
                values.forEach(
                    (value, i) => (row.cells[i].textContent = value)
                );
            } else {
                const row = laborLines.insertRow();
                values.forEach(
                    (value) => (row.insertCell().textContent = value)
                );

                const actionsCell = row.insertCell();
                actionsCell.appendChild(
                    createButton("Edit", "btn btn-secondary", () =>
                        showForm("edit", row.rowIndex - 1)
                    )
                );
                actionsCell.appendChild(
                    createButton("Delete", "btn btn-danger", () =>
                        laborLines.deleteRow(row.rowIndex - 1)
                    )
                );
            }
            console.debug(
                `${
                    this.tag
                } Updating the start and end time for the technician with these values: Technician Name: ${getInputValue(
                    "technician-name"
                )}, Start Time: ${getInputValue(
                    "start-time"
                )}, End Time: ${getInputValue(
                    "end-time"
                )}, Labor Type: ${getInputValue(
                    "labor-type"
                )}, Description: ${getInputValue("description")}`
            );
            hideForm();
        };

        const createButton = (
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

        // Assign the right functions to the buttons in the form
        document.getElementById("add-button")!.onclick = () => showForm("add");
        document.getElementById("hide-button")!.onclick = hideForm;
        document.getElementById("confirm-button")!.onclick = confirmForm;
    }
}
