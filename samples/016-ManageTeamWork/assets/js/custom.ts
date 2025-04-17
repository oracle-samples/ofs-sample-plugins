/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSOpenMessage, OFSInitMessage } from "@ofs-users/plugin";
import { LaborFormModel } from "./FormModel";
// Create OFSOpenMessageCustom to extend OFSOpenMessage and include team
interface OFSOpenMessageCustom extends OFSOpenMessage {
    team: any;
    resource: any;
    activity: any;
}
// Create OFSInitMessageCustom to extend OFSInitMessage and include additional properties
interface OFSInitMessageCustom extends OFSInitMessage {
    attributeDescription: any;
}
export class CustomPlugin extends OFSPlugin {
    init(message: OFSInitMessageCustom) {
        console.info(`${this.tag} :  INIT`);
        this.storeInitProperty(
            "labor_item_desc",
            JSON.stringify(message.attributeDescription.labor_item_desc)
        );
        this.storeInitProperty(
            "labor_item_number",
            JSON.stringify(message.attributeDescription.labor_item_number)
        );
        // check status of initproperties after evaluating init
    }
    open(_data: OFSOpenMessageCustom) {
        console.info(`${this.tag} :  OPEN`);
        // The list of possible technicians is based on team members

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
        const getElements = (): {
            laborLines: HTMLTableElement;
            formSection: HTMLElement;
            formTitle: HTMLElement;
            laborForm: HTMLFormElement;
            technicianSelect: HTMLSelectElement;
            laborTypeSelect: HTMLSelectElement;
            laborItemDesc: any;
            laborItemNumber: any;
        } => {
            return {
                laborLines: document.getElementById(
                    "labor-lines"
                ) as HTMLTableElement,
                formSection: document.getElementById(
                    "form-section"
                ) as HTMLElement,
                formTitle: document.getElementById("form-title") as HTMLElement,
                laborForm: document.getElementById(
                    "labor-form"
                ) as HTMLFormElement,
                laborItemDesc: JSON.parse(
                    this.getInitProperty("labor_item_desc")
                ) as any,
                laborItemNumber: JSON.parse(
                    this.getInitProperty("labor_item_number")
                ) as any,
                technicianSelect: document.getElementById(
                    "technician-name"
                ) as HTMLSelectElement,
                laborTypeSelect: document.getElementById(
                    "labor-type"
                ) as HTMLSelectElement,
            };
        };
        const {
            laborLines,
            formSection,
            formTitle,
            laborForm,
            technicianSelect,
            laborTypeSelect,
            laborItemDesc,
            laborItemNumber,
        } = getElements();

        if (
            !laborLines ||
            !formSection ||
            !formTitle ||
            !laborForm ||
            !technicianSelect ||
            !laborTypeSelect
        ) {
            console.error(
                `${this.tag} : One or more required DOM elements are missing.`
            );
            return;
        }
        // Eliminate key from laborItemDesc.enum that are not in laborItemNumber.enum
        laborItemDesc.enum = Object.fromEntries(
            Object.entries(laborItemDesc.enum).filter(
                ([key, value]: [string, any]) =>
                    laborItemNumber.enum[key] !== undefined
            )
        );
        const { activityStartTimeDate, activityEndTimeDate } =
            getActivityTimeDatein24(_data);
        const laborFormModel = new LaborFormModel(
            laborLines,
            laborForm,
            formSection,
            formTitle,
            technicianSelect,
            laborTypeSelect,
            laborItemDesc,
            laborItemNumber,
            activityStartTimeDate,
            activityEndTimeDate
        );

        // Example usage
        laborFormModel.resetForm();
        laborFormModel.populateTechnicianDropdown(
            _data.team?.teamMembers,
            _data.resource
        );
        laborFormModel.populateLaborTypeDropdown();

        // Assign the right functions to the buttons in the form
        document.getElementById("add-button")!.onclick = () => {
            laborFormModel.showForm("add");
        };
        document.getElementById("hide-button")!.onclick = () => {
            laborFormModel.hideForm();
        };
        document.getElementById("confirm-button")!.onclick = () => {
            // console.log that I have clicked on confirm button
            laborFormModel.confirmForm();
        };

        document.getElementById("debrief-button")!.onclick = () => {
            this.close();
        };
        document.getElementById("save-button")!.onclick = () => {
            this.close();
        };
        document.getElementById("cancel-button")!.onclick = () => {
            this.close();
        };
    }
}
