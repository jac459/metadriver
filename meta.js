//"use strict";
const path = require('path');
const settings = require(path.join(__dirname,'settings'));
const neeoapi = require("neeo-sdk");
const metacontrol = require(path.join(__dirname,'metaController'));
const cacheManager = require(path.join(__dirname,'cacheManager'));
const CacheEntryTemp = "TEMP";
const CacheEntryCompleted = "COMPLETED";
const CacheEntryNotFound = '';

//Discovery tools
const dnssd = require('dnssd2');
const find = require('local-devices');

const fs = require('fs');
var activatedModule = path.join(__dirname,'activated');
if (settings.drivers[0].variables.ActivatedLib) {activatedModule = settings.drivers[0].variables.ActivatedLib;}
const BUTTONHIDE = '__';
const DATASTOREEXTENSION = 'DataStore.json';
const DEFAULT = 'default'; //NEEO SDK deviceId default value for devices
const mqtt = require('mqtt');
const { metaMessage, OverrideLoglevel, LOG_TYPE, initialiseLogComponents, initialiseLogSeverity } = require("./metaMessage");

config = {brainip : '', brainport : ''};
function returnBrainIp() { return config.brainip;}
var brainDiscovered = false;
var brainConsoleGivenIP = undefined;
var driverTable = [];
var localDevices = [];
var localByMacDevices = [];
exports.localDevices = localDevices;
exports.localByMacDevices = localByMacDevices;
exports.neeoBrainIp = returnBrainIp;
var mqttClient;
var DoingDiscoveryMySelf=false;
const DelayTime = 250;
var neeoSettings;
var doingARestart=false;//used for a local restart of the .meta into neeo.
//LOGGING SETUP AND WRAPPING
//Disable the NEEO library console warning.
console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
function metaLog(message) {
  let initMessage = { component:'meta', type:LOG_TYPE.INFO, content:'', deviceId: null };
  let myMessage = {...initMessage, ...message}
  return metaMessage (myMessage);
} 


function getConfig() {
  return new Promise(function (resolve, reject) {
    fs.readFile(__dirname + '/config.js', (err, data) => {
      if (err) { 
        metaLog({type:LOG_TYPE.ERROR, content:'No config file, the initial setup will be launched'});
        resolve(null);
        }
      else {
        if (data && (data != '')) {
          config = JSON.parse(data);
          resolve(config);
        }
        else {
          resolve (config);}
      }
    }) 
  })
}
        
function getHelper (HelpTable, prop, deviceId) {
  return HelpTable[HelpTable.findIndex((item) => { return (item.name==prop && item.deviceId==deviceId) })];
}

function getHelper (HelpTable, prop, deviceId) {
  return HelpTable[HelpTable.findIndex((item) => { return (item.name==prop && item.deviceId==deviceId) })];
}

function getIndividualActivatedDrivers(files, driverList, driverIterator) {
  return new Promise(function (resolve, reject) {
    if (files) {
      if (driverIterator < files.length) {
        if (!files[driverIterator].endsWith(DATASTOREEXTENSION)){ //To separate from datastore
          metaLog({content:'Activating drivers: ' + files[driverIterator]});
          fs.readFile(path.join(activatedModule,files[driverIterator]), (err, data) => {
            if (data) {
              try {
                const driver = JSON.parse(data);
                driver.filename = files[driverIterator];
                if (driver.template) { //persisted variables management
                  driver.template.filename = files[driverIterator];
                }
                driverList.push(driver);
              }
              catch (err) {
                metaLog({type:LOG_TYPE.ERROR, content:' Parsing driver : ' + files[driverIterator]});
                metaLog({type:LOG_TYPE.ERROR, content:err});
              }
            }
            if (err) {
              metaLog({type:LOG_TYPE.ERROR, content:' Loading the driver file : ' + files[driverIterator]});
              metaLog({type:LOG_TYPE.ERROR, content:err});
          }
            resolve(getIndividualActivatedDrivers(files, driverList, driverIterator+1));
          })
        }
        else {resolve(getIndividualActivatedDrivers(files, driverList, driverIterator+1));}
      } 
      else { 
        resolve(driverList)
       }
    }
    else {resolve([])
    }
  })
}

function getActivatedDrivers() {
  return new Promise(function (resolve, reject) {
    metaLog({type:LOG_TYPE.VERBOSE, content:'Searching drivers in : ' + activatedModule});
    fs.readdir(activatedModule, (err, files) => {
      metaLog({content:'drivers found'});
      var driverList = [];
      getIndividualActivatedDrivers(files, driverList,0).then((list) => {
        resolve(list);
      })
    })
  })
}

function getDataStorePath(filename) {
  try {
    if (filename) {
      return path.join(activatedModule, filename.split('.json')[0] + '-DataStore.json');
    }
    else {return null;}
  }
  catch (err) {
    metaLog({type:LOG_TYPE.ERROR, content:'your path (' + filename + ') given seems to be wrong :'});
    metaLog({type:LOG_TYPE.ERROR, content:err});
  }
}

