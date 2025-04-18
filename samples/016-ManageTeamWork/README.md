# manageTeamWork

## Description

This plugins allows the user to adjust labor lines for the different team members, including the External ID of the technician as the Serial Number of the Labr line

## Parameters

**_Secure Parameters_**

-   `invtype` : inventory type used to create the Labor line.
-   `laborServiceActivity` : service activity used to create the Labor line.
-   `debriefPluginLabel` : Name of the debrief plugin. If the plugin used is the standard plugin, debriefing should be the value used.

**_Open Parameters_**

None

**_Properties needed_**

None

## How to use

Add the plugin as a button within the activity details screen.

Once the button is clicked, it will load all the labor lines for that activity and it will allow the user to add, modify or delete labor lines.

There will be 3 Buttons : DEBRIEF ( Save data and redirects the user to Debrief Screen ), SAVE ( Saves the data without leaving the Screen ) or CANCEL ( Close the screen )

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
