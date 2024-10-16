# PinActivity

## Description

This plugin will allow the user to set the Communicated Window Start and End based on an Appointment Value.
Setting a narrow Communicated Window Start and End is the best way to lock an activity to an ETA with the current functionality.

## Parameters

A_APPOINTMENT_TIME
ETA
length
date

**Secure Parameters**

none

**Open Parameters**

**_pluginMode:_**

-   `SCREEN` (Default): The plugin opens a screen that allows the user to change the `A_APPOINTMENT_TIME` before setting the Communicated Window.
-   `BUTTON`: The plugin assumes the value of the field is already there so it just uses the value to execute the action without any screen.

    **DISCLAIMER**: If you are editing the activity, you need to save it before invoking the plugin. The OFS plugin framework is not able to read screen values, but the values already saved for that activity.

**_appointmentOrigin:_**

-   `A_APPOINTMENT_TIME` (Default): Uses the property `A_APPOINTMENT_TIME` as the source of the Locked ETA.
-   `CURRENT`: Uses the current ETA as the source of the Locked ETA.
-   `TIMESLOT`: Uses the start time of the timeslot as the source of the Locked ETA.

**_pinAction:_**

-   `PIN` / `UNPIN`: It will define if I want to open the PIN activity action or if I want to UNPIN it.

**_minutesThreshold:_**

-   Number of minutes I want to set between Communicated Window Start and End

**Properties needed**

none

## How to use

Include an application with access to OFS Core Activity API in the Plugin.
Add this plugin as part of the Activity Details Screen.
Make the Unpin option visible only when the value A_APPOINTMENT_TIME is not null and the activity status is pending.

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
