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
    var pluginActionAfterUpdate: PluginActions;
    var activityToManage: string;
    var debriefPluginLabel: string;
    var invtype: string;
    var laborServiceActivity: string;
    var inventoryElementsToCreate: InventoryItemElement[];
    var inventoryElementsToDelete: InventoryItemElement[];
}
// Declare a constant to define list of possible actionsAtReturn DEBRIEF, CLOSE, NONE
const PLUGIN_ACTIONS = {
    CREATE_DELETE: "CREATE_DELETE",
    UPDATE: "UPDATE",
    DEBRIEF: "DEBRIEF",
    CLOSE: "CLOSE",
    NONE: "NONE",
    STOP: "STOP",
} as const;

type PluginActions = (typeof PLUGIN_ACTIONS)[keyof typeof PLUGIN_ACTIONS];

export class CustomPlugin extends OFSPlugin {
    updateResult(_data: OFSOpenMessageCustom) {
        console.info(`${this.tag} :  UPDATE RESULT`);
        var plugin = this;
        const inventoryData = new Inventory(_data.inventoryList);
        var nextAction: PluginActions = PLUGIN_ACTIONS.CREATE_DELETE;
        // Handle all possible values of globalThis.pluginActionAfterUpdate
        switch (globalThis.pluginActionAfterUpdate) {
            case PLUGIN_ACTIONS.STOP:
                nextAction = PLUGIN_ACTIONS.NONE;
                break;
        }

        this.sendNextInventoryMessage(
            _data,
            inventoryData,
            inventoryElementsToCreate,
            [],
            inventoryElementsToDelete,
            nextAction,
            globalThis.pluginActionAfterUpdate
        );
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
        // Eliminate elements which inv_aid is not the same as activity.aid
        let inventoryElementsCleaned: InventoryItem[] =
            inventoryElements.filter(
                (element: InventoryItem) =>
                    element.inv_aid == _data.activity.aid
            );
        console.debug(
            `${this.tag} : Inventory elements for ${
                globalThis.invtype
            } and activity ${
                _data.activity.aid
            } found in the install pool after filtering by aid : [${JSON.stringify(
                inventoryElementsCleaned
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

        document.getElementById("debrief-button")!.onclick = () => {
            const {
                inventoryElementsToCreate,
                inventoryElementsToUpdate,
                inventoryElementsToDelete,
            } = laborFormModel.getAllInventoryElements();
            globalThis.inventoryElementsToCreate = inventoryElementsToCreate;
            globalThis.inventoryElementsToDelete = inventoryElementsToDelete;
            this.sendNextInventoryMessage(
                _data,
                inventoryData,
                inventoryElementsToCreate,
                inventoryElementsToUpdate,
                inventoryElementsToDelete,
                PLUGIN_ACTIONS.UPDATE,
                PLUGIN_ACTIONS.DEBRIEF
            );
        };
        document.getElementById("save-button")!.onclick = () => {
            const {
                inventoryElementsToCreate,
                inventoryElementsToUpdate,
                inventoryElementsToDelete,
            } = laborFormModel.getAllInventoryElements();
            globalThis.inventoryElementsToCreate = inventoryElementsToCreate;
            globalThis.inventoryElementsToDelete = inventoryElementsToDelete;
            this.sendNextInventoryMessage(
                _data,
                inventoryData,
                inventoryElementsToCreate,
                inventoryElementsToUpdate,
                inventoryElementsToDelete,
                PLUGIN_ACTIONS.UPDATE,
                PLUGIN_ACTIONS.NONE
            );
        };
        document.getElementById("cancel-button")!.onclick = () => {
            this.close();
        };
    }
    sendNextInventoryMessage(
        _data: OFSOpenMessageCustom,
        inventoryData: Inventory,
        inventoryElementsToCreate: InventoryItemElement[],
        inventoryElementsToUpdate: InventoryItemElement[],
        inventoryElementsToDelete: InventoryItemElement[],
        currentAction: PluginActions,
        actionAfterUpdate: PluginActions
    ) {
        // Switch for all possible values of currentAction
        switch (currentAction) {
            case PLUGIN_ACTIONS.UPDATE:
                if (inventoryElementsToUpdate.length > 0) {
                    let activityToUpdate = {
                        aid: _data.activity.aid,
                    };
                    let dataToSend: any = {
                        activity: activityToUpdate,
                        inventoryList: inventoryData.getInventoryListToUpdate(
                            inventoryElementsToUpdate
                        ),
                    };
                    globalThis.pluginActionAfterUpdate = actionAfterUpdate;
                    this.update(dataToSend);
                }
                break;
            case PLUGIN_ACTIONS.CREATE_DELETE:
                let actions: any = {};
                if (inventoryElementsToCreate.length > 0) {
                    actions = inventoryData.getActions(
                        inventoryElementsToCreate,
                        "create"
                    );
                }
                if (inventoryElementsToDelete.length > 0) {
                    // add inventoryData.getActions(inventoryElementsToDelete, "delete") to actions
                    actions = {
                        ...actions,
                        ...inventoryData.getActions(
                            inventoryElementsToDelete,
                            "delete"
                        ),
                    };
                }
                let dataToSend: any = {
                    activity: _data.activity,
                    actions: actions,
                };
                if (actionAfterUpdate === PLUGIN_ACTIONS.DEBRIEF) {
                    dataToSend.backScreen = "plugin_by_label";
                    dataToSend.backPluginLabel = globalThis.debriefPluginLabel;
                    this.close(dataToSend);
                } else if (actionAfterUpdate === PLUGIN_ACTIONS.CLOSE) {
                    this.close(dataToSend);
                } else if (actionAfterUpdate === PLUGIN_ACTIONS.NONE) {
                    globalThis.pluginActionAfterUpdate = PLUGIN_ACTIONS.STOP;
                    this.update(dataToSend);
                }

                break;
            case PLUGIN_ACTIONS.DEBRIEF:
                console.error(
                    `${this.tag} : DEBRIEF is not a valid current action`
                );
                break;
            case PLUGIN_ACTIONS.CLOSE:
                console.log(
                    `${this.tag} : CLOSE is not a valid current action`
                );
                break;
            case PLUGIN_ACTIONS.NONE:
                break;
            default:
                console.error(`${this.tag} : Unknown action ${currentAction}`);
        }
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
