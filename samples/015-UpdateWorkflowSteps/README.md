# updateWorkflowSteps

## Description

This plugin is used to update workflow steps based on previously completed related activities ( linked, segmented, etc... )

## Parameters

**_Secure Parameters_**

-   `master_activity_id_property` : name of the property used to identify RELATED activities. It is usually the Service Request Number, Work Order Number or Project Number.
-   `workflow_steps_properties` : name of the properties used to identify completion of steps of the workflow.
-   `max_days_to_check` : How many days in the past I need to look for completed activities to copy their completion checks to the current activity.

**_Open Parameters_**

-   `final_status` : final status of the activity. It has to be used to indicate if it is required to start the activity or just update the properties

**_Properties needed_**

None

## How to use

Add the plugin as a button within the activity details screen.

Once the button is clicked, it will copy all the previously completed activities checked properties ( ) to the current activity.
If there is an status indicated on `final_status` , it will also update the status of the activity, if not, it will just update the properties

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
