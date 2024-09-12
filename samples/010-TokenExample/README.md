# TokenExample

## Description

This plugin as an example on how to use applications to access OFS APIs

## Parameters

none

**Secure Parameters**

none

**Open Parameters**

none

**Properties needed**

none

## How to use

Add this plugin as part of any screen.
Add an application as part of the plugin configuration.
Ensure that the application has access to the getSubscriptions API.
If the application has been properly configured, it will return a popup window with the result of the getSubscriptions API
If the application is missing, it will return an alert indicating that the proxy has not been created.
If the application doesn't have the right permission configured, it will show the response in the popup window.

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
