/*
 * Copyright © 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFS } from "../../dist/ofs.es.js";
import myCredentials from "./credentials_sample.json" assert { type: "json" };

// Get the list of active subscriptions
const myProxy = new OFS(myCredentials);
const result = await myProxy.getSubscriptions();
console.log(result.data);
