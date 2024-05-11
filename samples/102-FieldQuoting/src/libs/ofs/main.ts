/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFS } from "./OFS";
export interface InventoryGroupItem {
  invtype: any;
  accText: string | undefined;
  totalCharges: number | 0.0;
  count: number | 0.0;
  children: InventoryItem[];
}
export interface InventoryItem {
  inv_aid?: number | null;
  invid: any;
  quantity: any;
  inventory_model: any;
  invtype: any;
  invsn: any;
  invpool: string | undefined;
  I_TOTAL_PRICE: number | 0.0;
}
export class InventoryGroupItemElement implements InventoryGroupItem {
  invtype: any;
  accText: string | undefined;
  totalCharges: number = 0.0;
  count: number = 0.0;
  children: InventoryItem[] = [];

  constructor(invtype: string) {
    this.invtype = invtype;
    this.accText = "Grouped Element of " + invtype;
  }

  addElement(newChild: InventoryItem) {
    this.children.push(newChild);
    this.count = this.children.length;
    let sum = 0;
    this.children.forEach((el) => (sum += el.I_TOTAL_PRICE));
    this.totalCharges = sum;
  }
}
export class InventoryItemElement implements InventoryItem {
  inv_aid?: number | null | undefined;
  invid: any;
  quantity: any;
  inventory_model: any;
  invtype: any;
  invsn: any;
  invpool: string | undefined;
  I_TOTAL_PRICE: number = 0.0;

  constructor(invpool: string, inventory_model?: any, invsn?: string) {
    this.inventory_model = inventory_model;
    this.invpool = invpool;
    this.invsn = invsn;
  }
}

export class Inventory {
  protected _data: InventoryItem[];
  private _original_data: InventoryItem[];
  protected _grouped_data: InventoryGroupItem[] = [];

  data() {
    return this._data;
  }
  grouped_data() {
    return this._grouped_data;
  }
  compare(a: InventoryItem, b: InventoryItem) {
    if (a.invtype < b.invtype) {
      return -1;
    }
    if (a.invtype > b.invtype) {
      return 1;
    }
    return 0;
  }
  customer({ serialized = true, non_serialized = true, aid = -1 }) {
    // Returns the installed pool inventory
    var data = this._data.filter((item) => item.invpool == "customer");
    if (!serialized) {
      data = data.filter((item) => item.invsn == null);
    }
    if (!non_serialized) {
      data = data.filter((item) => item.invsn != null);
    }
    if (aid > 0) {
      data = data.filter((item) => item.inv_aid == aid);
    }
    return data;
  }

  provider({ serialized = true, non_serialized = true } = {}) {
    // Returns the provider pool inventory
    var data = this._data.filter((item) => item.invpool == "provider");
    if (!serialized) {
      data = data.filter((item) => item.invsn == null);
    }
    if (!non_serialized) {
      data = data.filter((item) => item.invsn != null);
    }
    return data;
  }

  installed({ serialized = true, non_serialized = true, aid = -1 }) {
    // Returns the installed pool inventory
    var data = this._data.filter((item) => item.invpool == "install");
    if (!serialized) {
      data = data.filter((item) => item.invsn == null);
    }
    if (!non_serialized) {
      data = data.filter((item) => item.invsn != null);
    }
    if (aid > 0) {
      data = data.filter((item) => item.inv_aid == aid);
    }
    return data;
  }
  installed_grouped({ serialized = true, non_serialized = true, aid = -1 }) {
    return this.group_data(
      this.installed({
        serialized: serialized,
        non_serialized: non_serialized,
        aid: aid,
      })
    );
  }
  find_like(item: InventoryItem, pool?: string) {
    console.debug(
      item,
      `looking for items with ${item.invtype} and ${item.inventory_model}`
    );
    var data = this._data;
    if (pool != null) {
      data = data.filter((row) => row.invpool == pool);
    }
    data = data.filter((row) => {
      return (
        item.invtype == row.invtype &&
        item.inventory_model == row.inventory_model
      );
    });
    if (pool) {
      data = data.filter((row) => row.invpool == pool);
    }
    return data;
  }
  private group_data(data_to_group: InventoryItem[]) {
    var groupElement: InventoryGroupItemElement[] = [];
    var previousInvtype: string = "";
    let currentGroupedElement: InventoryGroupItemElement;
    data_to_group.sort(this.compare).forEach((element, key, arr) => {
      if (previousInvtype != element.invtype) {
        if (currentGroupedElement != null) {
          groupElement.push(currentGroupedElement);
        }
        currentGroupedElement = new InventoryGroupItemElement(element.invtype);
      }
      currentGroupedElement.addElement(element);
      if (Object.is(arr.length - 1, key)) {
        if (currentGroupedElement != null) {
          groupElement.push(currentGroupedElement);
        }
      }
    });

    return groupElement;
  }
  constructor(inventoryData: any) {
    // Due to the structure we iterate through the keys of the object to get the array
    this._data = [];
    this._original_data = inventoryData; // if we have it, why wasting it
    for (const property in inventoryData) {
      this._data = this._data.concat(inventoryData[property]);
    }

    // TODO: Check if installed inv is only for the current activity
  }
}
export class OFSMessage {
  apiVersion: number = -1;
  method: string = "noMethod";
  securedData?: any;
  sendInitData?: boolean;

