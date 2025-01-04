import RootViewModel from "../appController";

class PluginLogger {

    private _isEnabled:boolean;
    private _dbInstance:IDBDatabase|undefined;
    private _dbName:string;

    get isEnabled(){
        return this._isEnabled;
    }

    set isEnabled(value){
        this._isEnabled = value;
    }

    /**
     * 
     * @param {boolean} isEnabled flag to depict if logging is enabled or disabled
     * @param {string} pluginTag Plugin Tagname to create an Indexed DB to store log entries
     * //@param {Object} ofscConnector OFSC connector instance to call OFS Plugin Framework procedures
     * @param {string} isShareEnabled boolean flag to identify if the "share" procedure of Plugin Framework is available
     */
    constructor(isEnabled:boolean, pluginTag:string) {
        this._isEnabled = isEnabled;
        this._dbName = `${pluginTag}_Logs`; //create DB Name using Plugin Tag.
    }

    /**
     * Need this function so that we can await the DB initialization as constructors can't by async and doesn't support await.
     * @param {Boolean} isEnabled flag to depict if logging is enabled or disabled
     * @param {String} pluginTag name to create an Indexed DB to store log entries
     * @param {Object} ofscConnector OFSC connector instance to call OFS Plugin Framework procedures
     * @param {Boolean} isShareEnabled boolean flag to identify if the "share" procedure of Plugin Framework is available
     * @returns {Promise.<PluginLogger>}
     */
    static init(isEnabled:boolean, pluginTag:string): Promise<PluginLogger> {
        return (async function () {
            let instance = new PluginLogger(isEnabled, pluginTag);
            instance._dbInstance = await instance._initDB();
            return instance;
        }())
    }

    /**
     * Initialized Indexed DB for logging
     * @returns {Promise} Returns a promise containing the IndexedDB instance
     */
    _initDB(): Promise<any> {
        return new Promise<IDBDatabase>((resolve, reject) => {
            let openRequest:IDBOpenDBRequest = indexedDB.open(this._dbName, 1);

            openRequest.onupgradeneeded = this._createDB; //call _createDB method if first time or schema needs updating.

            openRequest.onerror = function (e) {
                console.error("Error opening DB", e);
                //this.LogsDB = null;
                reject(e);
            };

            openRequest.onsuccess = function (e:any) {
                console.log("DB initialized");
                //this._dbInstance = e.target.result;
                resolve(e.target.result);
            };
        });
    }

    _createDB(e:any):void {
        this._dbInstance = e.target.result;
        if (this._dbInstance && !this._dbInstance.objectStoreNames.contains("Logs")) {
            this._dbInstance.createObjectStore("Logs", { keyPath: "Id" });
        }
    }

    /**
     * Writes the message as log on browser console and addes the log in the persistent storage if enabled.
     * @param message 
     * @param params 
     * @returns 
     */
    log(message:string, params?:any):void{
        console.log(message, params); //write the message on Console regardless if persistent logging is enables or not.
        if(!this._isEnabled){
            return;
        }
        this._addLog(message,params);
    }

    /**
     * Writes the message as info on browser console and addes the log in the persistent storage if enabled.
     * @param message 
     * @param params 
     * @returns 
     */
    info(message:string, params?:any):void{
        console.info(message, params); //write the message on Console regardless if persistent logging is enables or not.
        if(!this._isEnabled){
            return;
        }
        this._addLog(message,params);
    }

    /**
     * Writes the message as warning on browser console and addes the log in the persistent storage if enabled.
     * @param message 
     * @param params 
     * @returns 
     */
    warn(message:string, params?:any):void{
        console.warn(message, params); //write the message on Console regardless if persistent logging is enables or not.
        if(!this._isEnabled){
            return;
        }
        this._addLog(message,params);
    }

    /**
     * Writes the message as error on browser console and addes the log in the persistent storage if enabled.
     * @param message 
     * @param params 
     * @returns 
     */
    error(message:string, params?:any):void{
        console.error(message, params); //write the message on Console regardless if persistent logging is enables or not.
        if(!this._isEnabled){
            return;
        }
        this._addLog(message,params);
    }

    /**
     * Add a log entry in the Indexed DB on User's Device
     * @param {String} message 
     * @returns {Promise<void>}
     */
    _addLog(message:string,params?:any): Promise<void> {
        return new Promise(async (resolve, reject) => {
            //check if persistent logging is enabled
            
            if (!this._dbInstance) {
                console.error("Logs DB not initialized");
                this._dbInstance = await this._initDB();
            }
            let transaction = this._dbInstance?.transaction("Logs", "readwrite");
            let store = transaction?.objectStore("Logs");
            store?.put({
                Id: Date.now(),
                Message: message
            });

            if(transaction){
                transaction.oncomplete = function () {
                    console.log("Log added to persistent storage");
                    resolve();
                };

                transaction.onerror = function (e) {
                    console.error("Error saving data to persistent storage", e);
                    reject(e);
                };
            }
        })
    }

