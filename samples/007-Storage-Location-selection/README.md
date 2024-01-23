# Redirect

## Description

This plugin is designed to select the default storage of the uninstall screen based on a customer property.
Once the default storage has been select, it will redirect the user to the Deinstall Inventory screen

## Parameters

none

**Secure Parameters**

none

**Open Parameters**

none

**Properties needed**

`inventory properties`

"invid",
"inv_pid",
"PI_ORIGIN_PID"

## How to use

Add this plugin in the Inventory Details screen only for installed inventory items

## For development

### How to build

1. Install the dependencies

   `npm install`

2. Build and compress the plugin

   `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

   `cd dist; zip plugin.zip index.html main.js`
