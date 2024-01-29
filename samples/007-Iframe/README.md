# Redirect

## Description

This plugin is designed as a test to embeed an iFrame in OFS

## Parameters

none

**Secure Parameters**

none

**Open Parameters**

`iframeUrl` : the URL it is required to open within the iframe. Mandatory


**Properties needed**

none

## How to use

Add this plugin to any available screen where you want to open another external URL inside an iframe

## For development

### How to build

1. Install the dependencies

   `npm install`

2. Build and compress the plugin

   `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

   `cd dist; zip plugin.zip index.html main.js`