function createDevices () {
  return new Promise(function (resolve, reject) {
    try { 
    getActivatedDrivers().then((drivers) => {
      drivers = drivers.concat(settings.drivers);
      const driverCreationTable = [];
      drivers.forEach((driver) => {
        driverCreationTable.push(executeDriverCreation(driver))
      })
      Promise.all(driverCreationTable).then((driverTab) => {
        driverTable = driverTab;
        resolve(driverTable);
      })
    })
  }
  catch (err) {metaLog({deviceId: deviceId, type:LOG_TYPE.ERROR, content:'Error in createDevices ' + err});}
  })

}

function discoveredDriverListBuilder(inputRawDriverList, outputPreparedDriverList, indent, controller, targetDeviceId) {
  return new Promise (function (resolve, reject) {
  try { 
    if (indent < inputRawDriverList.length) {
      if (inputRawDriverList[indent].dynamicname && inputRawDriverList[indent].dynamicname != "") {
        if (targetDeviceId == undefined || targetDeviceId == inputRawDriverList[indent].dynamicid)
        {
          executeDriverCreation(inputRawDriverList[indent], controller, inputRawDriverList[indent].dynamicid).then((builtdevice) => {
            builtdevice.addCapability("dynamicDevice");
            const discoveredDevice = {
              id:inputRawDriverList[indent].dynamicid,
              name:inputRawDriverList[indent].dynamicname,
              reachable:true,
              device : builtdevice
            }
            outputPreparedDriverList.push(discoveredDevice);

            driverTable.push(builtdevice);
            if (targetDeviceId == undefined) {//initial creation of the driver, need the full list to be returned
              resolve(discoveredDriverListBuilder(inputRawDriverList, outputPreparedDriverList, indent+1, controller, targetDeviceId));
            }
            else {//on the spot creation of a specific driver, we leave after creation.
              resolve(outputPreparedDriverList);
            }

          })
          
        }//all these else to ensure proper timely construction and not a resolve before end of creation.
        else {
          resolve(discoveredDriverListBuilder(inputRawDriverList, outputPreparedDriverList, indent+1, controller, targetDeviceId));
        }
      }
      else {
        resolve(discoveredDriverListBuilder(inputRawDriverList, outputPreparedDriverList, indent+1, controller, targetDeviceId));
        }
      }
    else 
      resolve (outputPreparedDriverList);}
    catch (err) {metaLog({deviceId: deviceId, type:LOG_TYPE.ERROR, content:'Error in discoveredDriverListBuilder ' + err});}
    
    })
}

function instanciationHelper(controller, givenResult, jsonDriver) {
  jsonDriver = JSON.stringify(jsonDriver);
  let slicedDriver = jsonDriver.split("DYNAMIK_INST_START ");
  let reconstructedDriver = slicedDriver[0];
  for (let index = 1; index < slicedDriver.length; index++) {
    //TODO Correct ugly hack suppressing the escape of quote..
    let tempoResult = slicedDriver[index].split(" DYNAMIK_INST_END")[0].replace(/\\/g, "");
    //let tempoResult = slicedDriver[index].split(" DYNAMIK_INST_END")[0];
    tempoResult = controller.vault.readVariables(tempoResult, DEFAULT);
    tempoResult = controller.assignTo("$Result", tempoResult, givenResult);
    reconstructedDriver = reconstructedDriver + tempoResult;
    reconstructedDriver = reconstructedDriver + slicedDriver[index].split(" DYNAMIK_INST_END")[1];
  }
  metaLog({type:LOG_TYPE.VERBOSE, content:'reconstructedDriver'});
  metaLog({type:LOG_TYPE.DEBUG, content:reconstructedDriver});

  return JSON.parse(controller.vault.readVariables(reconstructedDriver, DEFAULT));
}

function discoveryDriverPreparator(controller, driver, deviceId, targetDeviceId) {
  metaLog({deviceId: deviceId, type:LOG_TYPE.DEBUG, content:'DiscoveryDriverPreparator'});
  
  return new Promise(function (resolve, reject) {

            try {           

    if (driver.discover) {

      let instanciationTable = [];

      controller.initiateProcessor(driver.discover.command.type).then(() => {
        controller.commandProcessor(driver.discover.command.command, driver.discover.command.type, deviceId).then((result)=>{

          controller.queryProcessor(result, driver.discover.command.queryresult, driver.discover.command.type, deviceId).then((result) => {
            if (driver.discover.command.evalwrite) {controller.evalWrite(driver.discover.command.evalwrite, result, deviceId)};

            if (!Array.isArray(result)) {
              let tempo = [];
              tempo.push(result);
              result = tempo;
            }
            result.forEach(element => {
              driverInstance = instanciationHelper(controller, element, driver.template);
              instanciationTable.push(driverInstance);
            });
            resolve(instanciationTable)
          })
        })
      })

    }
    else 
      resolve();
  }
    catch (err) {metaLog({deviceId: deviceId, type:LOG_TYPE.ERROR, content:'Error in discoveryDriverPreparator ' + err});}
  })

}

