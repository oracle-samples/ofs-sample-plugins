# Samples:

These instructions are valid for all the provided samples. For specific sample information please read the README file on each folder

## Before you start ###

Install all the required packages with `npm install`

It is recommended (but not required) to have in your system an instance of `webpack` ( https://github.com/webpack/webpack) and `just` (https://github.com/casey/just). The following instructions assume that you have both.

## Preparing the code during development ##

The code provided uses Typescript to ensure strict typing control. As OFS uses pure Javascript you should always precompile to Javascript before uploading.

The simple way (if you have `just` and `webpack`):

```
    just dev-pack
```

This will create a `packed` version of the code in the `dist/` folder. In development mode the code is not compressed \ scrambled.

The not-so-simple way (if you just have `webpack`):

```
    rm -rf dist/
    mkdir dist
    cp index.html dist/
    webpack --mode=development`
```

## Uploading the code to your OFS environment

OFS requires a ZIP file containing only Javascript and HTML files, with a maximum of 10 files per plugin and 5 Mb size. Uploading plugins can be done via GUI, or using a REST API (see the OFS documentation). There are several utilities (not currently supported or endorsed by Oracle) that can simplify the upload.

The simple way:
- Create a ZIP archive: `just dev-zip` or `just zip`
- If you have an upload manager: `just upload`. If not, use the GUI.

The medium way:

1. Create the zip file for the plugin
```
    cd dist
    zip plugin.zip index.html main.js *.html *.css`
```
2. Log into OFS and in Configuration / Plugins create a hosted plugin

Note: The upload manager will create the required properties and parameters automatically based on the `descriptor.json` information but if you are creating it manually do it on this step.

3. Reload the browser / app
