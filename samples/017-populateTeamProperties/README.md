# populateTeamProperties

## Description

This plugins allows the update the right properties to report team labor using an OFS Form

## Parameters

**_Secure Parameters_**

-   `propertiesPrefix` : Prefix to be used to update the properties. Recommended value : A*TEAM_PROPERTIES*

**_Open Parameters_**

None

**_Properties needed_**

None

## How to use

Add the plugin as a button within the activity details screen.

Once the button is clicked, it will update the properties and it will allow the Form to show the list of technicians.

## For development

### How to build

1. Install the dependencies

    `npm install`

2. Build and compress the plugin

    `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js`
