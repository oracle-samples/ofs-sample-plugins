/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { JSONTree } from "./utils/jsonview";
class OFSCustomOpenMessage extends OFSOpenMessage {
    activity: any;
    inventory: any;
    openParams: any;
    resource: any;
}

export class CustomPlugin extends OFSPlugin {
    open(data: OFSCustomOpenMessage) {
        var inventoryData = data.inventory;

        var activityEntity = {
            entity: "inventory",
            action: "undo_install",
            inv_pid: inventoryData.inv_pid,
            invid: inventoryData.invid,
            quantity: inventoryData.quantity,
        };
        var dataToSend: any = { actions: [activityEntity] };
        this.close(dataToSend);
    }
}
