/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { Inventory, InventoryItem, InventoryItemElement } from "./models/OFS";

class InventoryCustom extends Inventory {
  find_like_custom(item: InventoryItem, pool?: string) {
    console.debug(
      item,
      `looking for items with ${item.inv_aid} , ${item.invtype}  and ${item.I_DEFAULT_VALUE}   `
    );
    var data = this._data;
    if (pool != null) {
      data = data.filter((row) => row.invpool == pool);
    }
    data = data.filter((row) => {
      return (
        item.inv_aid == row.inv_aid &&
        item.invtype == row.invtype &&
        item.I_DEFAULT_VALUE == row.I_DEFAULT_VALUE
      );
    });
    console.debug(item, `We have  found items : ${JSON.stringify(data)} `);
    if (pool) {
      data = data.filter((row) => row.invpool == pool);
    }
    return data;
  }
}
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
  var debriefPluginLabel: string;
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
    if (globalThis.actionAtReturn == "DEBRIEF") {
      let dataToSend = {
        backScreen: "plugin_by_label",
        backPluginLabel: globalThis.debriefPluginLabel,
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
    var laborInvType: string = "labor";
    var laborItemNumber: string = "FS Reg Labor";
    var laborItemDesc: string = "FS Reg Labor";
    var laborServActivity: string = "Labor";
    globalThis.debriefPluginLabel = "debriefing";
    var thisPluginLabel = plugin.tag;

    for (var param in data.securedData) {
      if (param == "laborInvType") {
        laborInvType = data.securedData.laborInvType;
      } else if (param == "laborItemNumber") {
        laborItemNumber = data.securedData.laborItemNumber;
      } else if (param == "laborItemDesc") {
        laborItemDesc = data.securedData.laborItemDesc;
      } else if (param == "laborServActivity") {
        laborServActivity = data.securedData.laborServActivity;
      } else if (param == "debriefPluginLabel") {
        globalThis.debriefPluginLabel = data.securedData.debriefPluginLabel;
      } else if (param == "thisPluginLabel") {
        thisPluginLabel = data.securedData.thisPluginLabel;
      }
    }

    window.activityMap = new ActivityMap();
    var inventory = new InventoryCustom(data.inventoryList);
    var laborItemElement = new InventoryItemElement(
      laborInvType,
      data.activity.aid,
      "install",
      "1"
    );
    var laborItems: InventoryItem[] = inventory.find_like_custom(
      laborItemElement,
      "install"
    );
    console.log(`${plugin.tag} Labor items found : [${laborItems.length}]`);
    let currentTimestampDate = new Date(data.resource.currentTime);
    let endTimeTxt =
      "T" +
      ("0" + currentTimestampDate.getHours()).slice(-2) +
      ":" +
      ("0" + currentTimestampDate.getMinutes()).slice(-2) +
      ":00";
    console.log(
      `${plugin.tag} Times Variables [${data.resource.currentTime} , ${currentTimestampDate} ,${endTimeTxt} ,]`
    );

    var etaFormated: string = this.convertTime12to24(data.activity.ETA);

    let startTimestampDate = new Date(
      `${data.activity.date} ${etaFormated}`.replace(" ", "T")
    );

    let startTimeTxt =
      "T" +
      ("0" + startTimestampDate.getHours()).slice(-2) +
      ":" +
      ("0" + startTimestampDate.getMinutes()).slice(-2) +
      ":00";

    if (laborItems.length > 0) {
      let activityToUpdate = {
        aid: data.activity.aid,
      };
      let inventoryListObject: any = {};
      let inventoryItem: any = laborItems[0];
      (inventoryItem["labor_start_time"] = startTimeTxt),
        (inventoryItem["labor_end_time"] = endTimeTxt);
      inventoryListObject[laborItems[0]["invid"]] = inventoryItem;
      var dataToSend = {
        activity: activityToUpdate,
        inventoryList: inventoryListObject,
      };
      globalThis.actionAtReturn = "DEBRIEF";
      this.update(dataToSend);
    } else {
      var actions: any = [
        {
          entity: "inventory",
          action: "create",
          inv_pid: data.resource.pid,
          inv_aid: data.activity.aid,
          invtype: laborInvType,
          invpool: "install",
          properties: {
            I_DEFAULT_VALUE: "1",
            labor_start_time: startTimeTxt,
            labor_end_time: endTimeTxt,
            labor_item_number: laborItemNumber,
            labor_item_description: laborItemDesc,
            labor_service_activity: laborServActivity,
          },
        },
      ];
      let dataToSend = {
        activity: data.activity,
        actions: actions,
        backScreen: "plugin_by_label",
        backPluginLabel: debriefPluginLabel,
      };
      plugin.close(dataToSend);
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
  convertTime12to24(time12h: string) {
    const [time, modifier] = time12h.split(" ");

    let [hours, minutes] = time.split(":");

    if (hours === "12") {
      hours = "00";
    }

    if (modifier === "PM") {
      hours = `${parseInt(hours, 10) + 12}`;
    }

    return `${hours}:${minutes}:00`;
  }
}
