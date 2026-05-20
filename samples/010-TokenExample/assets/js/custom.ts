/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

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
import { OFSResponse } from "@ofs-users/proxy";
class OFSCustomOpenMessage extends OFSOpenMessage {
    activity: any;
    openParams: any;
    resource: any;
}

class OFSCustomInitMessage extends OFSMessage {
    applications: any;
}
export class CustomPlugin extends OFSPlugin {
    open(data: OFSCustomOpenMessage) {
        console.debug(`${this.tag} : OPEN: ${JSON.stringify(data)}`);
        var plugin = this;
        if (this.proxy) {
            this.getResources();
        } else {
            alert(
                "Proxy not available. Review if you have included an application in the plugin configuration and it you have, review the logs for any errors."
            );
            this.close();
        }
    }
    async getResources() {
        const resourcesList: OFSResponse =
            await this.proxy.getAllResources();
        console.debug(
            `${this.tag} : Resources: ${JSON.stringify(resourcesList)}`
        );
        alert(
            `Resources captured successfully ${JSON.stringify(
                resourcesList
            )}`
        );
        this.close();
    }
}
