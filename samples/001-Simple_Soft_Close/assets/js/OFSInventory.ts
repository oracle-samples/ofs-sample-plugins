/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

class OFSInventoryItem {
    id!: number;
    invpool!: string;
    inv_aid: number | undefined;
}

export class OFSInventory {
    _items: OFSInventoryItem[] = [];
    _original: any;
    constructor(obj: any) {
        for (let property in obj) {
            this._items.push(obj[property]);
        }
        this._original = obj;
    }

    items(): OFSInventoryItem[] {
        return this._items;
    }

    filter_by_pool(pool: string, aid?: number): OFSInventoryItem[] {
        let response = this._items;
        if (!!aid) {
            response = response.filter((element) => element.inv_aid == aid);
        }
        return response.filter((element) => element.invpool == pool);
    }

    installed(aid?: number): OFSInventoryItem[] {
        return this.filter_by_pool("install", aid);
    }

    deinstalled(aid?: number): OFSInventoryItem[] {
        return this.filter_by_pool("deinstall", aid);
    }

    provider(): OFSInventoryItem[] {
        return this._items.filter((element) => element.invpool == "provider");
    }

    customer(): OFSInventoryItem[] {
        return this._items.filter((element) => element.invpool == "customer");
    }

    by_id(id: number) {
        return this._original[id];
    }
}
