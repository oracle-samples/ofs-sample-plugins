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

## Building the code

1. Install Node.js and npm. You can download the installer from the [Node.js website](https://nodejs.org/).
2. Install the Oracle JET CLI by running the following command:

    ```bash
    npm install -g @oracle/ojet-cli
    ```

    This will install the Oracle JET CLI globally on your system.

3. Install the necessary dependencies by running the following command:

    ```bash
    npm install
    ```

4. Build the code by running the following command:

    ```bash
    ojet build --release
    ```

    This will compile the source code and generate the necessary files for the plugin, including a zip file that you can use to install the plugin in Oracle Field Service.

    Note: due to the restriction in number of files uploaded as part of a plugin itis important to upload the code in `release` form. If you forget to add `--release` the code will not be bundled and therefor it will not be fully uploaded. In case your plugin is very simple and you want to upload all the source code and libs it is possible to do it by modifying the `plugin_descriptor.json` file.

## Installation

Upload the generated zip file to Oracle Field Service to install the plugin.

## Contributing

If you encounter any issues or have suggestions for improvements, please feel free to contribute to this project. You can submit bug reports or pull requests on the GitHub repository.

## Addicional documentation:

-   [Oracle JET](https://www.oracle.com/webfolder/technetwork/jet/index.html)
-   [Oracle JET Cookbook](https://www.oracle.com/webfolder/technetwork/jet/jetCookbook.html)
-   [Development environment](https://docs.oracle.com/en/middleware/developer-tools/jet/15.1/vdom/get-started-virtual-dom-architecture-oracle-jet.html#GUID-ED9C053F-76CE-4D3A-93D3-C2E45202D26C)
