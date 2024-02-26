# HelloWorld

## Description ##

This plugin shows the basic structure of a plugin. It does not do anything, but it can be used as a starting point for new plugins.

## Parameters ##

***Secure Parameters***

None

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

   you might also need to use this command instead, if the webpack folder is not added to the PATH list

   `./node_modules/.bin/webpack --mode=production`

3. Copy index.html from the project root folder to the dist folder

    `cp index.html dist/`

4. Create the zip file that can be uploaded to OFS

    `cd dist; zip plugin.zip index.html main.js` 

