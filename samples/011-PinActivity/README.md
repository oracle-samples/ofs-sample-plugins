# PinActivity

## Description

This plugin will allos the user to set the Communicated Window Start and End based on an Appointment Value

## Parameters

A_APPOINTMENT_TIME
ETA
length
date

**Secure Parameters**

none

**Open Parameters**

action : PIN / UNPIN. It will define if I want to open the PIN activity action or if I want to UNPIN it.
minutesThreshold : number of minutes I want to set between Communicated Window Start and End

**Properties needed**

none

## How to use

Add this plugin as part of the Activity Details Screen
Make the Unpin option visible only when the value A_APPOINTMENT_TIME is not null

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