function getRegistrationCode(controller, credentials, driver, deviceId){
  return new Promise(function (resolve, reject) {
    controller.vault.addVariable("RegistrationCode", credentials.securityCode, deviceId, true)
    registerDevice(controller, driver, deviceId).then((result)=>{
      if (result) {
        resolve(true);
      }
      else {
        resolve(false)
      }
    })
  })
}

function registerDevice(controller, driver, deviceId) {
  return new Promise(function (resolve, reject) {
    controller.actionManager(DEFAULT, driver.register.registrationcommand.type, driver.register.registrationcommand.command, driver.register.registrationcommand.queryresult, '', driver.register.registrationcommand.evalwrite)
    .then((result) => {
      metaLog({deviceId: deviceId, type:LOG_TYPE.VERBOSE, content:'Result of the registration command: '});
      metaLog({deviceId: deviceId, type:LOG_TYPE.DEBUG, content:result});

      controller.reInitVariablesValues(deviceId);
      controller.reInitConnectionsValues(deviceId);
      controller.vault.snapshotDataStore();
      if (controller.vault.getValue("IsRegistered", deviceId)) {
        metaLog({deviceId: deviceId, type:LOG_TYPE.INFO, content:"Registration success"});
        resolve(true);
      }
      else {
        metaLog({deviceId: deviceId, type:LOG_TYPE.WARNING, content:'Registration Failure'});
        resolve(false);
      }
    })
  })
}

function isDeviceRegistered(controller, driver, deviceId) {
  return new Promise(function (resolve, reject) {
    let retValue = controller.vault.getValue("IsRegistered", deviceId);
    metaLog({deviceId: deviceId, type:LOG_TYPE.VERBOSE, content:'is registered ? : ' + retValue});
    if (retValue) {resolve(retValue);}
    else {
      registerDevice(controller, driver, deviceId).then((result)=>{
        metaLog({deviceId: deviceId, type:LOG_TYPE.VERBOSE, content:'the result of the registration process is '+result});
        if (result) {
          resolve(true);
        }
        else {
          resolve(false)
        }
      })
    }
  })
}

function createController(hubController, driver) {//Discovery specific
  if (hubController) {//We are inside a discovered item no new controller to be created.
    return hubController;
  }
  else {//normal device, controller to be created.
    const controller = new metacontrol(driver);
    return controller;
  }
}

function assignControllers(controller, driver, currentDeviceId) {
  for (var prop in driver.buttons) { // Dynamic creation of all buttons
    if (Object.prototype.hasOwnProperty.call(driver.buttons, prop)) {
      controller.addButton(currentDeviceId, prop, driver.buttons[prop])
    }
  } 

  for (var prop in driver.images) { // Dynamic creation of all images
    if (Object.prototype.hasOwnProperty.call(driver.images, prop)) {
      controller.addImageHelper(currentDeviceId, prop, driver.images[prop].listen)
    }
  }

  for (var prop in driver.labels) { // Dynamic creation of all labels
    if (Object.prototype.hasOwnProperty.call(driver.labels, prop)) {
      controller.addLabelHelper(currentDeviceId, prop, driver.labels[prop].listen, driver.labels[prop].actionlisten)
    }
  }

  for (var prop in driver.sensors) { // Dynamic creation of all sensors
    if (Object.prototype.hasOwnProperty.call(driver.sensors, prop)) {
      controller.addSensorHelper(currentDeviceId, prop, driver.sensors[prop].listen)
    }
  }

  for (var prop in driver.switches) { // Dynamic creation of all sliders
    if (Object.prototype.hasOwnProperty.call(driver.switches, prop)) {
      controller.addSwitchHelper(currentDeviceId, prop, driver.switches[prop].listen, driver.switches[prop].evaldo);
    }
  }

  for (var prop in driver.sliders) { // Dynamic creation of all sliders
    if (Object.prototype.hasOwnProperty.call(driver.sliders, prop)) {
      controller.addSliderHelper(currentDeviceId, driver.sliders[prop].listen, driver.sliders[prop].evaldo, prop);
    }
  }

  for (var prop in driver.directories) { // Dynamic creation of directories
    if (Object.prototype.hasOwnProperty.call(driver.directories, prop)) {
      const theHelper = controller.addDirectoryHelper(currentDeviceId, prop);
      for (var feed in driver.directories[prop].feeders) {
        let feedConfig = {"name":feed, 
                          "label":driver.directories[prop].feeders[feed].label, 
                          "commandset":driver.directories[prop].feeders[feed].commandset, 
                        };
        theHelper.addFeederHelper(feedConfig);
      }
    }
  }

}

