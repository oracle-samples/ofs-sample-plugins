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
    if (!("backScreen" in data.openParams)) {
      alert(`backScreen is a mandatory openParameter`);
      var closeData: any = {
        activity: { aid: data.activity.aid },
      };
      plugin.close(closeData);
      // throw new Error(`backScreen is a mandatory openParameter`);
    }
    for (var openParam in data.openParams) {
      console.debug(
        `${plugin.tag} : OPEN PARAM: ${openParam} = ${data.openParams[openParam]}`
      );
      var paramValue: string = data.openParams[openParam];

      if (paramValue.includes("`")) {
        paramValue = paramValue.replace(/`/g, "");
        var entity: string = paramValue.split(".")[0];
        var label: string = paramValue.split(".")[1];
        if (entity == "activity") {
          paramValue = data.activity[label];
        } else if (entity == "resource") {
          paramValue = data.resource[label];
        } else {
          //throw new Error(`Unknown entity ${entity}`);
          alert(`Unknown entity ${entity}`);
          var closeData: any = {
            activity: { aid: data.activity.aid },
          };
          plugin.close(closeData);
        }
      }
      closeData[openParam] = paramValue;
    }
    var activityDict: any = {};
    if ("PA_REDIRECT_BACKSCREEN" in data.activity) {
      activityDict["PA_REDIRECT_BACKSCREEN"] = data.openParams["backScreen"];
    }
    if ("PA_REDIRECT_TS" in data.activity) {
      activityDict["PA_REDIRECT_TS"] = Date.now();
    }
    if (Object.keys(activityDict).length > 0) {
      activityDict["aid"] = data.activity.aid;
      closeData["activity"] = activityDict;
    }

    console.debug(`${plugin.tag} : FEEDBACK: ${closeData}`);
    plugin.close(closeData);
  }
}
