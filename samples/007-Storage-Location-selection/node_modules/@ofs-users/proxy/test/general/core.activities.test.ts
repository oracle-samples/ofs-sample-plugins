/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { createReadStream, readFileSync } from "fs";
import { OFSCredentials } from "../../src/model";
import { OFS } from "../../src/OFS";
import myCredentials from "../credentials_test.json";
import { faker } from "@faker-js/faker";

var myProxy: OFS;

// Setup info
beforeAll(() => {
    myProxy = new OFS(myCredentials);
    expect(myProxy.instance).toBe(myCredentials.instance);
});

// Teardown info
var activityList: number[] = [];
afterAll(() => {
    activityList.forEach(async (aid) => {
        await myProxy.deleteActivity(aid);
    });
});

test("Get Activity Details", async () => {
    var aid = 3954799;
    var result = await myProxy.getActivityDetails(aid);
    expect(result.data.activityId).toBe(aid);
});

test("Get non valid Activity Details", async () => {
    var aid = -1;
    var result = await myProxy.getActivityDetails(aid);
    expect(result.status).toBe(400);
});

test("Create Activity", async () => {
    var activityData = {
        activityType: "01",
        resourceId: "FLUSA",
    };
    var result = await myProxy.createActivity(activityData);
    expect(result.status).toBe(201);
    expect(result.data.activityType).toBe(activityData.activityType);
    // For cleanup
    var activityId = result.data.activityId;
    activityList.push(activityId);
});

test("Delete Activity", async () => {
    var activityData = {
        activityType: "01",
        resourceId: "FLUSA",
    };
    var result = await myProxy.createActivity(activityData);
    expect(result.status).toBe(201);
    expect(result.data.activityType).toBe(activityData.activityType);
    var activityId = result.data.activityId;
    activityList.push(activityId);
    var result = await myProxy.deleteActivity(activityId);
    expect(result.status).toBe(204);
});

test("Update Activity Details", async () => {
    var activityData = {
        activityType: "01",
        resourceId: "FLUSA",
    };
    var result = await myProxy.createActivity(activityData);
    expect(result.status).toBe(201);
    var aid = result.data.activityId;
    var initialName = "Gizella Quintero";
    var data = {
        customerName: "NewName",
    };
    var result = await myProxy.updateActivity(aid, data);
    expect(result.data.activityId).toBe(aid);
    expect(result.data.customerName).toBe(data.customerName);
    expect((await myProxy.getActivityDetails(aid)).data.customerName).toBe(
        data.customerName
    );
    expect(
        (await myProxy.updateActivity(aid, { customerName: initialName })).data
            .customerName
    ).toBe(initialName);
    activityList.push(aid);
});

test("Update non valid Activity Details", async () => {
    var aid = -1;
    var result = await myProxy.updateActivity(aid, {});
    expect(result.status).toBe(404);
});

test("Set File Property (Text)", async () => {
    var activityData = {
        activityType: "02",
        resourceId: "NVUSA",
        customerName: faker.person.fullName(),
    };
    var result = await myProxy.createActivity(activityData);
    expect(result.status).toBe(201);
    var aid = result.data.activityId;
    var fileName = "test.txt";
    var fileContent = "Hello World";
    var contentType: string = "text/plain";
    var blob = new Blob([Buffer.from(fileContent)], { type: contentType });
    var result = await myProxy.setActivityFileProperty(
        aid,
        "ATTACHMENT",
        blob,
        fileName,
        contentType
    );
    try {
        expect(result.status).toBe(204);
    } catch (error) {
        console.error(result);
        throw error;
    }
    activityList.push(aid);
});

