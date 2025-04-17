export interface InventoryItem {
    inv_aid?: number | null;
    invid: any;
    quantity: any;
    inventory_model: any;
    invtype: any;
    invsn: any;
    invpool: string | undefined;
    labor_start_time: string | undefined;
    labor_end_time: string | undefined;
    labor_item_number: string | undefined;
    labor_item_description: string | undefined;
    labor_service_activity: string | undefined;
}
export class InventoryItemElement implements InventoryItem {
    inv_aid?: number | null | undefined;
    invid: any;
    quantity: any;
    inventory_model: any;
    invtype: any;
    invsn: any;
    invpool: string | undefined;
    labor_start_time: string | undefined;
    labor_end_time: string | undefined;
    labor_item_number: string | undefined;
    labor_item_description: string | undefined;
    labor_service_activity: string | undefined;

    constructor(
        invtype: string,
        inv_aid?: number,
        invpool?: string,
        inventory_model?: any,
        invsn?: string,
        labor_start_time?: string,
        labor_end_time?: string,
        labor_item_number?: string,
        labor_item_description?: string,
        labor_service_activity?: string
    ) {
        this.inv_aid = inv_aid;
        this.invtype = invtype;
        this.inventory_model = inventory_model;
        this.invpool = invpool;
        this.invsn = invsn;
        this.labor_start_time = labor_start_time;
        this.labor_end_time = labor_end_time;
        this.labor_item_number = labor_item_number;
        this.labor_item_description = labor_item_description;
        this.labor_service_activity = labor_service_activity;
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
        return this._data.filter((row) => {
            const matchesPool = pool == null || row.invpool === pool;
            const matchesTypeAndModel =
                item.invtype === row.invtype &&
                item.inventory_model === row.inventory_model;
            return matchesPool && matchesTypeAndModel;
        });
    }
    generateActionsJson(inventoryElements: InventoryItemElement[]) {
        // Generates the json for the inventory
        console.log(
            `${this.constructor.name} - generateActionsJson`,
            JSON.stringify(inventoryElements, null, 2)
        );
        let actions: any = [];
        inventoryElements.forEach((element) => {
            actions.push({
                entity: "inventory",
                action: "create",
                invid: element.invid,
                quantity: element.quantity,
                inventory_model: element.inventory_model,
                inv_pid: element.inv_aid,
                invtype: element.invtype,
                invpool: element.invpool,
                invsn: element.invsn,
                inv_aid: element.inv_aid,
                properties: {
                    labor_start_time: element.labor_start_time,
                    labor_end_time: element.labor_end_time,
                    labor_item_number: element.labor_item_number,
                    labor_item_description: element.labor_item_description,
                    labor_service_activity: element.labor_service_activity,
                },
            });
        });
        return actions;
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
