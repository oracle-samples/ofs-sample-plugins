/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

export class CustomPlugin extends OFSPlugin {
    open(data: OFSOpenMessage) {
        const input_data = document.getElementById("input_data");
    }
}