    /**
     * Clears all the logs from storage and invokes the call back function.
     * TODO: Implement a logic to periodically clear the logs from user's device to prevent large storage consumption
     * @returns {Promise<boolean|string>} Returns a boolean true if success or error message in reject on failure.
     */
    clearLogs():Promise<boolean|string> {
        return new Promise(async (resolve, reject)=>{
            if (!this._dbInstance) {
                console.error("Logs DB not initialized");
                this._dbInstance = await this._initDB();
            }
            let transaction = this._dbInstance?.transaction("Logs", "readwrite");
            let store = transaction?.objectStore("Logs");
            
            //if transaction or store not-defined, return and invoke callback function with false falg.
            if (!transaction || !store) {
                reject("Store or Transaction is not defined.");
                return 
            }
            store.clear().onsuccess = (event)=>{
                resolve(true);
            };

            transaction.oncomplete = function () {
                console.log("Log cleared from persistent storage");
                resolve(true);
            };

            transaction.onerror = function (e:any) {
                console.error("Error clearing the logs from persistent storage", e);
                reject(`Error clearing the logs from persistent storage. ${e.target.error?.message}`);
            };
        })
    }

    /**
     * Get all the logs from stoage.
     * @returns {Promise<Array<{Id:string,Message:string}>>} Array of objects 
     */
    getLogs():Promise<Array<{Id:string,Message:string}>>{
        return new Promise(async(resolve,reject)=>{
            if(!this._dbInstance){
                console.error("Logs DB not initialized");
                this._dbInstance = await this._initDB();
            }
            let transaction = this._dbInstance?.transaction("Logs", "readwrite");
            let store = transaction?.objectStore("Logs");
            //if transaction or store not-defined, return and invoke callback function with false falg.
            if (!transaction || !store) {
                reject("Store or Transaction is not defined.");
                return 
            }
            if(store){
                store.getAll().onsuccess = (event:any) => {
                    resolve(event.target.result);
                    return;
                }
            }
            //return resolve([]);//return default empty array

        })
    };

    /**
     * Get all the logs from storage as a CSV file.
     * @returns {Promise<Blob>} a csv file.
     */
    getLogsAsCSV():Promise<Blob> {
        return new Promise(async(resolve,reject)=>{
            if (!this._dbInstance) {
                console.error("Logs DB not initialized");
                this._dbInstance = await this._initDB();
            }
            let filename = "Logs.csv"
            let transaction = this._dbInstance?.transaction("Logs", "readwrite");
            let store = transaction?.objectStore("Logs");
            if(!transaction || !store){
                reject("Transaction or Store is not defined. This usually means the Indexed DB is not initialized");
                return;
            } 

            store.getAll().onsuccess = (event:any) => {
                const replacer = (key:any, value:any) => value === null ? '' : value; // specify how you want to handle null values here
                const header = `"Time","Log"`;
                let csv = event.target.result.map((row:any) =>
                    `"${new Date(row.Id).toLocaleString()}","${row.Message}"`
                );
                csv.unshift(header);
                csv = csv.join('\r\n');
                
                //const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/json" });
                //const blob = new Blob([csv],{ type: 'text/csv' });
                var blob = new File([csv], filename, { type: "text/json" });
                resolve(blob);
            }

            transaction.oncomplete = function () {
                console.log("Log cleared from persistent storage");
            };

            transaction.onerror = function (e:any) {
                console.error("Error clearing the logs from persistent storage", e);
                reject(`Error clearing the logs from persistent storage. ${e.target.error?.message}`);
            };
        })
    };

    /**
     * Checks if the "share" method is availalbe. If yes, calls the shareProcedure to leverage the device's native share 
     * feature to download/share the file.
     * If the "shrae" method is not available (e.g. on desktop/laptop), then normal download is initiated.
     * @param controller 
     * @returns 
     */
    downloadLogsCSV(controller:RootViewModel):Promise<void>{
        return new Promise<void>((resolve, reject) => {
            if(!controller || !controller.openData) {
                reject("An instance of Controller implementing OFSPlugin with openData is required");
                return;
            }
            this.getLogsAsCSV().then((blob:Blob)=>{
                if(controller.openData && controller.openData().allowedProcedures.share){
                // if (this._isShareEnabled) {
                    let message = {
                        "apiVersion": 1,
                        "procedure": "share",
                        "callId": Date.now(),
                        "params": {
                            "title": "Logs",
                            "fileObject": blob
                        }
                    }
                    console.debug("sending Share Message",message);
                    controller.callProcedure(message).then((data)=>{
                        resolve();
                    }).catch((e:any) => {
                        reject(e);
                    })
                }
                else {
                    const link = document.createElement("a");

                    link.download = `${controller.tag}_Logs.csv`;
                    link.href = window.URL.createObjectURL(blob);
                    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

                    const evt = new MouseEvent("click", {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                    });

                    link.dispatchEvent(evt);
                    link.remove();
                    resolve();
                }
            })
        })
    }
}

export default PluginLogger;