/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as ko from "knockout";
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import * as ResponsiveKnockoutUtils from "ojs/ojresponsiveknockoututils";
import { OFSPlugin, OFSMessage, OFSOpenMessage, OFSInitMessage, OFSInitMessage_applications, Method, OFSCallProcedureResultMessage } from "./ofs-plugin-core/plugin";
import Context = require("ojs/ojcontext");
import * as Translations from "ojs/ojtranslation";
import PluginLogger from "./utils/pluginLogger";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "oj-c/button";
import "ojs/ojdialog";
import { DialogElement, ojDialog } from "ojs/ojdialog";
import "oj-c/menu-button";
import { MenuItems, MenuSelection, CMenuButtonElement, MenuItemSelectionDetail } from 'oj-c/menu-button';
import "ojs/ojtoolbar";
import "oj-c/list-view";
import "oj-c/list-item-layout";
import "oj-c/message-toast";
import "oj-c/progress-circle";
import "oj-c/button";

/**
 * Override the OFSOpenMessage class form ./ofs-plugin-core/plugin as per the needs of the plugin 
 */
class OFSCustomOpenMessage extends OFSOpenMessage {
  activity: any;
  openParams: any;
  resource: any;
  user:any;
  allowedProcedures: any;
}

/**
 * Override the OFSInitMessage class form ./ofs-plugin-core/plugin to include the properties as needed by this plugin.
 */
class OFSCustomInitMessage extends OFSInitMessage {
  attributeDescription: any;
}

class RootViewModel extends OFSPlugin {
  smScreen: ko.Observable<boolean>|undefined;
  appName: ko.Observable<string>;
  openData: ko.Observable<OFSCustomOpenMessage>|undefined;
  logger: PluginLogger;
  loggingEnabled: ko.Observable<boolean> = ko.observable(false);
  toastMessages: ko.ObservableArray;
  messageDP: ArrayDataProvider<ko.ObservableArray,any>;
  logMenuItems: ko.ObservableArray<MenuItems>;
  Translations = Translations; //Set in a property. the import variable aren't accessible in the views
  logsDP = ko.observable(new ArrayDataProvider([]));

  //Promises Collection to await message responses from OFS and fulfil the with responses.
  ofsMessagePromises: Array<{id:string,pResolve: Function, pReject: Function}> = new Array<{id:string,pResolve: Function, pReject: Function}>();

  //event handlers
  closeMessage: (event:any)=>void;
  getIconTemplate: (context:any) => void;
  logMenuHandler: (event: { detail: MenuItemSelectionDetail }) => void;
  getLocalDate: (date:string) => void;

  /**
   * !!!Important!!!. The controller is normally initialized in the root.ts (or root.js) class.
   * This sample plugin includes the functionality to capture the logs in persistant storage on uers' device when enabled in case some Technicians run into some issues. 
   * Because of that, Do not directly initialize the controller, instead, use the static method "initializeController" of this class. 
   * That method sets up the logger, initializes and returns an instance of this controller.
   * For example, see the init method in root.ts.
   * @param pluginTag Name or Tag of the plugin.
   */
  constructor(pluginTag:string, logger:PluginLogger) {
    super(pluginTag); //Pass Plugin Name/Tag as input parameter\

    // media queries for responsive layouts
    let smQuery: string | null = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery) {
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    }

    // application Name used in Branding Area
    this.appName = ko.observable(pluginTag);
    this.logger = logger;

    //initialize toas message notification Data Provider.
    this.toastMessages = ko.observableArray();
    this.messageDP = new ArrayDataProvider(this.toastMessages, {
      keyAttributes: 'id'
    });

    //Log Menu Setup
    this.logMenuItems = ko.observableArray<MenuItems>([
      {
        label: Translations.getTranslatedString('ViewLogs'),
        key: "viewLogs",
        startIcon: { class: 'oj-ux-ico-view' }
      },
      {
        label: Translations.getTranslatedString('DownloadLogs'),
        key: 'downloadLogs',
        startIcon: { class: 'oj-ux-ico-download' }
      },
      {
        label: Translations.getTranslatedString('ClearLogs'),
        key: 'clearLogs',
        startIcon: { class: 'oj-ux-ico-trash' }
      }
    ]);

    //#region ui event handlers
    this.closeMessage = (event:any) => {
      const closeMessageKey = event.detail.key;
      this._handleMessageClose(closeMessageKey);
    };
  
    this.getIconTemplate = (context:any) => {
        if (context.data.progressValue !== undefined) {
            return 'inProgress';
        }
        return undefined;
    };
  
    this.logMenuHandler = (event: { detail: MenuItemSelectionDetail }) => {
      switch (event.detail.key.toString()) {
        case "viewLogs":
          this.viewLogs();
          break;
        case "clearLogs":
          this.clearLogs();
          break
        case "downloadLogs":
          this.downloadLogs();
          break
        default:
          break;
      }
    }

    this.getLocalDate = (date:string) : string => {
      //return date ? ojconverterutils_i18n.IntlConverterUtils.dateToLocalIsoDateString(new Date(date)) : "";
      return date ? new Date(date).toLocaleString() : "";
    };
    //#endregion

