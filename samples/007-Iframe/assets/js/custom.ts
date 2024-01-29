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
    var plugin = this;
    var closeData: any = {};
    if (!("iframeUrl" in data.openParams)) {
      alert(`iframeUrl is a mandatory openParameter`);
      var closeData: any = {
        activity: { aid: data.activity.aid },
      };
      plugin.close(closeData);
      // throw new Error(`backScreen is a mandatory openParameter`);
    }
    const iframeElement = document.getElementById("iframe-url");
    if (iframeElement) {
      iframeElement.setAttribute("src", data.openParams["iframeUrl"]);
    }
  }
}