function KeepTaskInWaitTillCacheCompleted(loopCount,targetDeviceId,CachedDiscovery) {

  if (loopCount--) {
    if (loopCount%4==0)
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.WARNING, content:"Discovery waiting time left max " + (loopCount/4).toString() + " sec" });
    setTimeout(() => {
      CachedDiscovery = cacheManager.ValidateDiscoveryCache(targetDeviceId);
      if (CachedDiscovery.state==CacheEntryCompleted )  {
        metaLog({deviceId: targetDeviceId, type:LOG_TYPE.WARNING, content:"Waitloop: Discovery got completed cache, resuming " + targetDeviceId});
        return CachedDiscovery;}
      else 
        KeepTaskInWaitTillCacheCompleted(loopCount,targetDeviceId,CachedDiscovery)   
    }, DelayTime);
  }
  else 
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ERROR, content:"Parallel discovery waiting time exceeded , releasing now" });
}


function executeDriverCreation (driver, hubController, deviceId) { 
  var targetDeviceId;
    return new Promise(function (resolve, reject) {
    //driverTable.length = 0; //Reset the table without cleaning the previous reference (to avoid destructing other devices when running Discovery).
      let currentDeviceId = deviceId ? deviceId : DEFAULT; //to add the deviceId of the real discovered device in the Helpers

      let controller = createController(hubController, driver);

      //TODO check if this is still usefull
      //if (hubController) {controller.assignDiscoverHubController(hubController)}; //if the device is a discovered device.
      const theDevice = neeoapi.buildDevice(".meta " + driver.name) 
        .setType(driver.type) 
        .setDriverVersion(driver.version)
        .setManufacturer(driver.manufacturer)
        if (driver.icon) {
            theDevice.setIcon(driver.icon)
        }
        if (driver.alwayson) {
           theDevice.addCapability("alwaysOn");
        }
        
       //CREATING VARIABLES
       for (var prop in driver.variables) { // Initialisation of the variables
        if (Object.prototype.hasOwnProperty.call(driver.variables, prop)) {
          controller.vault.addVariable(prop, driver.variables[prop], currentDeviceId)
        }
      }

      if (driver.persistedvariables){
        for (var prop in driver.persistedvariables) { // Initialisation of the variables to be persisted
          if (Object.prototype.hasOwnProperty.call(driver.persistedvariables, prop)) {
            controller.vault.addVariable(prop, driver.persistedvariables[prop], currentDeviceId, true);
          }
        }
      }

      controller.vault.initialiseVault(getDataStorePath(driver.filename)).then(() => {//Retrieve the value form the vault

      //CREATING CONTROLLERS
      assignControllers(controller, driver, currentDeviceId);


      //GET ALL CONNECTIONS
      controller.addConnection({"name":"webSocket", "connections":[]})
      controller.addConnection({"name":"netSocket", "connections":[]})
      controller.addConnection({"name":"jsontcp", "descriptor":driver.jsontcp, "connector":""})
      if (settings.mqtt) {
        metaLog({deviceId: deviceId, type:LOG_TYPE.INFO, content:'Creating the connection MQTT'});
        controller.addConnection({"name":"mqtt", "descriptor":settings.mqtt, "connector":mqttClient})//early loading

        //controller.initiateProcessor('mqtt');
      }
      if (driver.repl) {
        controller.addConnection({"name":"repl", "descriptor":driver.repl, "connector":""})
      }
    
      //PreInit
      controller.onButtonPressed("__PREINIT",currentDeviceId).then(() => {
        //Registration
        if (driver.register) {
          theDevice.enableRegistration(
          {
            type: 'SECURITY_CODE',
            headerText: driver.register.registerheadertext,
            description: driver.register.registerdescription,
          },
          {
            register: (credentials) => getRegistrationCode(controller, credentials, driver, currentDeviceId),
            isRegistered: () => {return new Promise(function (resolve, reject) {isDeviceRegistered(controller, driver, currentDeviceId).then((res)=>{resolve(res)})})},
          })
        }


        //DISCOVERY  
        if (driver.discover) {
          DoingDiscoveryMySelf = true;
          theDevice.enableDiscovery(
            {
              headerText: driver.discover.welcomeheadertext,
              description: driver.discover.welcomedescription,
              enableDynamicDeviceBuilder: true,
            },
            (targetDeviceId) => {
              metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:"Discovery: NEEO requested for: " + targetDeviceId + " " + driver.name });
              if (targetDeviceId == undefined)  { //Original code
                metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:"Discovery: result# Bypassing cache (undefined targetid): " + driver.name });
                return new Promise(function (resolve, reject) {
                discoveryDriverPreparator(controller, driver, currentDeviceId, targetDeviceId).then((driverList) => {
                  const formatedTable = [];
                  discoveredDriverListBuilder(driverList, formatedTable, 0, controller, targetDeviceId).then((outputTable) => {
                    resolve(outputTable); 
                  })
                })
              })
              }
              else
               return new Promise(function (resolve, reject) {
                var CachedDiscovery;                
                CachedDiscovery = cacheManager.ValidateDiscoveryCache(targetDeviceId);
                  if (CachedDiscovery == CacheEntryNotFound) { // First time an existing device is discovered again
                    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.VERBOSE, content:"Discovery: Init#Starting actual discovery for: " + targetDeviceId + " " + driver.name });
                    cacheManager.AddDiscoveryCache(targetDeviceId,"Discovery started",CacheEntryTemp);
                    return new Promise(function (resolve, reject) {
                      discoveryDriverPreparator(controller, driver, currentDeviceId, targetDeviceId).then((driverList) => {
                        const formatedTable = [];
                        discoveredDriverListBuilder(driverList, formatedTable, 0, controller, targetDeviceId).then((outputTable) => {
                          cacheManager.AddDiscoveryCache(targetDeviceId,outputTable,CacheEntryCompleted);
                          metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:"Discovery: result#Adding final cache-entry " + targetDeviceId + " " + driver.name  });
                          metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:outputTable });
                          resolve(outputTable);
                        })
                      })
                    })
                  }
                  else 
                    if (CachedDiscovery.state==CacheEntryCompleted) {// next time an existing device is discovered again, it was already resolved the first time
                        metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:"Discovery: result#Cache direct-return for: " + targetDeviceId + " " + driver.name });
                        resolve(CachedDiscovery.outputTable);
                      }
                    else {// next time an existing device is discovered again, it has not yet been resolved for the first time
                      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:"Discovery: init#Parking: " + targetDeviceId + " " + driver.name });
                      DoParkedDiscovery(targetDeviceId,driver,currentDeviceId,controller).then((myResult) => {
                        CachedDiscovery = cacheManager.ValidateDiscoveryCache(targetDeviceId);
                        resolve(CachedDiscovery.outputTable);
                      })
                    }
                
              })
            })
          }

        controller.reInitConnectionsValues(currentDeviceId);
        
        //CREATING LISTENERS
        for (var prop in driver.listeners) { // Initialisation of the variables
          if (Object.prototype.hasOwnProperty.call(driver.listeners, prop)) {
              controller.addListener({
                name : prop, 
                deviceId: currentDeviceId,
                type : driver.listeners[prop].type,
                command : driver.listeners[prop].command,
                timer : "", //prepare the the listener to save the timer here.
                pooltime : driver.listeners[prop].pooltime,
                poolduration : driver.listeners[prop].poolduration,
                queryresult : driver.listeners[prop].queryresult,
                evalwrite : driver.listeners[prop].evalwrite,
                evaldo : driver.listeners[prop].evaldo
              })
          }
        }
        
          //CREATING INDIVIDUAL SHORTCUTS

          for (var prop in driver.buttons) { // Dynamic creation of all buttons
            if (Object.prototype.hasOwnProperty.call(driver.buttons, prop)) {
              if (theDevice.buttons.findIndex((item) => {return (item.param.name == prop)})<0) {//not button of same name (in case included in a widget)
                if (!prop.startsWith(BUTTONHIDE)){ //If the button doesnt need to be hidden.
                  theDevice.addButton({name: prop, label: (driver.buttons[prop].label == '') ? (prop) : (driver.buttons[prop].label)})
                }
              }
            }
          }
  
          for (var prop in driver.images) { // Dynamic creation of all images
            if (Object.prototype.hasOwnProperty.call(driver.images, prop)) {
              if (theDevice.imageUrls.findIndex((item) => {return (item.param.name == prop)})<0) {//not image of same name (in case included in a widget)
                const helperI = getHelper(controller.imageH, prop, currentDeviceId);
                theDevice.addImageUrl({name: prop, label: (driver.images[prop].label == '') ? (prop) : (driver.images[prop].label),
                      size : driver.images[prop].size},
                (deviceId) => helperI.get(deviceId))
              }
            }
          }

          for (var prop in driver.labels) { // Dynamic creation of all labels
            if (Object.prototype.hasOwnProperty.call(driver.labels, prop)) {
              if (theDevice.textLabels.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
                const helperL = getHelper(controller.labelH, prop, currentDeviceId);
                theDevice.addTextLabel({name: prop, label: (driver.labels[prop].label == '') ? (prop) : (driver.labels[prop].label)},
                helperL.get);
              }
            }
          }

          for (var prop in driver.sensors) { // Dynamic creation of all sensors
            if (Object.prototype.hasOwnProperty.call(driver.sensors, prop)) {
              if (theDevice.sensors.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
                const helperSe = getHelper(controller.sensorH, prop, currentDeviceId);
                theDevice.addSensor({name: prop, label: (driver.sensors[prop].label == '') ? (prop) : (driver.sensors[prop].label),
                type:driver.sensors[prop].type},
                {
                  getter: helperSe.get
                });
              }
            }
          }

          for (var prop in driver.switches) { // Dynamic creation of all sliders
            if (Object.prototype.hasOwnProperty.call(driver.switches, prop)) {
              if (theDevice.switches.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
              const helperSw = getHelper(controller.switchH, prop, currentDeviceId);
              theDevice.addSwitch({
                name: prop, 
                label: (driver.switches[prop].label == '') ? (prop) : (driver.switches[prop].label),
              },
              {
                setter: helperSw.set, getter: helperSw.get
              })
            }
          }
        }

          for (var prop in driver.sliders) { // Dynamic creation of all sliders
            if (Object.prototype.hasOwnProperty.call(driver.sliders, prop)) {
              if (theDevice.sliders.findIndex((item) => {return (item.param.name == prop)})<0) {//not slider of same name (in case included in a widget)
                const helperS = getHelper(controller.sliderH, prop, currentDeviceId);
                theDevice.addSlider({
                  name: prop, 
                  label: (driver.sliders[prop].label == '') ? (prop) : (driver.sliders[prop].label),
                  range: [0,100], unit: driver.sliders[prop].unit 
                },
                {
                  setter: helperS.set, getter: helperS.get
                })
              }
            }
          }

          for (var prop in driver.directories) { // Dynamic creation of directories
            if (Object.prototype.hasOwnProperty.call(driver.directories, prop)) {
              if (theDevice.directories.findIndex((item) => {return (item.param.name == prop)})<0) {//not directory of same name (in case included in a widget)
                const helperD = getHelper(controller.directoryH, prop, currentDeviceId);
                theDevice.addDirectory({
                  name: prop, 
                  label: (driver.directories[prop].label == '') ? (prop) : (driver.directories[prop].label),
                }, helperD.browse)
              }
            }
          }

          theDevice.addButtonHandler((name, deviceId) => controller.onButtonPressed(name, deviceId))
          theDevice.registerSubscriptionFunction((updateCallback) => {controller.sendComponentUpdate = updateCallback});
          theDevice.registerInitialiseFunction(() => {controller.registerInitiationCallback(currentDeviceId)});
          theDevice.registerDeviceSubscriptionHandler(
            {
              deviceAdded: (deviceId) => {
                  metaLog({deviceId: deviceId, type:LOG_TYPE.VERBOSE, content:'device added'});
                  controller.dynamicallyAssignSubscription(deviceId,false);
              },
              deviceRemoved: (deviceId) => {
                metaLog({deviceId: deviceId, type:LOG_TYPE.VERBOSE, content:'device removed'});
              },
              initializeDeviceList: (deviceIds) => {
                metaLog({deviceId: deviceId, type:LOG_TYPE.VERBOSE, content:"INITIALIZED DEVICES:" + deviceIds});
              },
            } 
          )
          metaLog({deviceId: deviceId, type:LOG_TYPE.INFO, content:"Device " + driver.name + " has been created."});
          MetaMQTTHandler(controller, currentDeviceId);
          resolve(theDevice);
        });
      })
  })
}