test("Get File Property (Text)", async () => {
    var activityData = {
        activityType: "02",
        resourceId: "NVUSA",
        customerName: faker.person.fullName(),
    };
    var result = await myProxy.createActivity(activityData);
    expect(result.status).toBe(201);
    var aid = result.data.activityId;
    var fileName = `${faker.lorem.word()}.txt`;
    var fileContent = faker.lorem.paragraphs(5);
    var contentType: string = "text/plain";
    var blob = new Blob([Buffer.from(fileContent)], { type: contentType });
    var result = await myProxy.setActivityFileProperty(
        aid,
        "ATTACHMENT",
        blob,
        fileName,
        contentType
    );
    try {
        expect(result.status).toBe(204);
    } catch (error) {
        console.error(result);
        throw error;
    }
    var result = await myProxy.getActivityFilePropertyMetadata(
        aid,
        "ATTACHMENT"
    );
    try {
        expect(result.status).toBe(200);
        expect(result.data.size).toBe(fileContent.length);
        expect(result.data.mediaType).toBe(contentType);
        expect(result.data.name).toBe(fileName);
    } catch (error) {
        console.error(result);
        throw error;
    }

    var result = await myProxy.getActivityFilePropertyContent(
        aid,
        "ATTACHMENT",
        contentType
    );
    try {
        expect(result.status).toBe(200);
        expect(result.data).toBe(fileContent);
    } catch (error) {
        console.error(result);
        throw error;
    }
    activityList.push(aid);
});

test("Get File Property (Binary)", async () => {
    var activityData = {
        activityType: "02",
        resourceId: "NVUSA",
        customerName: faker.person.fullName(),
    };
    var result = await myProxy.createActivity(activityData);
    expect(result.status).toBe(201);
    var aid = result.data.activityId;
    var fileName = `${faker.lorem.word()}.jpg`;
    var fileContent = readFileSync("test/test_data/test.jpg");
    var contentType: string = "image/jpeg";
    var blob = new Blob([Buffer.from(fileContent)], { type: contentType });
    var result = await myProxy.setActivityFileProperty(
        aid,
        "ATTACHMENT",
        blob,
        fileName,
        contentType
    );
    try {
        expect(result.status).toBe(204);
    } catch (error) {
        console.error(result);
        throw error;
    }
    var result = await myProxy.getActivityFilePropertyMetadata(
        aid,
        "ATTACHMENT"
    );
    try {
        expect(result.status).toBe(200);
        expect(result.data.size).toBe(fileContent.length);
        expect(result.data.mediaType).toBe(contentType);
        expect(result.data.name).toBe(fileName);
    } catch (error) {
        console.error(result);
        throw error;
    }

    var result = await myProxy.getActivityFilePropertyContent(
        aid,
        "ATTACHMENT",
        contentType
    );
    try {
        expect(result.status).toBe(200);
        expect(result.data.size).toBe(fileContent.length);
        //expect(result.data).toBe(fileContent);
    } catch (error) {
        console.error(result);
        throw error;
    }
    activityList.push(aid);
});

test("Get File Property (Full Binary)", async () => {
    var activityData = {
        activityType: "02",
        resourceId: "NVUSA",
        customerName: faker.person.fullName(),
    };
    var result = await myProxy.createActivity(activityData);
    expect(result.status).toBe(201);
    var aid = result.data.activityId;
    var fileName = `${faker.lorem.word()}.jpg`;
    var fileContent = readFileSync("test/test_data/test.jpg");
    var contentType: string = "image/jpeg";
    var blob = new Blob([Buffer.from(fileContent)], { type: contentType });
    var result = await myProxy.setActivityFileProperty(
        aid,
        "ATTACHMENT",
        blob,
        fileName,
        contentType
    );
    try {
        expect(result.status).toBe(204);
    } catch (error) {
        console.error(result);
        throw error;
    }
    var result = await myProxy.getActivityFileProperty(aid, "ATTACHMENT");
    try {
        expect(result.status).toBe(200);
        expect(result.data.size).toBe(fileContent.length);
        expect(result.data.mediaType).toBe(contentType);
        expect(result.data.name).toBe(fileName);
        expect(result.data.content.size).toBe(fileContent.length);
    } catch (error) {
        console.error(result);
        throw error;
    }
});
