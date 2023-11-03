# getUsers

## Description

This plugin is designed to accumulate the duration of all the suspended segments of one activity.
It also is able to count the time between the first start time and the final completion time.

## Parameters

**Secure Parameters**

None

**Open Parameters**

- `openAction`: Action that indicates if we are suspending or completing the activity. Possible values : [`suspend`, `complete suspended`]

**Properties needed**

None

## How to use

Add the plugin to 2 buttons inside the activity details. Both will be visible only when the activity is started. One button will be used to suspend, the other one will be used to open the close activity screen.

## For development

### How to build

1. Install the dependencies

   `npm install`

2. Build and compress the plugin

   `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

   `cd dist; zip plugin.zip index.html main.js`
