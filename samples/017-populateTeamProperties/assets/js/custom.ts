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
        let activityData = _data.activity;
        for (const [key, member] of Object.entries(teamMembers)) {
            const typedMember = member as { pname: string }; // Explicitly type member
            activityData[`A_TEAM_PROPERTIES_pname_${index}`] =
                typedMember.pname;
            activityData[`A_TEAM_PROPERTIES_pid_${index}`] = key;
            index++;
        }
        let dataToSend: any = {
            activity: activityData,
        };
        this.close(dataToSend);
    }
}
