/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

interface OFSOpenMessageCustom extends OFSOpenMessage {
    team: any;
    resource: any;
    activity: any;
    inventoryList: any;
    openParams: any;
}

export class CustomPlugin extends OFSPlugin {
    open(_data: OFSOpenMessageCustom) {
        let teamMembers = _data.team?.teamMembers || {};
        // For all elements in the team, set the properties starting with A_TEAM_PROPERTIES_pname_1 = member.pname and  A_TEAM_PROPERTIES_pid_1 = key
        let index = 1;
        let activityData: any = { aid: _data.activity.aid };
        // Read secure paramenters maxNumberOfassistants and propertiesPrefix
        let maxNumberOfassistants: number = 5;
        let propertiesPrefix: string = "A_TEAM_PROPERTIES_";
        // Check if the secure parameters are set
        for (var param in _data.securedData) {
            if (param == "maxNumberOfassistants") {
                maxNumberOfassistants = Number(
                    _data.securedData.maxNumberOfassistants
                );
            } else if (param == "propertiesPrefix") {
                propertiesPrefix = _data.securedData.propertiesPrefix;
            }
        }
        // Initialize A_TEAM_PROPERTIES_pname_ A_TEAM_PROPERTIES_pid from 1 to 5 to ""
        for (let i = 1; i <= maxNumberOfassistants; i++) {
            activityData[`${propertiesPrefix}pname_${i}`] = "";
            activityData[`${propertiesPrefix}pid_${i}`] = "";
            activityData[`${propertiesPrefix}ETA_${i}`] = "";
            activityData[`${propertiesPrefix}end_time_${i}`] = "";
        }
        for (const [key, member] of Object.entries(teamMembers)) {
            const typedMember = member as { pname: string }; // Explicitly type member
            activityData[`${propertiesPrefix}pname_${index}`] =
                typedMember.pname;
            activityData[`${propertiesPrefix}pid_${index}`] = key;
            activityData[`${propertiesPrefix}ETA_${index}`] = activityData.ETA;
            activityData[`${propertiesPrefix}end_time_${index}`] =
                activityData.end_time;
            index++;
        }
        let dataToSend: any = {
            activity: activityData,
        };
        this.close(dataToSend);
    }
}
