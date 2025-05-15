/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import {
    OFSActivityResponse,
    ActivityResponse,
    OFSBulkUpdateRequest,
    OFSResponse,
} from "@ofs-users/proxy";

// Create a ActivityResponseCustom object to be able to use apptNumber property
export interface ActivityResponseCustom extends ActivityResponse {
    apptNumber: string;
}
class OFSCustomOpenMessage extends OFSOpenMessage {
    activity: any;
    openParams: any;
    resource: any;
}

const keysToRemove: string[] = [
    "aid",
    "activityId",
    "date",
    "status",
    "createdBy",
    "createdDate",
    "resourceInternalId",
    "linkedActivities",
    "startTime",
    "endTime",
    "resouceTimeZone",
    "resourceTimeZoneIANA",
    "resourceTimeZoneDiff",
    "requiredInventories",
    "resourcePreferences",
    "workSkills",
    "timeZone",
    "workZone",
    "capacityCategories",
    "links",
];
export class CustomPlugin extends OFSPlugin {
    open(data: OFSCustomOpenMessage) {
        if (this.proxy) {
            this.createActivity(data);
        } else {
            console.debug(
                `${this.tag} : Proxy not available. The plugin framework option will be implemented instead`
            );
            var activityData = data.activity;
            keysToRemove.forEach((key) => {
                if (key in activityData) {
                    delete activityData[key];
                }
            });
            var properties = activityData;
            var activityEntity = {
                entity: "activity",
                action: "create",
                activityType: activityData.aworktype,
                scheduled: false,
                properties,
            };
            var dataToSend: any = { actions: [activityEntity] };
            this.close(dataToSend);
        }
    }
    async createActivity(data: any) {
        var activityResponse: OFSActivityResponse =
            await this.proxy.getActivityDetails(data.activity.aid);
        console.debug(
            `${this.tag} : Activity data to create: ${JSON.stringify(
                activityResponse
            )}`
        );
        keysToRemove.forEach((key) => {
            if (key in activityResponse.data) {
                delete (activityResponse.data as any)[key];
            }
        });

        var bulkUpdateData: OFSBulkUpdateRequest = {
            activities: [activityResponse.data],
            updateParameters: {
                identifyActivityBy: "apptNumber",
                ifExistsThenDoNotUpdateFields: [],
                ifInFinalStatusThen: "doNothing",
            },
        };
        console.debug(
            `${
                this.tag
            } : Activity will be created with this information : ${JSON.stringify(
                bulkUpdateData
            )}`
        );
        var response: OFSResponse = await this.proxy.bulkUpdateActivity(
            bulkUpdateData
        );
        if (response.status >= 400 || response.status === -1) {
            var errorMessage =
                `${response.data.results || ""}` ||
                `Technical error with description {${response.description}} retrieving activities` ||
                `Technical error with status {${response.status}} retrieving activities`;
            alert(`Problems creating the activity ${errorMessage}`);
            console.error(
                `${this.tag} : Error Received ${JSON.stringify(response)}`
            );
            this.close();
        } else {
            // Cast data as ActivityResponseCustom
            alert(`Activity cloned or updated successfully`);
            console.debug(
                `${
                    this.tag
                } : Activity cloned or updated successfully ${JSON.stringify(
                    response
                )}`
            );
            this.close();
        }
    }
}
