/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSOpenMessage, OFSInitMessage } from "@ofs-users/plugin";
import { LaborFormModel } from "./models/FormModel";
import {
    Inventory,
    InventoryItem,
    InventoryItemElement,
} from "./models/InventoryModel";
// Create OFSOpenMessageCustom to extend OFSOpenMessage and include team
interface OFSOpenMessageCustom extends OFSOpenMessage {
    team: any;
    resource: any;
    activity: any;
    inventoryList: any;
    openParams: any;
}
// Create OFSInitMessageCustom to extend OFSInitMessage and include additional properties
interface OFSInitMessageCustom extends OFSInitMessage {
    attributeDescription: any;
}

declare global {
    var actionAtReturn: any;
    var activityToManage: string;
    var debriefPluginLabel: string;
    var invtype: string;
    var laborServiceActivity: string;
}

export class CustomPlugin extends OFSPlugin {
    updateResult(data: OFSOpenMessageCustom) {
        var plugin = this;
        if (globalThis.actionAtReturn == null) {
            globalThis.actionAtReturn = "NOT_VALID";
        }
        if (globalThis.actionAtReturn == "DEBRIEF") {
            let dataToSend = {
                backScreen: "plugin_by_label",
                backPluginLabel: globalThis.debriefPluginLabel,
            };
            this.close(dataToSend);
        } else {
            console.log(
                `${plugin.tag} Global Action value ${globalThis.actionAtReturn} is not valid `
            );
        }
    }
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
        for (var param in _data.securedData) {
            if (param == "debriefPluginLabel") {
                globalThis.debriefPluginLabel =
                    _data.securedData.debriefPluginLabel;
            } else if (param == "invtype") {
                globalThis.invtype = _data.securedData.invtype;
            } else if (param == "laborServiceActivity") {
                globalThis.laborServiceActivity =
                    _data.securedData.laborServiceActivity;
            }
        }
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
        const getTeam = (): any => {
            let teamMembers = _data.team?.teamMembers || {};
            const resource = _data.resource;

            if (resource) {
                teamMembers[resource.pid] = { pname: resource.pname };
            }

            return teamMembers;
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
            teamList: any;
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
                teamList: getTeam(),
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
            teamList,
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
        const inventoryData = new Inventory(_data.inventoryList);
        const { activityStartTimeDate, activityEndTimeDate } =
            getActivityTimeDatein24(_data);
        var inventoryElements: InventoryItem[] = inventoryData.find_like(
            new InventoryItemElement({
                invtype: globalThis.invtype,
                invpool: "install",
                inv_aid: _data.activity.aid as number,
            })
        );
        console.debug(
            `${this.tag} : Inventory elements for ${
                globalThis.invtype
            } and activity ${
                _data.activity.aid
            } found in the install pool : [${JSON.stringify(
                inventoryElements
            )} compared to the total inventory elements ${
                inventoryData.data().length
            }`
        );
        const laborFormModel = new LaborFormModel({
            laborLines: laborLines,
            laborForm: laborForm,
            formSection: formSection,
            formTitle: formTitle,
            technicianSelect: technicianSelect,
            laborTypeSelect: laborTypeSelect,
            laborItemDesc: laborItemDesc,
            laborItemNumber: laborItemNumber,
            activityStartTimeDate: activityStartTimeDate,
            activityEndTimeDate: activityEndTimeDate,
            invtype: globalThis.invtype,
            activity: _data.activity,
            team: teamList,
            resource: _data.resource,
            laborServiceActivity: globalThis.laborServiceActivity,
            inventoryItemElements: inventoryElements,
        });

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
        const executeAndReturnElements = (): {
            inventoryElementsToCreate: InventoryItemElement[];
            inventoryElementsToUpdate: InventoryItemElement[];
            inventoryElementsToDelete: InventoryItemElement[];
        } => {
            return {
                inventoryElementsToCreate:
                    laborFormModel.getInventoryElementsToCreate(),
                inventoryElementsToUpdate:
                    laborFormModel.getInventoryElementsToUpdate(),
                inventoryElementsToDelete:
                    laborFormModel.getInventoryElementsToDelete(),
            };
        };
        document.getElementById("debrief-button")!.onclick = () => {
            const {
                inventoryElementsToCreate,
                inventoryElementsToUpdate,
                inventoryElementsToDelete,
            } = executeAndReturnElements();
            if (inventoryElementsToUpdate.length > 0) {
                const elementsToUpdate = inventoryData.generateActionsJson(
                    inventoryElementsToUpdate
                );
                console.debug(
                    `${
                        this.tag
                    } : Inventory elements to update: ${inventoryElementsToUpdate}  (stringified): ${JSON.stringify(
                        elementsToUpdate
                    )}`
                );
            } else if (inventoryElementsToCreate.length > 0) {
                inventoryData.generateActionsJson(inventoryElementsToCreate);
                let dataToSend = {
                    activity: _data.activity,
                    actions: inventoryData.generateActionsJson(
                        inventoryElementsToCreate
                    ),
                    backScreen: "plugin_by_label",
                    backPluginLabel: debriefPluginLabel,
                };
                this.close(dataToSend);
            }
            if (inventoryElementsToDelete.length > 0) {
                const elementsToDelete = inventoryData.generateActionsJson(
                    inventoryElementsToDelete
                );
                console.log(
                    `${
                        this.tag
                    } : Inventory elements to update: ${inventoryElementsToDelete}  (stringified): ${JSON.stringify(
                        elementsToDelete
                    )}`
                );
            }
        };
        document.getElementById("save-button")!.onclick = () => {
            const {
                inventoryElementsToCreate,
                inventoryElementsToUpdate,
                inventoryElementsToDelete,
            } = executeAndReturnElements();
            if (inventoryElementsToCreate.length > 0) {
                inventoryData.generateActionsJson(inventoryElementsToCreate);
                let dataToSend = {
                    activity: _data.activity,
                    actions: inventoryData.generateActionsJson(
                        inventoryElementsToCreate
                    ),
                };
                this.close(dataToSend);
            }
        };
        document.getElementById("cancel-button")!.onclick = () => {
            this.close();
        };
    }
    save(_data: OFSOpenMessageCustom) {
        // Removed unused variable declaration
        LaborFormModel;
        //var etaFormated: string = this.convertTime12to24(data.activity.ETA);

        /*
        let startTimestampDate = new Date(
            `${_data.activity.date} ${etaFormated}`.replace(" ", "T")
        );

        let startTimeTxt =
            "T" +
            ("0" + startTimestampDate.getHours()).slice(-2) +
            ":" +
            ("0" + startTimestampDate.getMinutes()).slice(-2) +
            ":00";

        if (laborItems.length > 0) {
            let activityToUpdate = {
            aid: _data.activity.aid,
            };
            let inventoryListObject: any = {};
            let inventoryItem: any = laborItems[0];
            (inventoryItem["labor_start_time"] = startTimeTxt),
            (inventoryItem["labor_end_time"] = endTimeTxt);
            inventoryListObject[laborItems[0]["invid"]] = inventoryItem;
            var dataToSend = {
            activity: activityToUpdate,
            inventoryList: inventoryListObject,
            };
            globalThis.actionAtReturn = "DEBRIEF";
            this.update(dataToSend);
        } else {
            var actions: any = [
            {
                entity: "inventory",
                action: "create",
                inv_pid: _data.resource.pid,
                inv_aid: _data.activity.aid,
                invtype: laborInvType,
                invpool: "install",
                properties: {
                I_DEFAULT_VALUE: "1",
                labor_start_time: startTimeTxt,
                labor_end_time: endTimeTxt,
                labor_item_number: laborItemNumber,
                labor_item_description: laborItemDesc,
                labor_service_activity: laborServActivity,
                },
            },
            ];
            let dataToSend = {
            activity: _data.activity,
            actions: actions,
            backScreen: "plugin_by_label",
            backPluginLabel: debriefPluginLabel,
            };
            this.close(dataToSend);
        }
        */
    }
}
