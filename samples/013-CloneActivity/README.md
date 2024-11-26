# CloneActivity

## Description

This plugin will allow the user to create a non-scheduled copy of the activity.

## Parameters

-   "appt_number"
-   "length"
-   "ETA"
-   "astatus"
-   "date"
-   "caddress"
-   "ccity"
-   "ccompany"
-   "cname"
-   "cstate"
-   "czip"
-   "aworktype"

**Secure Parameters**

none

**Open Parameters**

none

## How to use

Add this plugin as part of the Activity Details Screen.

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
