//"use strict";
const path = require('path');
const settings = require(path.join(__dirname,'settings'));
const neeoapi = require("neeo-sdk");
const metacontrol = require(path.join(__dirname,'metaController'));
const find = require('local-devices');

const fs = require('fs');
const activatedModule = path.join(__dirname,'activated');
const BUTTONHIDE = '__';
const DATASTOREEXTENSION = 'DataStore.json';
const DEFAULT = 'default'; //NEEO SDK deviceId default value
const MQTT = 'mqtt';
const mqtt = require('mqtt');

var config = {brainip : '', brainport : ''};
var brainDiscovered = false;
var brainDiscovered = false;
var driverTable = [];
var discoveredDevices = undefined;
var mqttClient;
//const mqttClient = mqtt.connect('mqtt://' + settings.mqtt, {clientId:"meta"}); // Always connect to the local mqtt broker
//mqttClient.on('connect', (result) => {
//  console.log("mqtt connected");
//})

function getConfig() {
  return new Promise(function (resolve, reject) {
    fs.readFile(__dirname + '/config.js', (err, data) => {
      if (err) {console.log('No config file, the initial setup will be launched');resolve(null);}
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

function getIndividualActivatedDrivers(files, driverList, driverIterator) {
  return new Promise(function (resolve, reject) {
    if (driverIterator < files.length) {
      if (!files[driverIterator].endsWith(DATASTOREEXTENSION)){ //To separate from datastore
        console.log('Activating drivers :' + files[driverIterator])
        fs.readFile(path.join(activatedModule,files[driverIterator]), (err, data) => {
          if (data) {
            try {
              const driver = JSON.parse(data);
              driver.filename = files[driverIterator];
              driverList.push(driver);
            }
            catch (err) {
              console.log('Error while parsing driver : ' + files[driverIterator]);
              console.log(err);
            }
          }
          if (err) {
            console.log('Error while loading the driver file : ' + files[driverIterator]);
            console.log(err);        
          }
          resolve(getIndividualActivatedDrivers(files, driverList, driverIterator+1));
        })
      }
      else {resolve(getIndividualActivatedDrivers(files, driverList, driverIterator+1));}
    } 
    else { 
      resolve(driverList) }
  })
}

function getActivatedDrivers() {
  return new Promise(function (resolve, reject) {
    console.log("Searching drivers in : " + activatedModule);
    fs.readdir(activatedModule, (err, files) => {
      console.log('drivers found');
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
    console.log('META error, your path (' + filename + ') given seems to be wrong :');
    console.log(err);
  }
}

function createDevices () {
  return new Promise(function (resolve, reject) {
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
  })
}

function discoveredDriverListBuilder(inputRawDriverList, outputPreparedDriverList, indent, controller, targetDeviceId) {
  return new Promise (function (resolve, reject) {
    if (indent < inputRawDriverList.length) {
      if (inputRawDriverList[indent].dynamicname && inputRawDriverList[indent].dynamicname != "") {
        if (targetDeviceId == undefined || targetDeviceId == inputRawDriverList[indent].dynamicid)
        //console.log("On a table of " + inputRawDriverList.length + " discovered devices observation:" + inputRawDriverList[indent].dynamicid + " and target is : " + targetDeviceId)
        //if (targetDeviceId == inputRawDriverList[indent].dynamicid)
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
    else {resolve (outputPreparedDriverList);}
  })
}

function instanciationHelper(controller, givenResult, jsonDriver) {
  jsonDriver = JSON.stringify(jsonDriver);
  let slicedDriver = jsonDriver.split("DYNAMIK_INST_START ");
  let recontructedDriver = slicedDriver[0];
  for (let index = 1; index < slicedDriver.length; index++) {
    //TODO Correct ugly hack suppressing the escape of quote..
    let tempoResult = slicedDriver[index].split(" DYNAMIK_INST_END")[0].replace(/\\/g, "");
    //let tempoResult = slicedDriver[index].split(" DYNAMIK_INST_END")[0];
    tempoResult = controller.vault.readVariables(tempoResult, DEFAULT);
    tempoResult = controller.assignTo("$Result", tempoResult, givenResult);
    recontructedDriver = recontructedDriver + tempoResult;
    recontructedDriver = recontructedDriver + slicedDriver[index].split(" DYNAMIK_INST_END")[1];
  }
  // reconstructedDriver = controller.vault.readVariables(recontructedDriver, DEFAULT);
  // console.log(recontructedDriver);
  return JSON.parse(controller.vault.readVariables(recontructedDriver, DEFAULT));
}

function discoveryDriverPreparator(controller, driver, deviceId, targetDeviceId) {
  return new Promise(function (resolve, reject) {
                      
    if (driver.discover) {
      let instanciationTable = [];
      controller.initiateProcessor(driver.discover.command.type).then(() => {
        controller.commandProcessor(driver.discover.command.command, driver.discover.command.type, deviceId).then((result)=>{
            controller.queryProcessor(result, driver.discover.command.queryresult, driver.discover.command.type, deviceId).then((result) => {
            if (driver.discover.command.evalwrite) {controller.evalWrite(driver.discover.command.evalwrite, result, deviceId)};
            console.log(result)
            if (!Array.isArray(result)) {
              let tempo = [];
              tempo.push(result);
              result = tempo;
            }
            console.log(result)
            result.forEach(element => {
              driverInstance = instanciationHelper(controller, element, driver.template);
              instanciationTable.push(driverInstance);
            });
            resolve(instanciationTable)
          })
        })
      })
    }
    else {
      resolve();
    }
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
    controller.actionManager(DEFAULT, driver.register.registrationcommand.type, driver.register.registrationcommand.command, 
                          driver.register.registrationcommand.queryresult, '', driver.register.registrationcommand.evalwrite)
    .then((result) => {
      console.log('Result of the registration command: ')
      console.log(result)
      controller.reInitVariablesValues(deviceId);
      controller.reInitConnectionsValues(deviceId);
      controller.vault.snapshotDataStore();
      if (controller.vault.getValue("IsRegistered", deviceId)) {
        console.log('registration success')
        resolve(true);
      }
      else {
        console.log('registration failure')
        resolve(false);
      }
    })
  })
}

function isDeviceRegistered(controller, driver, deviceId) {
  return new Promise(function (resolve, reject) {
    let retValue = controller.vault.getValue("IsRegistered", deviceId);
    console.log('is registered ? : ' + retValue)
    if (retValue) {resolve(retValue);}
    else {
      registerDevice(controller, driver, deviceId).then((result)=>{
        console.log('the result of the registration process is '+result)
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


function executeDriverCreation (driver, hubController, deviceId) { 
    return new Promise(function (resolve, reject) {
    //driverTable.length = 0; //Reset the table without cleaning the previous reference (to avoid destructing other devices when running Discovery).
      let currentDeviceId = deviceId ? deviceId : DEFAULT; //to add the deviceId of the real discovered device in the Helpers

      let controller = createController(hubController, driver);

      //TODO check if this is still usefull
      //if (hubController) {controller.assignDiscoverHubController(hubController)}; //if the device is a discovered device.
      const theDevice = neeoapi.buildDevice("JAC MetaDriver " + driver.name) 
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
      controller.vault.addVariable('NeeoBrainIP', config.brainip, currentDeviceId); //Adding a usefull system variable giving the brain IP address.

      //adding mac discovered device variable in the vault
      if (driver.discovereddevice){
        if (driver.discovereddevice.mac) {
          driver.discovereddevice.mac.forEach(macAddress => {
            let discoDev = discoveredDevices.find((elt)=> {return elt.mac.toUpperCase().startsWith(macAddress.toUpperCase())});
            if (discoDev) {
              controller.vault.addVariable('DiscoveredDeviceIP', discoDev.ip, currentDeviceId); //Adding a usefull system variable giving the discovered device IP address.
            }
          })
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
      if (driver.webSocket) {
        controller.addConnection({"name":"webSocket", "descriptor":driver.webSocket, "connector":""})
      }
      if (driver.jsontcp) {
        controller.addConnection({"name":"jsontcp", "descriptor":driver.jsontcp, "connector":""})
      }
      if (settings.mqtt) {
        console.log('creating the connection mqtt')
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
          console.log('Starting discovery process for ' + currentDeviceId);
          theDevice.enableDiscovery(
            {
              headerText: driver.discover.welcomeheadertext,
              description: driver.discover.welcomedescription,
              enableDynamicDeviceBuilder: true,
            },
            (targetDeviceId) => {
              return new Promise(function (resolve, reject) {
                  discoveryDriverPreparator(controller, driver, currentDeviceId, targetDeviceId).then((driverList) => {
                  const formatedTable = [];
                  discoveredDriverListBuilder(driverList, formatedTable, 0, controller, targetDeviceId).then((outputTable) => {
                    //controller.vault.snapshotDataStore(); JAC TO TEST 
                    resolve(outputTable); 
                  })
                })
              })
            }
          )
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
        

        //CREATING WIDGETS
  /*
        for (var prop in driver.players) { // Dynamic creation of players
          if (Object.prototype.hasOwnProperty.call(driver.players, prop)) {
            const myDirectory = controller.directoryH[controller.directoryH.findIndex((helper) => {return (helper.name == driver.players[prop].rootdirectory)})];
            const myQueueDirectory = controller.directoryH[controller.directoryH.findIndex((helper) => {return (helper.name == driver.players[prop].queuedirectory)})];
            const myVolume = controller.sliderH[controller.sliderH.findIndex((helper) => {return (helper.name == driver.players[prop].volume)})];
            const myCoverArt = controller.sensorH[controller.sensorH.findIndex((helper) => {return (helper.name == driver.players[prop].cover)})];
            const myTitle = controller.sensorH[controller.sensorH.findIndex((helper) => {return (helper.name == driver.players[prop].title)})]
            const myDescription = controller.sensorH[controller.sensorH.findIndex((helper) => {return (helper.name == driver.players[prop].description)})]
            const myPlayingSwitch = controller.switchH[controller.directoryH.findIndex((helper) => {return (helper.name == driver.players[prop].IsPlaying)})]
            const myMuteSwitch = controller.switchH[controller.directoryH.findIndex((helper) => {return (helper.name == driver.players[prop].IsMuted)})]
            const myShuffleSwitch = controller.switchH[controller.directoryH.findIndex((helper) => {return (helper.name == driver.players[prop].IsShuffle)})]
            const myRepeatSwitch = controller.switchH[controller.directoryH.findIndex((helper) => {return (helper.name == driver.players[prop].IsRepeat)})]

            theDevice.addPlayerWidget({
              rootDirectory: {
                name: 'Collection', 
                label: 'My Collection', 
                controller: { 
                  getter: (deviceId, params) => {return new Promise(function (resolve, reject) { resolve(myDirectory.fetchList(deviceId, params))})},
                  action:(deviceId, params) => {myDirectory.handleAction(deviceId,params)},
                }
              },

              queueDirectory: {
                name: 'Queue', 
                label: 'Playing Queue', 
                controller: { 
                  getter: (deviceId, params) => {return new Promise(function (resolve, reject) { resolve(myQueueDirectory.fetchList(deviceId, params))})},
                  action:(deviceId, params) => {myQueueDirectory.handleAction(deviceId,params)},
                }
              },

              volumeController: { 
                getter:(deviceId) => {myVolume.get(deviceId)},
                setter:(deviceId, params) => {myVolume.set(deviceId,params)},
              },
              coverArtController: {
                getter:(deviceId) => {myCoverArt.get(deviceId)},
              },
              titleController: { 
                getter:(deviceId) => {myTitle.get(deviceId)},
              },
              descriptionController: { 
                getter:(deviceId) => {myDescription.get(deviceId)},
              },
              playingController: { 
                getter:(deviceId) => {myPlayingSwitch.get(deviceId)},
                setter:(deviceId, params) => {myPlayingSwitch.set(deviceId,params)},
              },
              muteController: { 
                getter:(deviceId) => {myMuteSwitch.get(deviceId)},
                setter:(deviceId, params) => {myMuteSwitch.set(deviceId,params)},
              },
              shuffleController: { 
                getter:(deviceId) => {myShuffleSwitch.get(deviceId)},
                setter:(deviceId, params) => {myShuffleSwitch.set(deviceId,params)},
              },
              repeatController: { 
                getter:(deviceId) => {myRepeatSwitch.get(deviceId)},
                setter:(deviceId, params) => {myRepeatSwitch.set(deviceId,params)},
              },
            })
          }
        }
  */
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
              deviceAdded: (deviceId) => {console.log('device added :' + deviceId);controller.dynamicallyAssignSubscription(deviceId)},
              deviceRemoved: (deviceId) => {console.log('device removed: ' + deviceId);},
              initializeDeviceList: (deviceIds) => {console.log("INITIALIZED DEVICES:" + deviceIds)},
            }
          )
          console.log("Device " + driver.name + " has been created.");
          enableMQTT(controller, currentDeviceId);
          resolve(theDevice);
        });
      })
  })
}

//DISCOVERING BRAIN
        
function discoverBrain() {
  return new Promise(function (resolve, reject) {
    console.log('Trying to discover a NEEO Brain...');
    brainDiscovered = true;
    neeoapi.discoverOneBrain()
      .then((brain) => {
        console.log('- Brain discovered:', brain.name);
        console.log('at IP: ' + brain.iparray)
        config.brainip = brain.iparray.toString();
         resolve();
      })
      .catch ((err) => {
        console.log("Brain couldn't be discovered, check if it is on and on the same wifi network: " + err);
        reject();
      })
    })
}

function setupNeeo() {
  return new Promise(function (resolve, reject) {
    console.log(config)
    if (process.env.BRAINIP)  { 
      config.brainip = process.env.BRAINIP;
      if (process.env.BRAINPORT)
         config.brainport = process.env.BRAINPORT;
      console.log("Using brain-IP fromm environment variable:", config);
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
    const neeoSettings = {
      brain: config.brainip.toString(),
      port: config.brainport.toString(),
      name: "metadriver",
      devices: driverTable
    };
    console.log(__dirname);
    console.log('Trying to start the Meta')
    theBrain = {"name":"neeo","iparray":config.brainip}
    neeoapi.getRecipesPowerState(neeoSettings.brain)
    .then((poweredOnKeys) => {
      console.log('- Power state fetched, powered on recipes:', poweredOnKeys);
  })
    neeoapi.startServer(neeoSettings)
      .then((result) => {
        console.log('Driver running, you can search it on the remote control.');
        if (brainDiscovered) {
            fs.writeFile(__dirname + '/config.js', JSON.stringify(config), err => {
              if (err) {
                  console.log('Error writing configuration file', err);
              } else {
                  console.log('Initial configuration saved.');
              }
              resolve();
            })
          }
      })
      .catch(err => {
          console.log('Failed running Neeo with error: ' + err);
          config.brainport = Number(config.brainport)+1;
          console.log('trying to increment port:', config.brainport);
          runNeeo();
      });
    })

}

function enableMQTT (cont, deviceId) {
/*  neeoapi.getRecipes("192.168.1.26")
  .then((poweredOnKeys) => {
 //   console.log('- Power state fetched, powered on recipes:', poweredOnKeys);
    poweredOnKeys[1].action.powerOn("test");
  });
  console.log(deviceState.getAllDevices());
*/
  mqttClient.subscribe(settings.mqtt_topic + cont.name + "/#", () => {});
  mqttClient.on('message', function (topic, value) {
      try {

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

         }
      }
      catch (err) {console.log('Error while parsing incomming message on: '+settings.mqtt_topic + cont.name + "/command");console.log(err)}
  });
}

//MAIN
//const deviceState = neeoapi.buildDeviceState(2000);
find().then(devices => {
  console.log(devices)
  discoveredDevices = devices;
    getConfig().then(() => {
      mqttClient = mqtt.connect('mqtt://' + settings.mqtt, {clientId:"meta"}); // Always connect to the local mqtt broker
      mqttClient.setMaxListeners(0); //CAREFULL OF MEMORY LEAKS HERE.
      mqttClient.on('connect', (result) => {
      createDevices()
      .then (() => {
        setupNeeo().then(() => {
        })
      })
    })
  })
})


