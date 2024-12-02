# UndoInstallInventory

## Description

This plugin will allow a technician to undo an inventory installation, defaulting the destination resource to the one used initially to install the part

## Parameters

-   "inv_pid"
-   "invid"
-   "quantity"

**Secure Parameters**

none

**Open Parameters**

none

## How to use

Add this plugin as part of the Inventory Details Screen

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
