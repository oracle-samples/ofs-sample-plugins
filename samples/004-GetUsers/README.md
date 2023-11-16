# getUsers

## Description ##

This plugin is used to get all users from the OFS instance

## Parameters ##

***Secure Parameters***

- `ofsInstance`: The OFS instance to get the users from (e.g: `sunrise0511`)

- `ofsClientId`: The OFS client id to use for authentication

- `ofsClientSecret`: The OFS client secret to use for authentication

***Open Parameters***

None

***Properties needed***

None

## How to use ##

Add the plugin to a button and call the plugin with the parameters. It does not present a GUI, but it will download a csv file containing the required information.

## For development ##

### How to build ###

1. Install the dependencies

    `npm install` 

2. Build and compress the plugin

    `webpack --mode=production` 

3. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js` 