async function DoParkedDiscovery(targetDeviceId,driver,currentDeviceId,controller) 
 {var CachedDiscovery;
  metaLog({deviceId: targetDeviceId, type:LOG_TYPE.VERBOSE, content:'Discovery: init#Parking handler ' + targetDeviceId + " " + driver.name});
	let myCount = 0;
    let promise =   new Promise(function (resolve, reject) {                                            

                function CheckCacheState(){
                    try {
                        continueCheckingForCompletion();
                    }
                    catch (err)   {metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ERROR, content:"Error in DoParkedDiscovery"})
                                  metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ERROR, content:err})}
                }

                function continueCheckingForCompletion(){
                  CachedDiscovery = cacheManager.ValidateDiscoveryCache(targetDeviceId);
                  if (CachedDiscovery.state==CacheEntryCompleted)                 // Is Blocking request done
                    resolve(CachedDiscovery);
                  else
                    if(++myCount <40){
                        setTimeout(CheckCacheState,DelayTime);
                    }
                    else{
                        resolve('');
                    }
                }

                continueCheckingForCompletion();
            });

    let result = await promise  
    if (result=="") {
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:'Discovery: result#Parking time ran out, doing discovery ' + targetDeviceId + " " + driver.name});
      return new Promise(function (resolve, reject) {
        discoveryDriverPreparator(controller, driver, currentDeviceId, targetDeviceId).then((driverList) => {
          const formatedTable = [];
          discoveredDriverListBuilder(driverList, formatedTable, 0, controller, targetDeviceId).then((outputTable) => {
            cacheManager.AddDiscoveryCache(targetDeviceId,outputTable,CacheEntryCompleted);
            metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:'Discovery: result#' + targetDeviceId + " " + driver.name});
            return(outputTable); 
          })
        })
      })
    }
    else {
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:'Discovery: init#Released parked  ' + targetDeviceId + " " + driver.name});
      return(CachedDiscovery.outputTable);
    }
        
}


