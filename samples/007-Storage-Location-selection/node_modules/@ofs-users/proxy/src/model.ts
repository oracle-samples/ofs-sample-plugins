/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { off } from "process";

export type OFSCredentials = {
    instance: string;
    clientId: string;
    clientSecret: string;
};

export interface OFSResponseInterface {
    status: number;
    description: string | undefined;
    data: any;
    url: URL;
    contentType?: string;
}

export class OFSResponse implements OFSResponseInterface {
    status: number = -1;
    description: string | undefined;
    data: any;
    url: URL;
    contentType?: string;

    constructor(
        url: URL,
        status: number,
        description?: string,
        data?: any,
        contentType?: string
    ) {
        this.status = status;
        this.description = description;
        this.data = data;
        this.url = url;
        this.contentType = contentType;
    }
}

export interface ListResponse {
    totalResults: number;
    items: Array<any>;
    links: any;
}
export interface Subscription {
    subscriptionId: string;
    applicationId: string;
    createdTime: string;
    expirationTime: string;
    subscriptionTitle: string;
    subscriptionConfig: any;
    links: any;
}

export interface ActivityResponse {
    customerName: any;
    activityId: number;
}

export interface SubscriptionListResponse {
    totalResults: number;
    items: Array<Subscription>;
    links: any;
}

export interface ActivityListResponse {
    totalResults: number;
    items: Array<Subscription>;
    links: any;
}

export interface OFSTranslation {
    language: string;
    name: string;
    languageISO: string;
}
export interface OFSPropertyDetails {
    label: string;
    name?: string;
    type?: string;
    entity?: string;
    gui?: string;
    allowDraw?: boolean;
    cloneFlag?: boolean;
    fileSizeLimit?: string;
    getGeolocation?: boolean;
    hint?: string;
    lines?: number;
    maxHeight?: number;
    maxWidth?: number;
    mimeTypes?: [];
    template?: string;
    transformation?: any;
    watermark?: boolean;
    translations?: OFSTranslation[];
    links?: any;
}

export interface OFSGetPropertiesParams {
    entity?: string;
    language?: string;
    limit?: number;
    offset?: number;
    type?: number;
}
class OFSPropertyList {
    items: OFSPropertyDetails[] = [];
    limit: number = 0;
    offset: number = 0;
    totalResults: number = 0;
}

export class OFSSubscriptionResponse extends OFSResponse {
    data: SubscriptionListResponse = {
        totalResults: 0,
        items: [],
        links: undefined,
    };
}

export class OFSActivityResponse extends OFSResponse {
    data: ActivityResponse = {
        customerName: undefined,
        activityId: 0,
    };
}

export class OFSPropertyDetailsResponse extends OFSResponse {
    data: OFSPropertyDetails = {
        label: "",
        name: "",
        type: "string",
        entity: "activity",
        gui: "",
        translations: [],
        links: undefined,
    };
}

export class OFSPropertyListResponse extends OFSResponse {
    data: OFSPropertyList = new OFSPropertyList();
}
