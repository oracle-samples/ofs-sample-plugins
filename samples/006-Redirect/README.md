# Redirect

## Description

This plugin is designed to facilitate access to any standard screen thas is avaiable as redirect options in the Plugin Framework

## Parameters

none

**Secure Parameters**

none

**Open Parameters**

The plugin will read any parameter here and it will pass with the same name and value as part of the close message payload.

Use this document to understand the fields that can be used

https://docs.oracle.com/en/cloud/saas/field-service/fapcf/c-redirectionwithclosemethod.html#RedirectionWithTheCloseMethod-1BA7B347

If the value is an string, it will be passed as it is. If the value is between "`", it will expect this format

`entity_name.entity_property`

and it will look for entity ( activity or resource ) and the property in the message received by the plugin.

e.g. : backActivityId : `activity.aid`

and the plugin receives the message

...
"activity":{"aid":"3954926"}
...

it will send the pair backActivityId : "3954926"

all the entity_property labels used will need to be included as available properties in the Plugin deployment

`Mandatory openParameters`

backScreen

`Optional openParameters`

backActivityId
backInventoryId
backPluginLabel

The plugin still not supports backPluginOpenParameters

**Properties needed**

All the properties that are expected to be used in the openParameters
In addition to that, if it is required to capture the last screen and the last timestamp when the plugin was open, you can create an use 2 custom properties

- `PA_REDIRECT_TS`: Last timestamp when the plugin was opened.
- `PA_REDIRECT_BACKSCREEN`: Last timestamp when the plugin was opened.

## How to use

Add this plugin as one step of the workflow when you want to redirect to that specific screen, and use the right parameters as openParameters

## For development

### How to build

1. Install the dependencies

   `npm install`

2. Build and compress the plugin

   `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

   `cd dist; zip plugin.zip index.html main.js`