//DISCOVERING BRAIN
        
function discoverBrain() {
  return new Promise(function (resolve, reject) {
    metaLog({type:LOG_TYPE.INFO, content:"Trying to discover a NEEO Brain..."});
 
    brainDiscovered = true;
    neeoapi.discoverOneBrain()
      .then((brain) => {
        metaLog({type:LOG_TYPE.INFO, content:"Brain Discovered at IP : " + brain.iparray.toString()});
        config.brainip = brain.iparray.toString();
         resolve();
      })
      .catch ((err) => {
        metaLog({type:LOG_TYPE.FATAL, content:"Brain couldn't be discovered, check if it is on and on the same wifi network: " + err});
        reject();
      })
    })
}

function setupNeeo(forceDiscovery) {
  return new Promise(function (resolve, reject) {
    if (forceDiscovery) {
      discoverBrain().then(() => {
        runNeeo();
      })
    }
    else if (brainConsoleGivenIP)  { 
      config.brainip = brainConsoleGivenIP;
      metaLog({type:LOG_TYPE.INFO, content:"Using brain-IP from CommandLine: " + brainConsoleGivenIP});
      runNeeo();
    }
   else
    if (config.brainip == ''){
        discoverBrain().then(() => {
          runNeeo();
        })
    }
    else {
      runNeeo();
    }
    resolve();
  })
}

