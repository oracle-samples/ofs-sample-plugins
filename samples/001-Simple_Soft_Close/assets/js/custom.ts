/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { JSONTree } from "./utils/jsonview";
import { OFSInventory } from "./OFSInventory";
import { OFSCloseMessage } from "@ofs-users/plugin";

class OFSCustomActivity {
    // We create a custom class to keep track of which properties are we using
    aid!: number;
    aworktype?: string;
    XP_CAN_COMPLETE!: number;
    XP_CAN_NOT_DONE!: number;
    XP_FLAG_I01!: number;
    XP_FLAG_I02!: number;
}

class OFSCustomOpenMessage extends OFSOpenMessage {
    activity!: OFSCustomActivity;
    inventoryList: any; /// Needs to be processed
}

class OFSCustomCloseMessage extends OFSCloseMessage {
    apiVersion: number = 1;
    activity!: OFSCustomActivity;
}

class TestMap {
    [key: string]: any;

    _testCases: string[] | undefined = [];
    private _activity: OFSCustomActivity;
    private _inventory: OFSInventory;

    /**
     * In the constructor we build the test path, by selecting the relevants tests
     */

    constructor(activity: OFSCustomActivity, inventory: OFSInventory) {
        this._activity = activity;
        this._inventory = inventory;
        if (activity.aworktype == "08") {
            this._testCases = TestMap._map.get("IN");
        }
        if (["01", "02", "03", "05"].includes(activity.aworktype!)) {
            this._testCases = TestMap._map.get("RE");
        }
    }

    static _map: Map<string, Array<string>> = new Map([
        ["IN", ["_test001_no_deinstalled_equipment"]],
        ["RE", ["_test002_deinstalls_eq_installs"]],
        ["ALL", []],
    ]);

    //
    // Methods starting with _test are considered in the list of feasible tests
    // All tests should have no params and return a boolean. TBD define interface
    //

    /**
        TEST001: Test if there is any deinstalled equipment
        */

    _test001_no_deinstalled_equipment(): boolean {
        console.log("Executing no deinstalled equipment");
        return this._inventory.deinstalled(this._activity.aid).length == 0;
    }

    /**
        TEST002: Test if the number of equipments installed is the same one as
        the number of deinstalled equipments
        @returns boolean
        */

    _test002_deinstalls_eq_installs(): boolean {
        return (
            this._inventory.deinstalled(this._activity.aid).length ==
            this._inventory.installed(this._activity.aid).length
        );
    }
    /**
        Gets the list of available tests
        @returns {string[]} List of tests
        */
    getAvailableTests(): string[] {
        let test_list: string[] = [];
        let obj = Object.getPrototypeOf(this);
        Object.getOwnPropertyNames(obj).forEach((key) => {
            if (typeof obj[key] === "function" && key.startsWith("_test")) {
                test_list.push(key);
            }
        });
        return test_list;
    }
    //
    // Methods starting with _test are considered in the list of feasible tests
    //

    /**
        Executes the list of relevant tests
        @returns {boolean} global result
        */
    public execute(): boolean {
        let availableTests = this.getAvailableTests();
        let result: boolean = true;
        this._testCases?.forEach((test): void => {
            if (availableTests.includes(test)) {
                result = result && this[test]();
            }
        });
        return result;
    }
}

export class CustomPlugin extends OFSPlugin {
    open(data: OFSCustomOpenMessage) {
        const tree = new JSONTree(JSON.stringify(data));
        const input_data = document.getElementById("input_data");
        if (!!input_data) {
            tree.render(input_data);
        }
        // Parse inventory to use it later
        const inventory = new OFSInventory(data.inventoryList);
        // Build base response
        let customCloseMessage = new OFSCustomCloseMessage();
        customCloseMessage.activity = {
            aid: data.activity?.aid,
            XP_CAN_COMPLETE: 0,
            XP_CAN_NOT_DONE: 0,
            XP_FLAG_I01: inventory.installed(data.activity.aid).length,
            XP_FLAG_I02: inventory.deinstalled(data.activity.aid).length,
        };

        // Execute tests
        let testSuite = new TestMap(data.activity, inventory);
        customCloseMessage.activity.XP_CAN_COMPLETE = testSuite.execute()
            ? 1
            : 0;

        // Set close button handler
        const submit_button = document.getElementById("submit_button");
        if (!!submit_button) {
            submit_button.onclick = () => {
                this.close(customCloseMessage);
            };
        }
    }
}
