/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

export class CustomPlugin extends OFSPlugin {
  open(data: OFSOpenMessage) {
    this.proxy.getAllUsers().then((users) => {
      // Get attributes from the first user
      const user = users.items[0];
      const user_attributes = Object.keys(user);
      // Create a csv with the first user attributes as headers
      let csv = "data:text/csv;charset=utf-8,";
      csv += user_attributes.join(",") + "\n";
      // Add each user as a new line
      users.items.forEach((user: any) => {
        csv += user_attributes.map((attr) => user[attr]).join(",") + "\n";
      });
      // download csv file
      const encodedUri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${this.proxy.instance}_users.csv`);
      document.body.appendChild(link);
      link.click();
      //Close Plugin (no interaction required)
      this.close();
    });
  }
}