function runNeeo () {
  return new Promise(function (resolve, reject) {
    if (!config.brainport) {config.brainport = 4015}
    neeoSettings = {
      brain: config.brainip.toString(),
      port: config.brainport.toString(),
      name: "metadriver",
      devices: driverTable
    };


    metaLog({type:LOG_TYPE.INFO, content:"Current directory: " + __dirname});
    metaLog({type:LOG_TYPE.INFO, content:"Trying to start the meta."});
    doingARestart=false;
    neeoapi.startServer(neeoSettings)
      .then((result) => {
        metaLog({type:LOG_TYPE.ALWAYS, content:"Driver running, you can search it on the neeo app."});
        metaLog({type:LOG_TYPE.INFO, content:result});
        if (brainDiscovered) {
            fs.writeFile(__dirname + '/config.js', JSON.stringify(config), err => {
              if (err) {
                metaLog({type:LOG_TYPE.ERROR, content:"Error writing the config file. " + err});
                 } else {
                  metaLog({type:LOG_TYPE.INFO, content:"Initial configuration saved"});
                }
              resolve();
            })
          }
        })

      .catch(err => {
           metaLog({type:LOG_TYPE.ERROR, content:'Failed running Neeo with error: ' + err});
           process.exit(1);
      });
    })

}
    

function MetaMQTTHandler (cont, deviceId) {
  mqttClient.subscribe(settings.mqtt_topic + cont.name + "/#", () => {});  //mqttClient.subscribe( "meta/#", () => {});

  mqttClient.on('message', function (topic, value) {
      try { 
        if (topic == "meta/.meta/Reload"&&value=="meta") {
          if (!doingARestart) {                   // We can be triggered multiple times, 
            doingARestart=true;                   // make sure we rest only once.
            metaLog({type:LOG_TYPE.ALWAYS, content:'Requesting neeo to remove Custom drivers'});
            neeoapi.stopServer(neeoSettings)
            .then((result) => {
              metaLog({type:LOG_TYPE.ALWAYS, content:"Neeo reports successful removal"});
              metaLog({type:LOG_TYPE.ALWAYS, content:"Now forcing restart of meta by closing MQTT-connection"});
              mqttClient.end();
              cacheManager.EraseCacheCompletely();         // clear cache so we start fresh
              metaLog({type:LOG_TYPE.ALWAYS, content:"And reconnecting it will start .meta too"});
              mqttClient.reconnect();
            })
            .catch(err => {
                metaLog({type:LOG_TYPE.ERROR, content:'Neeo reported this result for stopserver: ' + err});
                process.exit(1);
            });
          }
        }
        else 
        if (topic == "meta/.meta/LOGLEVEL") 
          OverrideLoglevel(value);
        else {
          let theTopic = topic.split("/");
          if (theTopic.length == 6 && theTopic[5] == "set") {

            if (theTopic[3] == "button") {
              cont.onButtonPressed(theTopic[4], theTopic[2]);
            }
            else if (theTopic[3] == "slider") {
              let sliI = cont.sliderH.findIndex((sli)=>{return sli.name == theTopic[4]});
              if (sliI>=0){
                cont.sliderH[sliI].set(theTopic[2], value)
              }   
            }
            else if (theTopic[3] == "switch") {
              let sliI = cont.switchH.findIndex((sli)=>{return sli.name == theTopic[4]});
              if (sliI>=0){
                cont.switchH[sliI].set(theTopic[2], value)
              }   
            }
            else if (theTopic[3] == "image") {
              let imaI = cont.imageH.findIndex((ima)=>{return ima.name == theTopic[4]});
              if (imaI>=0){
                cont.imageH[imaI].set(theTopic[2], value)
              }   
            }
            else if (theTopic[3] == "label") {
              let labI = cont.labelH.findIndex((lab)=>{return lab.name == theTopic[4]});
              if (labI>=0){
                cont.labelH[labI].set(theTopic[2], value)
              }   
            }
          }
        }
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:'Parsing incomming message on: '+settings.mqtt_topic + cont.name + "/command"});
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
  })
}
//MAIN
process.chdir(__dirname);
metaLog({type:LOG_TYPE.ALWAYS, content:'.Meta starting'});

