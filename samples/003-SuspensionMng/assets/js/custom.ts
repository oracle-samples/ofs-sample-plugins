/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

class OFSCustomOpenMessage extends OFSOpenMessage {
  inventoryList: any;
  activity: any;
  resource: any;
  activityList: any;
  openParams: any;
}

class OFSError {
  type?: string;
  code?: string;
  entity?: string;
  entityId?: string;
  actionId?: number;
}

class OFSErrorMessage extends OFSMessage {
  errors: OFSError[] = [];
}

declare global {
  var activityMap: ActivityMap;
  var actionAtReturn: any;
  var activityToManage: string;
}

// QUITAR CUANDO OFS SE ACTUALICE
enum Method {
  Close = "close",
  Open = "open",
  Update = "update",
  UpdateResult = "updateResult",
  Init = "init",
  Ready = "ready",
  InitEnd = "initEnd",
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ActivityMap extends Map {
  static get(aid: string) {
    return globalThis.activityMap.get(aid);
  }

  static set(aid: string, activity: any) {
    return globalThis.activityMap.set(aid, activity);
  }
}

export class CustomPlugin extends OFSPlugin {
  async updateResult(data: OFSCustomOpenMessage) {
    var plugin = this;
    if (globalThis.actionAtReturn == null) {
      globalThis.actionAtReturn = "NOT_VALID";
    }
    if (globalThis.actionAtReturn == "UPDATE_TOTAL_DURATION") {
      var plugin = this;
      console.log(`${plugin.tag} We have updated`);

      var activityListInput: any = data.activityList;
      var additionalDuration = 0;
      var activityFound = false;
      var sendClose = true;
      for (var activityIdVisit in activityListInput) {
        var activityTmp = activityListInput[activityIdVisit];
        var status = activityTmp["astatus"];
        if (status == "suspended") {
          console.log(
            `${plugin.tag} We have a suspended activity with aid ${activityTmp.aid}`
          );
          if (ActivityMap.get(activityTmp.aid) == null) {
            if (activityTmp.aid.includes("-")) {
              console.log(
                `${plugin.tag} Activity not updated yet. We will sleep 1 second`
              );
              await sleep(100);
              let activityToUpdate = {
                aid: data.activity.aid,
              };
              let dataToSend = {
                activity: activityToUpdate,
              };
              this.update(dataToSend);
              sendClose = false;
            } else {
              activityFound = true;
              additionalDuration = +activityTmp["length"];
              console.log(
                `${plugin.tag} We have a suspended activity with aid ${activityTmp.aid} and length ${additionalDuration}`
              );
            }
          }
        }
      }
      var activityToUpdate: any = {
        aid: data.activity.aid,
      };
      if (activityFound) {
        console.log(
          `${plugin.tag} Previous Duration ${data.activity["A_TOTAL_DURATION"]} `
        );
        data.activity["A_TOTAL_DURATION"] =
          +data.activity["A_TOTAL_DURATION"] + additionalDuration;
        console.log(
          `${plugin.tag} After Duration ${data.activity["A_TOTAL_DURATION"]} `
        );
        activityToUpdate = {
          aid: data.activity.aid,
          A_TOTAL_DURATION: data.activity["A_TOTAL_DURATION"],
        };
      }

      let dataToSend = {
        backScreen: "activity_list",
        activity: activityToUpdate,
      };
      if (sendClose) {
        this.close(dataToSend);
      }
    } else if (globalThis.actionAtReturn == "COMPLETE_ACTIVITY") {
      let dataToSend = {
        backScreen: "end_activity",
        backActivityId: data.activity.aid,
      };
      this.close(dataToSend);
    } else {
      console.log(
        `${plugin.tag} Global Action value ${globalThis.actionAtReturn} is not valid `
      );
    }
  }
  // Presentation functions
  open(data: OFSCustomOpenMessage) {
    var plugin = this;
    window.activityMap = new ActivityMap();
    // window.activityList = data.activityList;
    //window.mainActivity = data.activity;
    var openAction = "";
    if ("openAction" in data.openParams) {
      openAction = data.openParams.openAction;
    }
    var activityListInput: any = data.activityList;

    for (var activityId in activityListInput) {
      var activityTmp = activityListInput[activityId];
      if (data.resource.currentTime != null) {
        ActivityMap.set(activityTmp.aid, activityTmp);
      }
    }

    console.log(
      `${plugin.tag} We are executing the action received on openParameters`
    );
    if (openAction == "suspend") {
      let activityToUpdate = {
        aid: data.activity.aid,
        astatus: "suspended",
      };
      let dataToSend = {
        activity: activityToUpdate,
      };
      globalThis.actionAtReturn = "UPDATE_TOTAL_DURATION";
      this.update(dataToSend);
    } else if (openAction == "complete suspended") {
      let currentTimestamp = new Date(data.resource.currentTime).getTime();
      let startTimestamp = new Date(
        data.activity.date + " " + data.activity.ETA
      ).getTime();
      let originalStartTimestamp = new Date(
        data.activity["A_ORIGINAL_START_TIME"]
      ).getTime();

      let total_duration = +Math.round(
        +data.activity["A_TOTAL_DURATION"] +
          +((currentTimestamp - startTimestamp) / 60000)
      );
      let total_time_to_solve = +Math.round(
        +((currentTimestamp - originalStartTimestamp) / 60000)
      );
      console.log(
        `${plugin.tag} We need to add ${total_duration} minutes to the total duration`
      );
      console.log(
        `${plugin.tag} The total duration between ${data.activity["A_ORIGINAL_START_TIME"]} and ${data.activity.date} ${data.activity.ETA} is ${total_time_to_solve} minutes`
      );
      let activityToUpdate = {
        aid: data.activity.aid,
        A_TOTAL_DURATION_COMPLETE: total_duration,
        A_TOTAL_TIME_TO_SOLVE: total_time_to_solve,
      };
      let dataToSend = {
        activity: activityToUpdate,
      };
      globalThis.actionAtReturn = "COMPLETE_ACTIVITY";
      this.update(dataToSend);
    } else {
      console.log(`${plugin.tag} Method ${openAction} not implemented yet `);
    }
  }

  public update(data?: any): void {
    this.sendMessage(Method.Update, data);
  }
  public close(data?: any): void {
    this.sendMessage(Method.Close, data);
  }

  closePlugin() {
    var activityList: any = {};
    for (const [key, activity] of globalThis.activityMap.entries()) {
      var activityJson = activity.prepareJSON(
        activity.getStatus(),
        "no_action"
      );
      var aid = activityJson.aid;
      activityList[aid] = activityJson;
    }
    var closeData = {
      activityList: activityList,
    };
    this.close(closeData);
  }
}
