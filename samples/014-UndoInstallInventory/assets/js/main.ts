/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { CustomPlugin } from "./custom";

export {};
declare global {
    interface Window {
        ofs: CustomPlugin;
    }
}

window.onload = function () {
    window.ofs = new CustomPlugin("UndoInstallInventory");
};
