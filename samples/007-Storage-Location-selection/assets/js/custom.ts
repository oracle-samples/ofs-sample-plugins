/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

class OFSCustomOpenMessage extends OFSOpenMessage {
  activity: any;
  openParams: any;
  resource: any;
}

export class CustomPlugin extends OFSPlugin {
  open(data: OFSCustomOpenMessage) {
    var plugin = this;
    var closeData: any = {};
    let dataToSend = {
      deinstall_inventory: "plugin_by_label",
      
    };
    plugin.close(dataToSend);
  }
}
