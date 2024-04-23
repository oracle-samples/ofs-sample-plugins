/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { Activity, ActivityItem, ActivityItemElement } from "./models/OFS";
import { JSONTree } from "./utils/jsonview";

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
  var actionAtReturn: any;
  var aid: number;
  var redirectPluginLabel: string;
  var backScreen: string;
}
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

export class CustomPlugin extends OFSPlugin {
  start_activity() {
    let activityToUpdate = {
      aid: globalThis.aid,
      astatus: "started",
    };
    var dataToSend = {
      activity: activityToUpdate,
    };
    globalThis.actionAtReturn = "REDIRECT";
    this.update(dataToSend);
  }
  suspend_started_activity(started_aid: number | null) {
    let activityToUpdate = {
      aid: started_aid,
      astatus: "suspended",
    };
    var dataToSend = {
      activity: activityToUpdate,
    };
    globalThis.actionAtReturn = "RECHECK";
    this.update(dataToSend);
  }
  suspend_activity() {
    let activityToUpdate = {
      aid: globalThis.aid,
      astatus: "suspended",
    };
    var dataToSend = {
      activity: activityToUpdate,
    };
    globalThis.actionAtReturn = "START";
    this.update(dataToSend);
  }
  redirect() {
    var dataToSend = {};
    if (globalThis.backScreen == "plugin_by_label") {
      dataToSend = {
        backScreen: globalThis.backScreen,
        backPluginLabel: globalThis.redirectPluginLabel,
      };
    } else if (
      globalThis.backScreen in
      ["activity_by_id", "end_activity", "notdone_activity"]
    ) {
      dataToSend = {
        backScreen: globalThis.backScreen,
        backActivityId: globalThis.aid,
      };
    } else {
      dataToSend = {
        backScreen: globalThis.backScreen,
      };
    }
    this.close(dataToSend);
  }
  async updateResult(data: OFSOpenMessage) {
    var plugin = this;
    if (globalThis.actionAtReturn == null) {
      globalThis.actionAtReturn = "NOT_VALID";
    }
    if (globalThis.actionAtReturn == "REDIRECT") {
      await sleep(100);
      this.redirect();
    } else if (globalThis.actionAtReturn == "START") {
      await sleep(100);
      this.start_activity();
    } else if (globalThis.actionAtReturn == "RECHECK") {
      await sleep(100);
      this.decide_action(data);
    } else {
      console.log(
        `${plugin.tag} Global Action value ${globalThis.actionAtReturn} is not valid `
      );
    }
  }

  // Presentation functions
  open(data: OFSCustomOpenMessage) {
    var plugin = this;
    globalThis.backScreen = "activity_by_id";
    globalThis.aid = data.activity.aid;

    for (var param in data.securedData) {
      if (param == "redirectPluginLabel") {
        globalThis.redirectPluginLabel = data.securedData.redirectPluginLabel;
      } else if (param == "backScreen") {
        globalThis.backScreen = data.securedData.backScreen;
      }
    }
    this.decide_action(data);
  }
  decide_action(data?: any) {
    if (data.activity.astatus == "started") {
      this.redirect();
    } else if (data.activity.position_in_route == "-1") {
      this.start_activity();
    } else {
      var activityList = new Activity(data.activityList);
      var nextActivity: ActivityItem | null = activityList.find_next_activity();
      if (nextActivity == null) {
        this.start_activity();
      } else {
        var startedActivity: ActivityItem[] =
          activityList.activities_by_status("started");
        if (startedActivity.length > 0) {
          this.suspend_started_activity(startedActivity[0].aid);
        } else {
          if (nextActivity.aid == data.activity.aid) {
            this.start_activity();
          } else {
            this.suspend_activity();
          }
        }
      }
    }
  }
  public update(data?: any): void {
    this.sendMessage(Method.Update, data);
  }
  public close(data?: any): void {
    this.sendMessage(Method.Close, data);
  }
}
