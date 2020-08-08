//"use strict";
const settings = require(__dirname + '/settings');
const neeoapi = require("neeo-sdk");
const metacontrol = require(__dirname + '/metaController');
const fs = require('fs')
const activatedModule = __dirname + '/activated/';
const { exec } = require("child_process");
const { resolve } = require("path");
var config = {brainip : '', brainport : ''};
const driverTable = [];

function getConfig() {
  return new Promise(function (resolve, reject) {
    fs.readFile('./config.js', (err, data) => {
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

function getHelper (HelpTable, prop) {
  return HelpTable[HelpTable.findIndex((item) => { return (item.name==prop) })];
}

function getIndividualActivatedDrivers(files, driverList, driverIterator) {
  return new Promise(function (resolve, reject) {
    if (driverIterator < files.length) {
      console.log('Activating driver :' + files[driverIterator])
      fs.readFile(activatedModule + files[driverIterator], (err, data) => {
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
      console.log(drivers)
      executeDriversCreationFromFiles(drivers).then((driverTable) => {
        resolve(driverTable);
      });
    })
  })
}

function executeDriversCreationFromFiles (drivers) {
  return new Promise(function (resolve, reject) {

    drivers.forEach(driver => {
      console.log(driver.name);
      const controller = new metacontrol(driver);
      const theDevice = neeoapi.buildDevice("JAC MetaDriver " + driver.name) 
        .setType(driver.type) 
        .setDriverVersion(driver.version)
        .setManufacturer(driver.manufacturer)
        if (driver.icon) {
            theDevice.setIcon(driver.icon)
        }
        
        if (driver.socket) {controller.addSocket(driver.socket)}// create a socket needed for websocket connection only
        
        //CREATING VARIABLES
         for (var prop in driver.variables) { // Initialisation of the variables
          if (Object.prototype.hasOwnProperty.call(driver.variables, prop)) {
             controller.addVariable(prop, driver.variables[prop])
          }
        }
   
        //CREATING LISTENERS
        for (var prop in driver.listeners) { // Initialisation of the variables
          if (Object.prototype.hasOwnProperty.call(driver.listeners, prop)) {
             controller.addListener({
               name : prop, 
               type : driver.listeners[prop].type,
               command : driver.listeners[prop].command,
               queryresult : driver.listeners[prop].queryresult,
               evalwrite : driver.listeners[prop].evalwrite,
              })
          }
        }
      
        //CREATING CONTROLLERS
        
        for (var prop in driver.images) { // Dynamic creation of all images
          if (Object.prototype.hasOwnProperty.call(driver.images, prop)) {
            controller.addImageHelper(prop, driver.images[prop].listen)
          }
        }
     
        for (var prop in driver.labels) { // Dynamic creation of all labels
          if (Object.prototype.hasOwnProperty.call(driver.labels, prop)) {
            controller.addLabelHelper(prop, driver.labels[prop].listen)
          }
        }

        for (var prop in driver.sensors) { // Dynamic creation of all sensors
          if (Object.prototype.hasOwnProperty.call(driver.sensors, prop)) {
            controller.addSensorHelper(prop, driver.sensors[prop].listen)
          }
        }

        for (var prop in driver.switches) { // Dynamic creation of all sliders
          if (Object.prototype.hasOwnProperty.call(driver.switches, prop)) {
           controller.addSwitchHelper(prop, driver.switches[prop].listen);
          }
        }

        for (var prop in driver.sliders) { // Dynamic creation of all sliders
          if (Object.prototype.hasOwnProperty.call(driver.sliders, prop)) {
            controller.addSliderHelper(driver.sliders[prop].min,driver.sliders[prop].max,driver.sliders[prop].type, driver.sliders[prop].command, driver.sliders[prop].queryresult, driver.sliders[prop].listen, prop);
          }
        }

        for (var prop in driver.directories) { // Dynamic creation of directories
          if (Object.prototype.hasOwnProperty.call(driver.directories, prop)) {
            const theHelper = controller.addDirectoryHelper(prop);
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

        //CREATING INDIVIDUAL SHORTCUTS

        for (var prop in driver.buttons) { // Dynamic creation of all buttons
          if (Object.prototype.hasOwnProperty.call(driver.buttons, prop)) {
            if (theDevice.buttons.findIndex((item) => {return (item.param.name == prop)})<0) {//not button of same name (in case included in a widget)
              theDevice.addButton({name: prop, label: (driver.buttons[prop].label == '') ? (prop) : (driver.buttons[prop].label)})
            }
          }
        }
 
        for (var prop in driver.images) { // Dynamic creation of all images
          if (Object.prototype.hasOwnProperty.call(driver.images, prop)) {
             if (theDevice.imageUrls.findIndex((item) => {return (item.param.name == prop)})<0) {//not image of same name (in case included in a widget)
                theDevice.addImageUrl({name: prop, label: (driver.images[prop].label == '') ? (prop) : (driver.images[prop].label),
                    size : driver.images[prop].size},
              (deviceId) => getHelper(controller.imageH, prop).get(deviceId))
            }
          }
        }

        for (var prop in driver.labels) { // Dynamic creation of all labels
          if (Object.prototype.hasOwnProperty.call(driver.labels, prop)) {
            if (theDevice.textLabels.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
              theDevice.addTextLabel({name: prop, label: (driver.labels[prop].label == '') ? (prop) : (driver.labels[prop].label)},
              getHelper(controller.labelH, prop).get);
            }
          }
        }

        for (var prop in driver.sensors) { // Dynamic creation of all sensors
          if (Object.prototype.hasOwnProperty.call(driver.sensors, prop)) {
            if (theDevice.sensors.findIndex((item) => {return (item.param.name == prop)})<0) {//not item of same name (in case included in a widget)
              theDevice.addSensor({name: prop, label: (driver.sensors[prop].label == '') ? (prop) : (driver.sensors[prop].label),
              type:driver.sensors[prop].type},
              {
                getter: getHelper(controller.sensorH, prop).get
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
              setter: getHelper(controller.switchH, prop).set, getter: getHelper(controller.switchH, prop).get
            })
          }
         }
       }

        for (var prop in driver.sliders) { // Dynamic creation of all sliders
           if (Object.prototype.hasOwnProperty.call(driver.sliders, prop)) {
            if (theDevice.sliders.findIndex((item) => {return (item.param.name == prop)})<0) {//not image of same name (in case included in a widget)
              theDevice.addSlider({
                name: prop, 
                label: (driver.sliders[prop].label == '') ? (prop) : (driver.sliders[prop].label),
                range: [0,100], unit: driver.sliders[prop].unit 
              },
              {
                setter: getHelper(controller.sliderH, prop).set, getter: getHelper(controller.sliderH, prop).get
              })
            }
          }
        }

        for (var prop in driver.directories) { // Dynamic creation of directories
          if (Object.prototype.hasOwnProperty.call(driver.directories, prop)) {
            if (theDevice.directories.findIndex((item) => {return (item.param.name == prop)})<0) {//not image of same name (in case included in a widget)
              theDevice.addDirectory({
                name: prop, 
                label: (driver.directories[prop].label == '') ? (prop) : (driver.directories[prop].label),
              }, getHelper(controller.directoryH, prop).browse)
            }
          }
        }

        theDevice.addButtonHandler((name, deviceId) => controller.onButtonPressed(name, deviceId))
        theDevice.registerSubscriptionFunction(controller.registerStateUpdateCallback);
        theDevice.registerInitialiseFunction(controller.registerInitiationCallback);
        console.log("Device " + driver.name + " has been created.")
        driverTable.push(theDevice)      
    })
    resolve(driverTable);
  })
  
}


//DISCOVERING BRAIN
        
function discoverBrain() {
  return new Promise(function (resolve, reject) {
    console.log('Trying to discover a NEEO Brain...');
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
      name: "Meta Driver 1.0",
      devices: driverTable
    };
    //console.log(neeoSettings)
    console.log('Trying to start the Driver')
    neeoapi.startServer(neeoSettings)
      .then(() => {
          fs.writeFile('./config.js', JSON.stringify(config), err => {
            if (err) {
                console.log('Error writing file', err);
            } else {
                console.log('Driver running, you can search it on the remote control.');
            }
            resolve();
          })
       
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

createDevices()
  .then (() => {
    getConfig().then(() => {
      setupNeeo();
    })
  })
  .catch ((err) => {console.log('Error during device creation.'); console.log(err)})

 
