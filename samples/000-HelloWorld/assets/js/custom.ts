/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { JSONTree } from "./utils/jsonview";

export class CustomPlugin extends OFSPlugin {
    open(data: OFSOpenMessage) {
        const tree = new JSONTree(JSON.stringify(data));
        const input_data = document.getElementById("input_data");
        if (!!input_data) {
            tree.render(input_data);
        }
    }
}
