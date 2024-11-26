/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { JSONTree } from "./utils/jsonview";
class OFSCustomOpenMessage extends OFSOpenMessage {
    activity: any;
    openParams: any;
    resource: any;
}

export class CustomPlugin extends OFSPlugin {
    open(data: OFSCustomOpenMessage) {
        var activityData = data.activity;
        delete activityData["aid"];
        delete activityData["astatus"];
        delete activityData["date"];
        //activityData.appt_number = `CLONE_${activityData.appt_number}`;
        // activityData.appt_number = activityData.appt_number;
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
