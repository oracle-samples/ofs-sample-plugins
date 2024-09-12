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
import { OFSSubscriptionResponse } from "@ofs-users/proxy";
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
            this.getSubscriptions();
        } else {
            alert(
                "Proxy not available. Review if you have included an application in the plugin configuration and it you have, review the logs for any errors."
            );
            this.close();
        }
    }
    async getSubscriptions() {
        const subscriptions_list: OFSSubscriptionResponse =
            await this.proxy.getSubscriptions();
        console.debug(
            `${this.tag} : Subscriptions: ${JSON.stringify(subscriptions_list)}`
        );
        alert(
            `Subscriptions captured successfully ${JSON.stringify(
                subscriptions_list
            )}`
        );
        this.close();
    }
}
