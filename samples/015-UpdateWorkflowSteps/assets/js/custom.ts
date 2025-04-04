/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */
const keysToRemove: string[] = [
    "aid",
    "activityId",
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
declare global {
    var initMessage: string;
    var applicationKey: any;
    var restUrl: any;
}
import {
    OFSPlugin,
    OFSMessage,
    OFSOpenMessage,
    OFSCallProcedureResultMessage,
} from "@ofs-users/plugin";

import { OFSSearchForActivitiesParams, OFSResponse } from "@ofs-users/proxy";

class OFSCustomOpenMessage extends OFSOpenMessage {
    activity: any;
    openParams: any;
    resource: any;
}
class OFSCustomInitMessage extends OFSMessage {
    applications: any;
}
export class CustomPlugin extends OFSPlugin {
    updateResult(data: OFSCustomOpenMessage): void {
        console.info(`${this.tag} :  UPDATE RESULT`);
        var dataToSend = {
            backScreen: "start_activity",
            backActivityId: data.activity.aid,
        };
        this.close(dataToSend); // Close the current activity and redirect to start_activity
    }
    async open(data: OFSCustomOpenMessage) {
        console.info(`${this.tag} :  OPEN`);
        console.debug(
            `${this.tag} :  Message Received ${JSON.stringify(data)}`
        );
        if (this.proxy) {
            // prepare OFSGetActivitiesParams to invoke proxy.getActivities

            // Capture error and trace
            var finalStatus = data.openParams.final_status; // Get the final status from securedData
            var maxDays = data.securedData.max_days_to_check;
            var masterActivityId = data.securedData.master_activity_id_property;
            if (!masterActivityId) {
                console.error(
                    `${this.tag} : master_activity_id_property is not defined in securedData. Cannot proceed with workflow step update.`
                );
                alert(
                    `master_activity_id_property is not defined in securedData. Please check the logs.`
                );
                return false;
            }
            if (!data.activity[masterActivityId]) {
                console.error(
                    `${this.tag} : ${masterActivityId} is not included on the activity input data. Cannot proceed with workflow step update.`
                );
                alert(
                    `${masterActivityId} is not included on the activity input data. Please check the logs.`
                );
                return false;
            }
            var stepPropertiesText = data.securedData.workflow_steps_properties;
            var stepProperties: string[] = [];
            if (stepPropertiesText && typeof stepPropertiesText === "string") {
                stepProperties = stepPropertiesText
                    .split(",")
                    .map((prop) => prop.trim());
            }

            // Current date in YYYY-MM-DD format
            const currentDate = new Date();
            const finalDate: string = currentDate.toISOString().split("T")[0]; // Get YYYY-MM-DD format
            // currentDate - maxDays in the past to search for activities
            const initialDate: string = new Date(
                currentDate.getTime() - maxDays * 24 * 60 * 60 * 1000
            )
                .toISOString()
                .split("T")[0]; // Get YYYY-MM-DD format
            var fields: string[] = ["activityId", masterActivityId];
            // Add the step properties to the fields to search for
            fields = fields.concat(stepProperties);
            // Convert to comma-separated string for the search
            const fieldsToSearch = fields.join(",");
            var searchForActivitiesParams: OFSSearchForActivitiesParams = {
                searchForValue: data.activity[masterActivityId],
                searchInField: masterActivityId,
                dateFrom: initialDate,
                dateTo: finalDate,
                fields: fieldsToSearch, // Use the fields we constructed above
            };
            console.debug(
                `${this.tag} :  Activities Search ${JSON.stringify(
                    searchForActivitiesParams
                )}`
            );
            var result = await this.proxy.searchForActivities(
                searchForActivitiesParams,
                0,
                100
            );
            if (result.status >= 400 || result.status === -1) {
                // Handle the error from the search
                console.error(
                    `${
                        this.tag
                    } : Error searching for activities with apptNumber ${masterActivityId}=${
                        data.activity[masterActivityId]
                    }. Received: ${JSON.stringify(result)}`
                );
                alert(
                    `Problems searching for existing activities with apptNumber ${masterActivityId}=${data.activity[masterActivityId]}. Please check the logs.`
                );
                // Break the loop and return false to indicate failure
                return false;
            }
            console.debug(
                `${
                    this.tag
                } : Searching for existing activities with apptNumber ${masterActivityId}=${
                    data.activity[masterActivityId]
                }. Result: ${JSON.stringify(result)}`
            );
            var activityData: any = {}; // Initialize an object to hold the activity data to update
            activityData.aid = data.activity.aid; // Ensure we are updating the correct activity

            if (finalStatus) {
                activityData.astatus = finalStatus; // Preserve the current status of the activity
            }
            if (result.data) {
                result.data.items.forEach((activity: any) => {
                    console.debug(
                        `${this.tag} : Found one item ${JSON.stringify(
                            activity
                        )}`
                    );
                    // if any of the properties in stepProperties has a value in the activity, add it to the stepsFound array
                    if (activity && typeof activity === "object") {
                        console.debug(`${this.tag} : the item is an object`);
                        for (let i = 0; i < stepProperties.length; i++) {
                            if (activity[stepProperties[i]]) {
                                console.debug(
                                    `${
                                        this.tag
                                    } : Lets' check step property ${i} : ${
                                        stepProperties[i]
                                    } in activity with value '${
                                        activity[stepProperties[i]]
                                    }'`
                                );
                                // Check if the property exists in the activity and = "1"
                                if (activity[stepProperties[i]] === 1) {
                                    console.debug(
                                        `${this.tag} : The property ${i} : ${stepProperties[i]} has the value so I am adding it to the activityData object.`
                                    );
                                    // Add the activity to the stepsFound array
                                    activityData[stepProperties[i]] =
                                        activity[stepProperties[i]]; // Capture the property value to update in the main activity
                                    // Remove this step from the stepProperties as it has already been found
                                    stepProperties.splice(i, 1); // Remove the found property from the array
                                    break; // Break the loop once a match is found for this activity
                                }
                            }
                        }
                    }
                }); // End of forEach loop for activities
            }

            var activityList: any = {}; // Initialize an array to hold the activities to update
            activityList[activityData.aid] = activityData; // Add the main activity to the list to update
            var dataToSend: any = {
                activityList: activityList,
            };
            if (finalStatus) {
                this.close(dataToSend); // Preserve the current status of the activity
            } else {
                this.update(dataToSend);
            }
        } else {
            alert(
                "Proxy not available. Review if you have included an application in the plugin configuration and it you have, review the logs for any errors."
            );
            this.close();
            throw new Error(
                "Proxy not available. Review if you have included an application in the plugin configuration and it you have, review the logs for any errors."
            );
        }
    }
}