    // release the application bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();        
  }

  /**
   * A static method to create and return the instnce of this class. This is needed to await the db initalization (which is async) when instantiating the logger.
   * If we don't await, then some log calls could be made by the code which would fail if the db has not finished initalizing.
   * @returns {Promise.<RootViewModel>}
   */
  static initializeController(pluginTag:string): Promise<RootViewModel> {
    return new Promise(async (resolve, reject) => {

      // initialize the logger before the controller and pass as a paramter to constructor.
      // initialize the logger with true flag in 2nd parameter to capture any logs during the plugin initializaiton/opening phase. 
      // Logs can then be disabled per setup when plugin opens.
      // You can, ofcourse, change this per your requirements. ;-)
      let logger = await PluginLogger.init(
          true, 
          pluginTag
      );
      let app = new RootViewModel(pluginTag, logger);
      resolve(app);
    })
  }

  //#region OFS Plugin Initialization & Messaging

  /**
   * Override of the ./ofs-plugin-core/plugin class method. Implementing the logic to store the init message during the initializing phase.
   * This stored InitData is then retrieved and used when plugin is launched by user via open or by system via wakeup.
   * @param message 
   */
  override init(message: OFSCustomInitMessage): void {
    console.log(`${this.tag}: ` + "In Init Method", message);
    this.logger?.log(`${this.tag} Logger >> ` + "In Init Method");
    this.storeInitProperty("attributeDescription", JSON.stringify(message.attributeDescription));  
  }

  /**
   * Implementation of the Open method from parent class. i.e. ./ofs-plugin-core/plugin.
   * @param data Data Received from OFS Core application
   */
  open(data: OFSCustomOpenMessage): void {
    this.logger.log(`${this.tag} Logger >> ` + "Open message recieved from OFS.",data); //persistant logging to retrieved from user's mobile device
    this.openData = ko.observable(data);
    this.loggingEnabled(this.openData().securedData.logEnabledFor.split(',').includes(this.openData().user.ulogin)); //check if logging is enabled for this user
    this.logger.isEnabled = this.loggingEnabled(); //set the enabled flag in Logger.

    //read the language from user object and store for later use. If the language preference is changed since last launch, plugin needs to be restarted for it to take effect.
    let oldLang = window.localStorage.getItem(`lang`);
    let newLang = this.openData().user.languageCode;
    if(oldLang !== newLang){
      window.localStorage.setItem(`lang`, newLang);
      
      //ask OFS to relaunch the plugin since the language preference has changes and refresh is needed for OJET register the new lang and load resources accordingly.
      this.sendMessage(Method.Close,{
        apiVersion: 1,
        method: "close",
        entity: "activity", //change according to your plugin
        backScreen: "plugin_by_label",
        backPluginLabel: "OJET-MVVM", //Label by which the plugin is created in OFS.
        backPluginOpenParams : this.openData().openParams //pass any open params as received
      })
    }
  }

  /**
   * This override calls the sendMessage method of parent class and return a promise to calling function.
   * The promise is stored in an array and is fulfilled when response is recived from OFS.
   * An example can be seen in the orriidden "callProcedureResult" method below.
   * @param method 
   * @param data 
   * @returns 
   */
  override sendMessage(method: Method, data?: any): Promise<OFSMessage> {
    return new Promise<OFSMessage>((resolve, reject) => {
      if(!data.callId){
        data.callId = Date.now(); //generate and assign a unique call id.
        //TODO: use proper random string generator for call Ids. 
      }
      this.ofsMessagePromises.push({id:data.callId, pResolve: resolve, pReject: reject}); //store the promise to resolve/reject later when response is received.
      super.sendMessage(Method.CallProcedure,data); 
    });
  }
  
  /**
   * Override to call the sendMessage of the implementing class and not call the parent class method directly.
   * @param data 
   * @returns 
   */
  override callProcedure(data?: any): Promise<OFSMessage> {
    return this.sendMessage(Method.CallProcedure,data);
  }

  /**
   * Override to handle the response from OFS.
   * Ths method finds and fulfills the pending promise as resolve becuase if the error is returned, thent he "error" method is sent by OFS.
   * @param parsed_message 
   */
  override callProcedureResult(parsed_message: OFSCallProcedureResultMessage): void {
    let promiseObj = this.ofsMessagePromises.find(x=> x.id == parsed_message.callId);
    if(promiseObj){
      promiseObj.pResolve(parsed_message);
    }
  }

  /**
   * Override the error message to handle message errors received from OFS.
   * Contrary to "callProcedureResult" This method finds and fulfills the pending promise as reject.
   * @param parsed_message 
   */
  override error(parsed_message: any): void {
    if(parsed_message.callId){
      let promiseObj = this.ofsMessagePromises.find(x=> x.id == parsed_message.callId);
      if(promiseObj){
        promiseObj.pReject(parsed_message);
      }
    }
  }

  //#endregion

  //#region MICS Event Handlers

  /**
   * Show an in progress toast message
   * @param launcher launching component. e.g. Button that wsa clicked
   * @param message Custom message to be displayed. If not provided, default message is shown.
   * @returns 
   */
  showBusy(launcher?:any, message?:string):Promise<void> {
    console.debug("Opening busy popup.");

    return new Promise((resolve, reject) => {
        this.toastMessages([{
            id: 'busyPopup',
            severity: 'info',
            summary: message ?? Translations.getTranslatedString('InProgressMessage'),
            detail: '',
            progressValue: -1,
            closeAffordance: 'none'
        }]);
        Context.getPageContext()
            .getBusyContext()
            .whenReady()
            .then(() => {
                this._handleMessageClose('busyPopup');
                if(launcher) launcher.disabled = false;
            });
        resolve();
    })
  }

  /**
   * 
   * @param severity 
   * @param summary Mussage summary/heading
   * @param detail Detailed message
   * @param autoClose Auto close the message?
   * @param clear 
   */
  showToast(severity:'info' | 'success' | 'warning' | 'error', summary:string, detail:string, autoClose:boolean = true, clear:boolean = false): void {
    let data = clear ? [] : this.toastMessages();
    data.push({
        id: Date.now(),
        severity: severity,
        summary: summary,
        detail: detail,
        autoTimeout: autoClose ? 5000 : 'off'
    });
    this.toastMessages(data);
  }

  /**
   * Closes a specific toast message by Provided Key/Message Id.
   * separated from the Close Button click handler so that it can be invoked to close messages programatically, e.g. busy toast.
   * @param key MessageId to be closed.
   */
  _handleMessageClose(key:string|number) {
    this.toastMessages(this.toastMessages().filter((message) => message.id !== key)); //remove the message with provided id from the toastMessates collection.
  }

  /**
   * A generic reuseable confirmation dialog handler. Returns a promise which resolves to 'yes' or 'no' based on the action user took.
   * The caller methods awaits the promise and can proceed with operation if response is 'yes' or cancel otherwise.
   * This function only adds the event listeners to the dialog and handles opening/closing. Dialog itself is configured on the index.html page. Lookup 'confirmDialog'.
   * @param event Currently accepts null and is not implemented. Could be modified per needs.
   * @returns 
   */
  getConfirmation(event?:Event):Promise<string>{
    return new Promise((resolve,reject)=>{
      let dialog = document.getElementById('confirmDialog') as DialogElement;
      if(!dialog){
         reject("Confirm dialog not available!");
         return; 
        }
      
      // the event listeners below are added with flag once = true so that the listener is only invokes once and then removed. 
      // A new one is added when this function is called again ensuring the event doesn't get multiple listerens.  
      dialog.addEventListener(
        'ojClose',
        function(event) {
          resolve(dialog.getAttribute('data-dialog-action')??"no");
        },{once:true});
      dialog.addEventListener('ojAction', function(event) {
        var button = event.target as HTMLElement;
        dialog.setAttribute('data-dialog-action', button.getAttribute(
          'data-button')??"no");
        dialog.close();
      },{once:true});
      dialog.open();
    })
  }

  /**
   * Calls the getLogs function of PluginLogger and displayes the data as list in the dialog.
   */
  viewLogs(){
     //show busy loader on UI
    this.showBusy().then(()=>{
      //get page busy context.
      var resolveContext = Context.getPageContext().getBusyContext().addBusyState({
          description: "Getting logs to dislay in Dialog.",
      });
      this.logger.getLogs().then((data)=>{
        this.logsDP(new ArrayDataProvider(data,{
          keyAttributes: "Id"
        }));
        (document.getElementById('viewLogsDialog') as ojDialog).open();
      })
      .catch((error)=>{

      })
      .finally(()=>{
        resolveContext(); //resolve busy context
      })
    })
  }

  /**
   * Clear logs from persistent storage
   * @param event Currently accepts null and is not implemented. Could be modified per needs.
   */
  clearLogs(event?:Event){
    this.getConfirmation(event).then((response)=>{
      if(response === 'yes'){
        this.logger.clearLogs().then((success)=>{
          if(success){
            this.showToast("success", Translations.getTranslatedString('LogsClearedSuccess'), "", true, false);
          }
        })
      }
    })
  }

  /**
   * downloads logs on user's device as a csv file
   * @param event Currently accepts null and is not implemented. Could be modified per needs.
   */
  downloadLogs(event?:Event){
    this.showBusy().then(()=>{
      var resolveContext = Context.getPageContext().getBusyContext().addBusyState({
        description: "Downloading Logs CSV.",
      });
      this.logger.downloadLogsCSV(this as RootViewModel)
      .then(()=>{
        this.showToast("success", Translations.getTranslatedString('LogsDownlaodSuccess'), "", true, false);
      })
      .catch((response)=>{
        this.showToast("error",Translations.getTranslatedString("LogDownloadFailed"),JSON.stringify(response),false,false);
        this.logger.log(`Error Downloading Logs File: ${JSON.stringify(response).replaceAll("\"","\"\"")}`,); //doubling the quotes in the json to to properly add to CSV.
        //handle error
      })
      .finally(resolveContext);//resolve the page busy context in finally regardless if the call was success or error.
    })
  }

  //#endregion
}

export default RootViewModel;