/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

declare global {
  var initMessage: string;
  var applicationKey: any;
  var restUrl: any;
}
import {
  OFSPlugin,
  OFSMessage,
  OFSOpenMessage,
  OFSCallProcedureResultMessage,
} from "@ofs-users/plugin";
class OFSCustomOpenMessage extends OFSOpenMessage {
  activity: any;
  openParams: any;
  resource: any;
}

class OFSCustomInitMessage extends OFSMessage {
  applications: any;
}
export class CustomPlugin extends OFSPlugin {
  generateCallId() {
    const randomBytes = new Uint8Array(16);
    var randomValue = window.crypto.getRandomValues(randomBytes);
  }
  storeInitProperty(property: string, data: any) {
    console.debug(`$${this.tag}.${property}: Storing ${property}`, data);
    window.localStorage.setItem(`${this.tag}.${property}`, data);
  }

  getInitProperty(property: string): any {
    var data = window.localStorage.getItem(`${this.tag}.${property}`);
    return data;
  }

  init(message: OFSCustomInitMessage): void {
    console.debug(`${this.tag} : INIT MESSAGE : ${JSON.stringify(message)}`);
    this.storeInitProperty("initMessage", JSON.stringify(message));
    console.debug(
      `${this.tag} : GLOBAL DATA INIT : ${this.getInitProperty("initMessage")}`
    );
  }
  open(data: OFSCustomOpenMessage) {
    console.debug(`${this.tag} : OPEN: ${JSON.stringify(data)}`);
    var initMessageStr: string = this.getInitProperty("initMessage");
    console.debug(`${this.tag} : GLOBAL DATA OPEN: ${initMessageStr}`);
    var plugin = this;
    var initMessage: OFSCustomInitMessage = JSON.parse(initMessageStr);
    var applicationKey = "";
    var restUrl = "";
    for (const [key, value] of Object.entries(initMessage.applications)) {
      applicationKey = key;
      var application: any = value;
      restUrl = application.resourceUrl;
    }
    globalThis.applicationKey = applicationKey;
    globalThis.restUrl = restUrl;
    var callId = `${this.generateCallId}`;
    var callProcedureData = {
      callId: callId,
      procedure: "getAccessToken",
      params: {
        applicationKey: applicationKey,
      },
    };
    plugin.callProcedure(callProcedureData);
  }
  callProcedureResult(data: OFSCallProcedureResultMessage) {
    console.debug(
      `${this.tag} : CALL PROCEDURE RESULT : ${JSON.stringify(data)}`
    );
    alert(
      `This is where I would implement the logic to call OFS Calls to the URL ${globalThis.restUrl} with the token ${data.resultData.token}`
    );
  }
}