  static parse(str: string) {
    try {
      return Object.assign(new OFSMessage(), JSON.parse(str)) as OFSMessage;
    } catch (e) {
      console.log("Error parsing message", e);
      var m = new OFSMessage();
      m.method = "discard";
      return m;
    }
  }
}

export enum Method {
  Close = "close",
  Open = "open",
  Update = "update",
  UpdateResult = "updateResult",
  Init = "init",
  Ready = "ready",
  InitEnd = "initEnd",
}

export class OFSOpenMessage extends OFSMessage {
  entity: string | undefined;
  activity?: any;
  inventoryList?: any;
  securedData?: any;
  openParams?: any;
  allowedProcedures?: any;
}

export class OFSCloseMessage extends OFSMessage {
  method: string = "close";
  activity?: any;
}

export abstract class OFSPlugin {
  private _proxy!: OFS;
  private _tag: string;

  constructor(tag: string) {
    console.log(`${tag}: Created`);

    this._tag = tag;

    this._setup();
  }

  get proxy(): OFS {
    return this._proxy;
  }

  get tag(): string {
    return this._tag;
  }

  /**
   * Processes received messages
   * @param message Message received
   * @returns
   */
  private _getWebMessage(message: MessageEvent): boolean {
    console.log(`${this._tag}: Message received:`, message.data);
    console.log(`${this._tag}: Coming from ${message.origin}`);
    var parsed_message: any;
    try {
      parsed_message = OFSMessage.parse(message.data);
    } catch (error) {
      console.log(`${this._tag}: Error parsing ${error}`);
      console.log(`${this._tag}: Not OFS Message ${parsed_message.message}`);
      return true;
    }
    this._storeCredentials(parsed_message);
    switch (parsed_message.method) {
      case "init":
        this._init(parsed_message);
        break;
      case "open":
        this.open(parsed_message as OFSOpenMessage);
        break;
      case "updateResult":
        this.updateResult(parsed_message);
        break;
      case "wakeUp":
        this.wakeup(parsed_message);
        break;
      case "error":
        this.error(parsed_message);
        break;
      case "discard":
        console.warn(parsed_message);
        break;

      default:
        throw new Error(`Unknown method ${parsed_message.method}`);
        break;
    }
    return true;
  }

  private async _init(message: OFSMessage) {
    // Processing securedData variables
    this.init(message);
    var messageData: OFSMessage = {
      apiVersion: 1,
      method: "initEnd",
    };
    this._sendWebMessage(messageData);
  }

  private _storeCredentials(message: OFSMessage) {
    if (message.securedData) {
      console.log(`${this._tag}: Processing`, message.securedData);
      // STEP 1: are we going to create a proxy?
      if (
        message.securedData.ofsInstance &&
        message.securedData.ofsClientId &&
        message.securedData.ofsClientSecret
      ) {
        this._proxy = new OFS({
          instance: message.securedData.ofsInstance,
          clientId: message.securedData.ofsClientId,
          clientSecret: message.securedData.ofsClientSecret,
        });
      }
    }
  }

  private static _getOriginURL(url: string) {
    if (url != "") {
      if (url.indexOf("://") > -1) {
        return "https://" + url.split("/")[2];
      } else {
        return "https://" + url.split("/")[0];
      }
    }
    return "";
  }
  private _sendWebMessage(data: OFSMessage) {
    console.log(
      `${this._tag}: Sending  message` + JSON.stringify(data, undefined, 4)
    );
    var originUrl =
      document.referrer ||
      (document.location.ancestorOrigins &&
        document.location.ancestorOrigins[0]) ||
      "";

    if (originUrl) {
      parent.postMessage(data, OFSPlugin._getOriginURL(originUrl));
    }
  }

  public sendMessage(method: Method, data?: any): void {
    this._sendWebMessage({
      apiVersion: 1,
      method: method,
      ...data,
    });
  }

  private _setup() {
    console.log("OFS plugin ready");
    window.addEventListener("message", this._getWebMessage.bind(this), false);
    var messageData: OFSMessage = {
      apiVersion: 1,
      method: "ready",
      sendInitData: true,
    };
    this._sendWebMessage(messageData);
  }

  // There should be always an 'open' method
  abstract open(data: OFSOpenMessage): void;

  // These methods can be overwritten
  init(message: OFSMessage) {
    // Nothing to be done if not needed
    console.log(`${this._tag}: Empty init method`);
  }

  public close(data?: any): void {
    this.sendMessage(Method.Close, data);
  }

  public update(data?: any): void {
    this.sendMessage(Method.Update, data);
  }

  error(parsed_message: OFSMessage) {
    throw new Error("ERROR Method not implemented.");
  }
  wakeup(parsed_message: OFSMessage) {
    throw new Error("WAKEUP Method not implemented.");
  }
  updateResult(parsed_message: OFSMessage) {
    throw new Error("UPDATERESULT Method not implemented.");
  }
}
