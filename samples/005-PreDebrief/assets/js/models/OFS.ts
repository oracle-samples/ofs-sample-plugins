export interface InventoryItem {
  inv_aid?: number | null;
  invid: any;
  quantity: any;
  inventory_model: any;
  invtype: any;
  invsn: any;
  invpool: string | undefined;
  I_DEFAULT_VALUE: string | undefined;
}
export class InventoryItemElement implements InventoryItem {
  inv_aid?: number | null | undefined;
  invid: any;
  quantity: any;
  inventory_model: any;
  invtype: any;
  invsn: any;
  invpool: string | undefined;
  I_DEFAULT_VALUE: string | undefined;

  constructor(
    invtype: string,
    inv_aid?: number,
    invpool?: string,
    I_DEFAULT_VALUE?: string,
    inventory_model?: any,
    invsn?: string
  ) {
    this.inv_aid = inv_aid;
    this.invtype = invtype;
    this.I_DEFAULT_VALUE = I_DEFAULT_VALUE;
    this.inventory_model = inventory_model;
    this.invpool = invpool;
    this.invsn = invsn;
  }
}

export class Inventory {
  protected _data: InventoryItem[];
  private _original_data: InventoryItem[];
  data() {
    return this._data;
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
