# OJET-MVVM
This plugin is built using OJET MVVM Architecture. This plugin is ready to be a starting point for your new Custom Plugin. It provides the following Functionalities.
- iFrame sandbox: A text page that opens the plugin in an iFrame enableing testing all OFS Plugin Framework methods locally.
- Logging: Capturing logs in persistent storage to analyse the problems during opearations
- Multi-lingual
- Some generic reusable functions e.g. 
    - Show busy loader
    - Get confirmation dialog
    - Show non-disruptive toast message to show confirmation/error messages etc.

Goto [Features](#features) section for details.

## Getting Started
1. First of all, you'll need to setup your dev environment for Oracle JET. 
See OJET Guide to [Create a Development Environment for Oracle JET](https://docs.oracle.com/en/middleware/developer-tools/jet/17.1/develop/getting-started-oracle-javascript-extension-toolkit-jet.html#GUID-ABE2373F-287F-4C3A-BEBD-02F179F399FD)
2. You can then either download the source of this project and start from there or create a new project usign OJET CLI Tooling.
    - If you want to continue with source of this sample<br/>
    run `ojet restore` at the root directory of the project to install all the dependencies
    - or, you can create a new project from scratch. This sample project was created with the following command.
    
            ojet create OJET-MVVM --template=basic --typescript
    
        To understand the command and all supported flags, see [About ojet create Command Options for Web Apps](https://docs.oracle.com/en/middleware/developer-tools/jet/17.1/develop/understand-web-application-workflow.html#GUID-5E43A9EB-51E6-4EB4-B1AE-E3E3AAC4A905)

### Dependencies
- Project uses [NodeJS](https://nodejs.org), so first of all you need to install it. The Node Package Manager (NPM) will be installed automatically.
- Project uses [Oracle Jet](https://docs.oracle.com/en/learn/jet-install-cli/index.html#introduction) libraries for UI components and building release package.
- Project uses [ofs-plugin-core](https://github.com/oracle-samples/ofs-plugin-core). This library is only available as ES Module which are not supported by OJET yet, hence code from library was included in this project as local script files instead of a node module.  

## Building & Packaging
use `ojet build` for building the code in development mode. <br/>
use `ojet build --release` to build the code for production deployment.<br/>

### Packaging
upon successful build using `--release` flag, OJET places the optimized/minified files in "web" folder. You need to create a zip archive containing the following files. 
- index.html
- sw.js (if your plugin need offline support)
- js/bundle.js
- css/app.css

**The Archive structure should look like below**
```
plugin.zip
│   index.html  
│   sw.js
├───css
│   │   app.css
├───js
│   │   bundle.js

```

## serving the app in a browser
use `ojet serve` to build the code and serve in the browser for testing.
use `ojet serve --releae` to serve the release version in browser.

## Features
This sample plugin provides following features.

### iFrame Sandbox | Testing OFS Plugin Framework Messsaging Locally
You can open a sandbox web page that acts like a parent application to the plugin just like OFS. You can then launch the plugin in an iframe and testing the message contents & flow between plugin and parent application.

#### Location of the sandbox page
The sandbox web page is available under `root/tests` and name of the file is `test.html`. This files reads init or open messages from `tests/mocks/init-message-mock.js` and `tests/mocks/open-message-mock.js` respectively. You can modify these mock files with the data per your plugin needs. 

#### How to test?
1. Since this plugin uses "@ofs-users/plugin", which mandates the "HTTPS" protocol on OFS/Parent App for communication with plugin, you'll need to obtain/generate a certificate with private key to run the webserver on HTTPS.
    - You can use openssl to generate the required cert & key. See [http-server tslssl](https://www.npmjs.com/package/http-server#tlsssl) for more details.
2. Serve the code using `ojet serve`. This runs the app on http://localhost:8000 by default.
3. user `http-server` node module to fire up the sandbox separately. For examply run the following command on the tests directory.

        npx http-server -p 9999 -S -C "<<path to certificate>>" -K "<<path to key>>"
    
    The above command uses -p flag to use a custom port to avoide any port conflicts
4. The `test.html` defautls the plugin iframe's url to `http://localhost:8000`. 
5. Click the "open frame" button. First time, it initializes the plugin and iframe closes.
6. Click the "open frame" button again, this time the Open Plugin flow is invoked just like when plugin is running in OFS.

### Logging
1. Capturing the Logs in IndexedDB on users device
2. Allowing users to view, download & share and clear the logs
3. Logs can be enabled by OFS Admin for specific User(s) only when trouble shooting is needed and can be disabled later.

#### How to Enable Loging
- Add a Plugin Parameter with following properties <br/>

| Name | Example Value | Description |  
|---|---|---|  
|logEnabledFor| FieldTech1,FieldTech2 | 1 or more Users' Login Id(s) separated by commas for whome to enable the logging |  

- Plugin will check the current logged in user's `ulogin` in above property and will enable the logging if found
- This will also show a menu in the top right of the page for users to 
    - view 
    - download the logs as csv
    - clear the lgos.

#### Don't need logging in your plugin?
- To remove logging from your plugin al-together, do the following.
    - TODO: Add steps to remove logging logic

### Multilingual Support
This plugin implements the internationalization/localization provided by OJET. To understand how it works, please see [Internationalize and Localize Oracle JET Apps](https://docs.oracle.com/en/middleware/developer-tools/jet/17.1/develop/internationalizing-and-localizing-applications.html#GUID-30498436-BE77-43BF-A541-1AFABF62DFBE) for more information.

The language bundles are added to the project under `/src/js/resources/nls` directly as required by OJET. Plugin gets the User's language preference from the OpenMessage sent by OFS to Plugin when user launches the plugini and sets the lang attribute on HTML node. OJET internally loads the translations bunder matching the language/locale code set on HTML node. 

**_Important:_** _Add all language references to `/src/js/resources/translations-bundle.js` file. This is to bundle all the languages' translations files into a single file to keeps number of directories & files combined below 10, which is the OFS Hosted Plugin limit. See Example below on how the references to default (en) and fr translations are added to the bundle._

```js
require(["./nls/translations","./nls/fr/translations"]);
```

### Generic Confirmation Dialog
A generic Confirmation Dialog that can be used in any usecsae where a **yes/no** confirmation is required from users. Upon user's action, **yes** or **no** message is sent back to calling function to proceed/abort the flow.

**Example:**

```js
doAction(event?:Event){
    //display the confirmation dialog
    this.getConfirmation(event).then((response)=>{
        if(response === 'yes'){ //check response
            //proceed with the action.
        }
    })
}
```

### Toast Messages
Ability to display non-interrupting message popup to the user. The messages could be one of these types `success, error, warning, info`. The message could be made auto dissapearing or requiring user to click 'X' button to hide from the UI. For more detials, see [OJET Cookbook Example of MessageToast](https://www.oracle.com/webfolder/technetwork/jet/jetCookbook.html?component=messagetoastCorepack&demo=basic)

**Method Signature**
```js
showToast(severity:'info' | 'success' | 'warning' | 'error', summary:string, detail:string, autoClose:boolean = true, clear:boolean = false): void
```


### Busy/In-Progress & Message
This plugin provides an examplr of a Busy/In-Progress icon & message using OJET MessageToast. 

Example: 
```js
doAction(event?:Event){
    //show busy loader on UI
    this.showBusy().then(()=>{
        //after showBusy is successful, get page busy context.
        var resolveContext = Context.getPageContext().getBusyContext().addBusyState({
            description: "Doing my stuff", //give a description to your page's busy state.
        });
        //DO YOUR STUFF HERE
        //ONCE your operation is compelte, invoke the "resolveContext" like below. This will automatically hid the busy message.
        resolveContext();
    }
}
```
# Useful Links
- [Oracle JET Developers Guid (MVVM)](https://docs.oracle.com/en/middleware/developer-tools/jet/17.1/develop/index.html#GUID-F9B1A1E1-2814-49A0-A59A-0ADAAEFC5E93)
- [Oracle JET Cookbook](https://www.oracle.com/webfolder/technetwork/jet/jetCookbook.html)
- [OFSC Mobile Plug-in Framework](https://docs.oracle.com/en/cloud/saas/field-service/fapcf/index.html)

# TODO 
1. Add unit test examples
2. Add script to copy appropriate files and create a deployable archive.