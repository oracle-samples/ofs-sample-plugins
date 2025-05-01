# populateTeamProperties

## Description

This plugins allows the update the right properties to report team labor using an OFS Form

## Parameters

**_Secure Parameters_**

-   `propertiesPrefix` : Prefix to be used to update the properties. Recommended value : A*TEAM_PROPERTIES*
-   `maxNumberOfassistants` : Max. number of team members ( in addition to the team leader ) that the application will manage. Default = 5

**_Open Parameters_**

None

**_Properties needed_**

-   `length`
-   `ETA`
-   `end_time`
-   `A_TEAM_PROPERTIES_pname_1`
-   `A_TEAM_PROPERTIES_pid_1`
-   `A_TEAM_PROPERTIES_ETA_1`
-   `A_TEAM_PROPERTIES_end_time_1`
-   `A_TEAM_PROPERTIES_pname_2`
-   `A_TEAM_PROPERTIES_pid_2`
-   `A_TEAM_PROPERTIES_ETA_2`
-   `A_TEAM_PROPERTIES_end_time_2`
-   `A_TEAM_PROPERTIES_pname_3`
-   `A_TEAM_PROPERTIES_pid_3`
-   `A_TEAM_PROPERTIES_ETA_3`
-   `A_TEAM_PROPERTIES_end_time_3`
-   `A_TEAM_PROPERTIES_pname_4`
-   `A_TEAM_PROPERTIES_pid_4`
-   `A_TEAM_PROPERTIES_ETA_4`
-   `A_TEAM_PROPERTIES_end_time_4`
-   `A_TEAM_PROPERTIES_pname_5`
-   `A_TEAM_PROPERTIES_pid_5`
-   `A_TEAM_PROPERTIES_ETA_5`
-   `A_TEAM_PROPERTIES_end_time_5`

## How to use

Create the properties according to the max number of team member ( default is 5 + the team leader).

For the ETA and end_time properties, it is recommended to include the regular expression /^\b((1[0-2]|0?[1-9]):([0-5][0-9]) ([AaPp][Mm]))/

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
