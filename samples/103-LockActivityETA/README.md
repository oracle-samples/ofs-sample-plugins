# README

This template is designed to help you get started with building a plugin using Oracle JET (JavaScript Extension Toolkit).

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

- [Oracle JET](https://www.oracle.com/webfolder/technetwork/jet/index.html)
- [Oracle JET Cookbook](https://www.oracle.com/webfolder/technetwork/jet/jetCookbook.html)
- [Development environment](https://docs.oracle.com/en/middleware/developer-tools/jet/15.1/vdom/get-started-virtual-dom-architecture-oracle-jet.html#GUID-ED9C053F-76CE-4D3A-93D3-C2E45202D26C)

