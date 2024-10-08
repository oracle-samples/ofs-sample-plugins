# PartialCompletion

## Description

This plugin will allow the user to set the Communicated Window Start and End based on an Appointment Value.
Setting a naroww Communicated Window Start and End is the best way to Lock an activity to an ETA with the current functionality.

## Parameters

aid
A_ORIGINAL_WORK_TYPE_LABEL
A_ORIGINAL_WORK_TYPE_DESC
aworktype
date
astatu

**Secure Parameters**

partialCompletionActivityType : activity type that I am going to use for the suspended activity. It allows the dispatchers to see the color of the activity properly as COMPLETED although it is actually suspended.

**Open Parameters**

partialCompletionActivityType : if I want to create different buttons with different SUSPENDED activity types, I can use this option.

**Properties needed**

none

## How to use

Add this plugin as part of the Activity Details Screen.
Make the button visible only for started activitis and name it Partially Complete activity.

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
