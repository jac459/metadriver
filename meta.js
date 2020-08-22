//"use strict";
const path = require('path');
const settings = require(path.join(__dirname,'settings'));
const neeoapi = require("neeo-sdk");
const metacontrol = require(path.join(__dirname,'metaController'));
const fs = require('fs');
const activatedModule = path.join(__dirname,'activated');
const BUTTONHIDE = '__';
const DEFAULT = 'default'; //NEEO SDK deviceId default value
var config = {brainip : '', brainport : ''};
var brainDiscovered = false;
const driverTable = [];

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
      console.log(path.join('Activating drivers :', files[driverIterator]))
      fs.readFile(path.join(activatedModule, files[driverIterator]), (err, data) => {
        if (data) {
          try {
            const driver = JSON.parse(data);
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

function createDevices () {
  return new Promise(function (resolve, reject) {
    getActivatedDrivers().then((drivers) => {
      drivers = drivers.concat(settings.drivers);
      executeDriversCreation(drivers).then((driverTable) => {
        console.log('drivers CREATED');
        resolve(driverTable);
      })
    })
  })
}

function discoveredDriverListBuilder(inputRawDriverList, outputPreparedDriverList, indent, controller) {
  return new Promise (function (resolve, reject) {
    if (indent < inputRawDriverList.length) {
      if (inputRawDriverList[indent].dynamicname && inputRawDriverList[indent].dynamicname != "") {
        let temp = [];
        temp.push(inputRawDriverList[indent]); //Array to element, element to Array. (TODO, make the function accept non array)
        executeDriversCreation(temp, controller, inputRawDriverList[indent].dynamicid).then((builtdevice) => {
          builtdevice = builtdevice[0];
          builtdevice.addCapability("dynamicDevice");
          const discoveredDevice = {
            id:inputRawDriverList[indent].dynamicid,
            name:inputRawDriverList[indent].dynamicname,
            reachable:true,
            device : builtdevice
          }
          outputPreparedDriverList.push(discoveredDevice);
        })
      }
      //We resolve even if this device is skipped.
      resolve(discoveredDriverListBuilder(inputRawDriverList, outputPreparedDriverList, indent+1, controller));
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
    let tempoResult = controller.assignTo("$Result", slicedDriver[index].split(" DYNAMIK_INST_END")[0].replace(/\\/g, ""), givenResult);
    recontructedDriver = recontructedDriver + tempoResult;
    recontructedDriver = recontructedDriver + slicedDriver[index].split(" DYNAMIK_INST_END")[1];
  }
  return JSON.parse(recontructedDriver);
}

function discoveryDriverPreparator(controller, driver) {
  return new Promise(function (resolve, reject) {
                      
    if (driver.discover) {
      let instanciationTable = []
      controller.initiateProcessor(driver.discover.command.type).then(() => {
        controller.commandProcessor(driver.discover.command.command, driver.discover.command.type).then((result)=>{
          controller.queryProcessor(result, driver.discover.command.queryresult, driver.discover.command.type).then((result) => {
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
    else {
      resolve();
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

function executeDriversCreation (drivers, hubController, deviceId) { //drivers is a json represnetaiton of the drivers and hubController is a controller to be given to discovered devices (it is there Hub controller).
  return new Promise(function (resolve, reject) {
    
    driverTable.length = 0; //Reset the table without cleaning the previous reference (to avoid destructing other devices when running Discovery).
    drivers.forEach(driver => {
      console.log(driver.name);

      let currentDeviceId = deviceId ? deviceId : DEFAULT; //to add the deviceId of the real discovered device in the Helpers

      let controller = createController(hubController, driver)

      //TODO check if this is still usefull
      if (hubController) {controller.assignDiscoverHubController(hubController)}; //if the device is a discovered device.
      
      const theDevice = neeoapi.buildDevice("JAC MetaDriver " + driver.name) 
        .setType(driver.type) 
        .setDriverVersion(driver.version)
        .setManufacturer(driver.manufacturer)
        if (driver.icon) {
            theDevice.setIcon(driver.icon)
        }
        
        //GET ALL CONNEXIONS
        if (driver.webSocket) {
          controller.addConnection({"name":"webSocket", "descriptor":driver.webSocket, "connector":""})
        }
        if (driver.jsontcp) {
          controller.addConnection({"name":"jsontcp", "descriptor":driver.jsontcp, "connector":""})
        }
  
        //DISCOVERY  
        if (driver.discover) {

          theDevice.enableDiscovery(
            {
              headerText: driver.discover.welcomeheadertext,
              description: driver.discover.welcomedescription,
              enableDynamicDeviceBuilder: true,
            },
            () => {
              return new Promise(function (resolve, reject) {
                discoveryDriverPreparator(controller, driver).then((driverList) => {
                  const formatedTable = [];
                  discoveredDriverListBuilder(driverList, formatedTable, 0, controller).then((outputTable) => {
                    resolve(outputTable); 
                  })
                })
              })
            }
          )
        }
       
        //CREATING VARIABLES
        for (var prop in driver.variables) { // Initialisation of the variables
          if (Object.prototype.hasOwnProperty.call(driver.variables, prop)) {
            controller.vault.addVariable(prop, driver.variables[prop], currentDeviceId)
          }
        }
        controller.vault.addVariable('NeeoBrainIP', config.brainip, currentDeviceId); //Adding a usefull system variable giving the brain IP address.

        //CREATING LISTENERS
        for (var prop in driver.listeners) { // Initialisation of the variables
          if (Object.prototype.hasOwnProperty.call(driver.listeners, prop)) {
             controller.addListener({
               name : prop, 
               type : driver.listeners[prop].type,
               command : driver.listeners[prop].command,
               timer : "", //prepare the the listener to save the timer here.
               pooltime : driver.listeners[prop].pooltime,
               poolduration : driver.listeners[prop].poolduration,
               queryresult : driver.listeners[prop].queryresult,
               evalwrite : driver.listeners[prop].evalwrite,
              })
          }
        }
      
        //CREATING CONTROLLERS
        
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
                theDevice.addImageUrl({name: prop, label: (driver.images[prop].label == '') ? (prop) : (driver.images[prop].label),
                    size : driver.images[prop].size},
              (deviceId) => getHelper(controller.imageH, prop, currentDeviceId).get(deviceId))
            }
          }
        }

        for (var prop in driver.labels) { // Dynamic creation of all labels
          if (Object.prototype.hasOwnProperty.call(driver.labels, prop)) {
            if (theDevice.textLabels.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
              theDevice.addTextLabel({name: prop, label: (driver.labels[prop].label == '') ? (prop) : (driver.labels[prop].label)},
              getHelper(controller.labelH, prop, currentDeviceId).get);
            }
          }
        }

        for (var prop in driver.sensors) { // Dynamic creation of all sensors
          if (Object.prototype.hasOwnProperty.call(driver.sensors, prop)) {
            if (theDevice.sensors.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
              theDevice.addSensor({name: prop, label: (driver.sensors[prop].label == '') ? (prop) : (driver.sensors[prop].label),
              type:driver.sensors[prop].type},
              {
                getter: getHelper(controller.sensorH, prop, currentDeviceId).get
              });
            }
          }
        }

        for (var prop in driver.switches) { // Dynamic creation of all sliders
          if (Object.prototype.hasOwnProperty.call(driver.switches, prop)) {
            if (theDevice.switches.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
            theDevice.addSwitch({
              name: prop, 
              label: (driver.switches[prop].label == '') ? (prop) : (driver.switches[prop].label),
            },
            {
              setter: getHelper(controller.switchH, prop, currentDeviceId).set, getter: getHelper(controller.switchH, prop, currentDeviceId).get
            })
          }
         }
       }

        for (var prop in driver.sliders) { // Dynamic creation of all sliders
          if (Object.prototype.hasOwnProperty.call(driver.sliders, prop)) {
            if (theDevice.sliders.findIndex((item) => {return (item.param.name == prop)})<0) {//not slider of same name (in case included in a widget)
              theDevice.addSlider({
                name: prop, 
                label: (driver.sliders[prop].label == '') ? (prop) : (driver.sliders[prop].label),
                range: [0,100], unit: driver.sliders[prop].unit 
              },
              {
                setter: getHelper(controller.sliderH, prop, currentDeviceId).set, getter: getHelper(controller.sliderH, prop, currentDeviceId).get
              })
            }
          }
        }

        for (var prop in driver.directories) { // Dynamic creation of directories
          if (Object.prototype.hasOwnProperty.call(driver.directories, prop)) {
            if (theDevice.directories.findIndex((item) => {return (item.param.name == prop)})<0) {//not directory of same name (in case included in a widget)
              theDevice.addDirectory({
                name: prop, 
                label: (driver.directories[prop].label == '') ? (prop) : (driver.directories[prop].label),
              }, getHelper(controller.directoryH, prop, currentDeviceId).browse)
            }
          }
        }

        theDevice.addButtonHandler((name, deviceId) => controller.onButtonPressed(name, deviceId))
        theDevice.registerSubscriptionFunction(controller.registerStateUpdateCallback);
        theDevice.registerInitialiseFunction(controller.registerInitiationCallback);
        theDevice.registerDeviceSubscriptionHandler(
          {
            deviceAdded: (deviceId) => {console.log('device added/////////////////////////////////' + deviceId);controller.dynamicallyAssignSubscription(deviceId)},
            deviceRemoved: (deviceId) => {console.log('device removed/////////////////////' + deviceId);},
            initializeDeviceList: (deviceIds) => {debug('existing devices' + deviceIds)},
          }
        )
        console.log("Device " + driver.name + " has been created.")
        driverTable.push(theDevice);  
    })
    resolve(driverTable);
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
    console.log('config')
    console.log(config)
    if (config.brainip == ''){
      console.log('discover')
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
      if (!config.brainport) {config.brainport = 4005}
      const neeoSettings = {
      brain: config.brainip.toString(),
      port: config.brainport.toString(),
      name: "Meta Driver 0.8.1 Alpha",
      devices: driverTable
    };
    console.log(neeoSettings)
    console.log('Trying to start the Driver')
    neeoapi.startServer(neeoSettings)
      .then(() => {
        console.log('Driver running, you can search it on the remote control.');
        if (brainDiscovered) {
            fs.writeFile('./config.js', JSON.stringify(config), err => {
              if (err) {
                  console.log('Error writing file', err);
              } else {
                  console.log('Initial config saved.');
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






//MAIN

getConfig().then(() => {
  createDevices()
  .then (() => {
    setupNeeo();
  })
})

