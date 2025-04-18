export interface InventoryItem {
    inv_aid?: number | null;
    invid: any;
    inv_pid?: number | null;
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
    inv_pid?: number | null;
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

    constructor(config: {
        invtype: string;
        inv_aid?: number;
        inv_pid?: number | null;
        quantity?: number;
        invpool?: string;
        inventory_model?: any;
        invsn?: string;
        labor_start_time?: string;
        labor_end_time?: string;
        labor_item_number?: string;
        labor_item_description?: string;
        labor_service_activity?: string;
    }) {
        this.inv_aid = config.inv_aid;
        this.invtype = config.invtype;
        this.inv_pid = config.inv_pid;
        this.quantity = config.quantity;
        this.inventory_model = config.inventory_model;
        this.invpool = config.invpool;
        this.invsn = config.invsn;
        this.labor_start_time = config.labor_start_time;
        this.labor_end_time = config.labor_end_time;
        this.labor_item_number = config.labor_item_number;
        this.labor_item_description = config.labor_item_description;
        this.labor_service_activity = config.labor_service_activity;
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

    find_like(item: InventoryItem) {
        return this._data.filter((row) => {
            return Object.keys(item).every((key) => {
                if (item[key as keyof InventoryItem] !== undefined) {
                    return (
                        item[key as keyof InventoryItem] ==
                        row[key as keyof InventoryItem]
                    );
                }
                return true;
            });
        });
    }
    private generateJson(element: InventoryItemElement, action?: string) {
        return {
            entity: "inventory",
            action: action || "",
            invid: element.invid,
            inv_pid: element.inv_pid,
            invtype: element.invtype,
            invpool: element.invpool,
            inv_aid: element.inv_aid,
            properties: {
                invsn: element.invsn || undefined,
                labor_start_time: element.labor_start_time || undefined,
                labor_end_time: element.labor_end_time || undefined,
                labor_item_number: element.labor_item_number || undefined,
                labor_item_desc: element.labor_item_description || undefined,
                labor_service_activity:
                    element.labor_service_activity || undefined,
            },
        };
    }
    getInventoryListToUpdate(inventoryElements: InventoryItemElement[]) {
        let inventoryList: any = {};
        inventoryElements.forEach((element) => {
            inventoryList[element.invid] = this.generateJson(element);
        });

        return inventoryList;
    }
    getActions(inventoryElements: InventoryItemElement[], action: string) {
        // Generates the json for the inventory
        console.log(
            `${this.constructor.name} - generateActionsJson`,
            JSON.stringify(inventoryElements, null, 2)
        );
        let actions: any = [];
        if (action === "create") {
            inventoryElements.forEach((element) => {
                actions.push(this.generateJson(element, action));
            });
        }
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
