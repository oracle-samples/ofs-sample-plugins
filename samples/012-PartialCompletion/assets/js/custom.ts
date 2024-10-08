/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { OFS, OFSResponse } from "@ofs-users/proxy";

class OFSCustomOpenMessage extends OFSOpenMessage {
    inventoryList: any;
    activity: any;
    resource: any;
    activityList: any;
    openParams: any;
}
export class OFSCustomInitMessage extends OFSMessage {
    attributeDescription: { [key: string]: OFSInitAttributeDescriptionItem } =
        {};
}

interface OFSInitAttributeDescriptionItem {
    enum: { [key: string]: WorkTypeEnumItem };
}

interface WorkTypeEnumItem {
    label: string;
    text: string;
}
class OFSError {
    type?: string;
    code?: string;
    entity?: string;
    entityId?: string;
    actionId?: number;
}

class OFSErrorMessage extends OFSMessage {
    errors: OFSError[] = [];
}

declare global {
    var actionAtReturn: any;
    var partialCompletionActivityType: string;
}
enum Method {
    Close = "close",
    Open = "open",
    Update = "update",
    UpdateResult = "updateResult",
    Init = "init",
    Ready = "ready",
    InitEnd = "initEnd",
}

enum actionAtReturn {
    SUSPEND = "SUSPEND",
    POST_SUSPENSION = "POST_SUSPENSION",
    MAKE_NON_SCHEDULE = "MAKE_NON_SCHEDULE",
    NOT_VALID = "NOT_VALID",
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class CustomPlugin extends OFSPlugin {
    prepare_activity_to_suspend(data: any) {
        console.debug(
            `${this.tag} : I have recovered  workTypes ${this.getInitProperty(
                "worktypesList"
            )} work types`
        );
        var worktypesList: WorkTypeEnumItem[] = JSON.parse(
            this.getInitProperty("worktypesList")
        ) as WorkTypeEnumItem[];
        console.debug(
            `${this.tag} : I have recovered  ${worktypesList.length} work types`
        );
        // Loop through all the worktypesList items
        for (var i = 0; i < worktypesList.length; i++) {
            var worktype: WorkTypeEnumItem = worktypesList[i];
            // Perform operations on each worktype
            console.debug(
                `${this.tag} Worktype ${i}: ${worktype.label}: '${worktype.text}'`
            );
        }
        var worktypeDescription = worktypesList.find(
            (worktype) => worktype.label === data.activity.aworktype
        )?.text;
        console.debug(
            `${this.tag} : Worktype Description ${worktypeDescription}`
        );
        let activityToUpdate = {
            aid: data.activity.aid,
            A_ORIGINAL_WORK_TYPE_LABEL: data.activity.aworktype,
            A_ORIGINAL_WORK_TYPE_DESC: worktypeDescription,
            aworktype: globalThis.partialCompletionActivityType,
        };
        var dataToSend = {
            activity: activityToUpdate,
        };
        globalThis.actionAtReturn = actionAtReturn.SUSPEND;
        this.update(dataToSend);
    }
    suspend_started_activity(data: any) {
        let activityToUpdate = {
            aid: data.activity.aid,
            astatus: "suspended",
        };
        var dataToSend = {
            activity: activityToUpdate,
        };
        globalThis.actionAtReturn = actionAtReturn.POST_SUSPENSION;
        this.update(dataToSend);
    }
    post_suspend(data: any) {
        let activityToUpdate = {
            aid: data.activity.aid,
            aworktype: data.activity.A_ORIGINAL_WORK_TYPE_LABEL,
        };
        var dataToSend = {
            activity: activityToUpdate,
            //   wakeupNeeded: true,
            //   wakeOnEvents: {
            //       timer: { wakeupDelay: 10, sleepTimeout: 1800 },
            //   },
        };
        //globalThis.actionAtReturn = actionAtReturn.MAKE_NON_SCHEDULE;
        this.close(dataToSend);
    }
    async make_non_schedule(data: any) {
        // This section is not working so it is not used at this moment
        let dataToMove = {
            setDate: {
                date: null,
            },
        };
        if (this.proxy) {
            try {
                var result = await this.proxy.moveActivity(
                    data.activity.aid,
                    dataToMove
                );
                console.debug(
                    `${this.tag} Activity updated: ${JSON.stringify(result)}`
                );
            } catch (error) {
                console.error(`${this.tag} Error updating activity: ${error}`);
            }
        } else {
            console.error(`${this.tag} Proxy is not available`);
        }
        this.close();
    }
    async wakeup(data: OFSMessage) {
        console.debug(`${this.tag} : Wake up message`);
        this.make_non_schedule(data);
    }
    async updateResult(data: OFSOpenMessage) {
        console.debug(`${this.tag} : Action ${globalThis.actionAtReturn}`);
        var plugin = this;
        if (globalThis.actionAtReturn == null) {
            globalThis.actionAtReturn = "NOT_VALID";
        }
        if (globalThis.actionAtReturn == actionAtReturn.SUSPEND) {
            await sleep(100);
            this.suspend_started_activity(data);
        } else if (
            globalThis.actionAtReturn == actionAtReturn.POST_SUSPENSION
        ) {
            await sleep(100);
            this.post_suspend(data);
        } else if (
            globalThis.actionAtReturn == actionAtReturn.MAKE_NON_SCHEDULE
        ) {
            alert(
                `¡Global Action value ${globalThis.actionAtReturn} has not been implemented yet `
            );
            //await sleep(1000);
            //this.make_non_schedule(data);
        } else {
            console.log(
                `${plugin.tag} Global Action value ${globalThis.actionAtReturn} is not valid `
            );
        }
    }
    init(message: OFSCustomInitMessage): void {
        console.debug(`${this.tag} : Init`);
        var attributeDescription: {
            [key: string]: OFSInitAttributeDescriptionItem;
        } = message.attributeDescription;
        // Loop through all the attributeDescription objects
        for (var key in attributeDescription) {
            if (attributeDescription.hasOwnProperty(key)) {
                if (key == "aworktype") {
                    var worktypesList: WorkTypeEnumItem[] = [];
                    for (var worktype in attributeDescription[key].enum) {
                        worktypesList.push(
                            attributeDescription[key].enum[worktype]
                        );
                        console.debug(
                            `${this.tag} : Worktype Label[${worktype}]-- ${attributeDescription[key].enum[worktype].label}-'${attributeDescription[key].enum[worktype].text}' added`
                        );
                    }
                    console.debug(
                        `${this.tag} : I have added ${worktypesList.length} work types`
                    );
                    // Perform operations on each attribute
                    this.storeInitProperty(
                        "worktypesList",
                        JSON.stringify(worktypesList)
                    );
                }
            }
        }
        console.debug(
            `${this.tag} : Init data Stored ${this.getInitProperty(
                "worktypesList"
            )}`
        );
    }
    // Presentation functions
    open(data: OFSCustomOpenMessage) {
        var plugin = this;

        var partialCompletionActivityType: string = "";
        for (var param in data.securedData) {
            if (param == "partialCompletionActivityType") {
                partialCompletionActivityType =
                    data.securedData.partialCompletionActivityType;
            }
        }
        for (var param in data.openParams) {
            if (param == "partialCompletionActivityType") {
                partialCompletionActivityType =
                    data.openParams.partialCompletionActivityType;
            }
        }
        globalThis.partialCompletionActivityType =
            partialCompletionActivityType;

        if (data.activity.astatus == "started") {
            console.debug(`${this.tag} : First step Preparing to Suspend`);
            this.prepare_activity_to_suspend(data);
        } else {
            alert("You can't partially complete a non-started activity");
            this.close();
        }
    }
}
