# Redirect

## Description

This plugin is designed to Force the start of any activity in the technician route, no matter which was the previous order.

Depending on the condition, it will trigger different actions.

If the technicians wants to start an activity while I have another activity started, it will suspend the current started activity
If the pending activity I want to start is not the next one in the route, I will suspend such activity to make it non-ordered and it will start it.

## Parameters

none

**Secure Parameters**

backScreen : screen where I want to redirect the technician after starting the activity ( default : plugin_by_label )
redirectPluginLabel : if the redirect option is a plugin, label of the plugin ( default : debriefing )

**Open Parameters**

none

**Properties needed**

aid
astatus
position_in_route

## How to use

Add this plugin to the Activity Details Screen for any activity in Pending status

## For development

### How to build

1. Install the dependencies

   `npm install`

2. Build and compress the plugin

   `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

   `cd dist; zip plugin.zip index.html main.js`