//Unleaching discovery
//Mac addresses.
find().then(devices => {
  localByMacDevices = devices;
  metaLog({type:LOG_TYPE.DEBUG, content:'MAC discovery found: '});
  metaLog({type:LOG_TYPE.DEBUG, content:localByMacDevices});

});

//mDNS
const browser = dnssd.Browser(dnssd.all(),{resolve:true});
browser.on('serviceUp', (service) => {
  metaLog({type:LOG_TYPE.DEBUG, content:'mDNS discovery found: ' + service.name});
  let tempBro = undefined;
  try {
     tempBro = dnssd.Browser(dnssd.tcp(service.name));
  } catch (err) {
    metaLog({type:LOG_TYPE.ERROR, content:'Error during mDNS discovery - ' + service.name});
    metaLog({type:LOG_TYPE.ERROR, content:err});
  }
  if (tempBro) {
    tempBro.on('serviceUp', (service) => {
      metaLog({type:LOG_TYPE.DEBUG, content:'mDNS discovery Service Up: ' + service.fullname});
      if (0 > localDevices.findIndex((ld)=>{
                return (ld.name == service.name && ld.fullname == service.fullname && ld.type == service.type && ld.domain == service.domain && ld.host == service.host)
              })) 
      {
        localDevices.push({name:service.name, fullname:service.fullname, type:service.type, domain:service.domain, host:service.host, port:service.port, addresses:service.addresses })
      }
    });
    tempBro.on('serviceDown', (service) => {
      metaLog({type:LOG_TYPE.DEBUG, content:'mDNS discovery Service Down: ' + service.fullname});
    });
    tempBro.start();
  }
});

//mDNS DISCOVERY PART
browser.start();
setTimeout(() => {
  browser.stop();
  metaLog({type:LOG_TYPE.VERBOSE, content:'mDNS discovery stopped'});
  metaLog({type:LOG_TYPE.DEBUG, content:localDevices});
}, 100000);

if (process.argv.length>2) {
  try {
    if (process.argv[2]) {
      let arguments = JSON.parse(process.argv[2]);
      if (arguments.Brain) {
        brainConsoleGivenIP = arguments.Brain;
      }
      if (arguments.LogSeverity) {
        initialiseLogSeverity(arguments.LogSeverity);
      }
      if (arguments.Components) {
        initialiseLogComponents(arguments.Components);
      }
    }
    else {
      metaLog({type:LOG_TYPE.FATAL, content:'Wrong arguments: ' + process.argv[2] + (process.argv.length>3? ' ' + process.argv[3]: '') + ' You can try for example node meta \'{"Brain":"192.168.1.144","LogSeverity":"INFO","Components":["meta"]}\', Or example: node meta \'{"Brain":"localhost","LogSeverity":"VERBOSE","Components":["metaController", "variablesVault"]}\', all items are optionals, LogSeverity can be VERBOSE, INFO, WARNING or QUIET, components can be meta, metaController, variablesVault, processingManager, sensorHelper, sliderHeper, switchHelper, imageHelper or directoryHelper if you want to focus the logs on a specific function. If components is empty, all modules are shown.'});
      process.exit();
    }
  }
  catch (err)
  {
    metaLog({type:LOG_TYPE.FATAL, content:'Wrong arguments: ' + process.argv[2] + (process.argv.length>3? ' ' + process.argv[3]: '') + ' You can try for example node meta \'{"Brain":"192.168.1.144","LogSeverity":"INFO","Components":["meta"]}\', Or example: node meta \'{"Brain":"localhost","LogSeverity":"VERBOSE","Components":["metaController", "variablesVault"]}\', all items are optionals, LogSeverity can be VERBOSE, INFO, WARNING or QUIET, components can be meta, metaController, variablesVault, processingManager, sensorHelper, sliderHeper, switchHelper, imageHelper or directoryHelper if you want to focus the logs on a specific function. If components is empty, all modules are shown.'});
    metaLog({type:LOG_TYPE.FATAL, content:err});
    process.exit();
  }
}
getConfig().then(() => {
  metaLog({type:LOG_TYPE.VERBOSE, content:'Connecting to MQTT: ' + JSON.stringify(settings.mqtt)});
  mqttClient = mqtt.connect('mqtt://' + settings.mqtt, {clientId:"meta"}); // Always connect to the local mqtt broker
  mqttClient.setMaxListeners(0); //CAREFULL OF MEMORY LEAKS HERE.
  mqttClient.on('error', (result) => {
    metaLog({type:LOG_TYPE.ERROR, content:'Error connecting to MQTT: '+ result});
    });
  
  mqttClient.on('connect', (result) => {
    createDevices()
      .then (() => {
        setupNeeo().then(() => {
      })
    });
  });

  mqttClient.on('end', (result) => {
    metaLog({type:LOG_TYPE.ERROR, content:'MQTT-connection ended, restarting .meta locally'});
    });
});