## Functions implemented

| Function | URL |
| ---------| ----------- |
| `getActivities`| https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-activities-get.html |
| `createActivity`| https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-activities-post.html |
| `deleteActivity`| https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-activities-activityid-delete.html |
| `getActivityDetails`| https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-activities-activityid-get.html |
| `setFileProperty`|https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-activities-activityid-propertylabel-put.html |
| `getFileProperty`| https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-activities-activityid-propertylabel-get.html | 
| `updateActivity`| https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-activities-activityid-patch.html
| `getSubscriptions` | https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofsccore-v1-events-subscriptions-get.html
| `importPlugins` | https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofscmetadata-v1-plugins-custom-actions-import-post.html
| `getProperties` | https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofscmetadata-v1-properties-get.html
| `getPropertyDetails` | https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofscmetadata-v1-properties-label-get.html
| `updateProperty` | https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofscmetadata-v1-properties-label-patch.html
| `createReplaceProperty` | https://docs.oracle.com/en/cloud/saas/field-service/cxfsc/op-rest-ofscmetadata-v1-properties-label-put.html

## Sample

1. Generate the javascript version of the module (`npm run dist`). A new folder called `dist` will be created, containing a javascript module (`ofs.es.js`)
2. Create in the same folder as the sample a file called `credentials_sample.json` with the following content, replacing the placeholders by your own environment data:
```
{
    "instance": "<YOUR OFS INSTANCE NAME>",
    "clientId": "<YOUR APPLICATION CLIENT ID>",
    "clientSecret": "<YOUR APPLICATION CLIENT SECRET>"
}
```
3. Run the sample. The output should be a list of the active event subscriptions in your environment
```
node sample.js
```