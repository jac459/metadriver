//"use strict";
const settings = require(__dirname + '/settings');
const neeoapi = require("neeo-sdk");
const metacontrol = require(__dirname + '/MetaController');
const fs = require('fs')
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

function createDevices () {
  return new Promise(function (resolve, reject) {
    settings.drivers.forEach(driver => {
      console.log(driver.name);
      const controller = new metacontrol(driver);
      const theDevice = neeoapi.buildDevice("JAC MetaDriver " + driver.name) 
        .setType("AVRECEIVER") 
        .setDriverVersion(driver.version)
        .setManufacturer(driver.manufacturer)
        .addTextLabel(
          { name: 'Status', label: '' }, controller.getStatus);
      
        for (var prop in driver.buttons) { // Dynamic creation of all buttons
          if (Object.prototype.hasOwnProperty.call(driver.buttons, prop)) {
            theDevice.addButton({name: prop, label: (driver.buttons[prop].label == '') ? (prop) : (driver.buttons[prop].label)})
          }
        }
        for (var prop in driver.variables) { // Initialisation of the variables
          if (Object.prototype.hasOwnProperty.call(driver.variables, prop)) {
             controller.addVariable(prop, driver.variables[prop])
          }
        }

        for (var prop in driver.sliders) { // Dynamic creation of all sliders
           if (Object.prototype.hasOwnProperty.call(driver.sliders, prop)) {
            const theHelper = controller.addSliderHelper(driver.sliders[prop].min,driver.sliders[prop].max,driver.sliders[prop].type, driver.sliders[prop].command, driver.sliders[prop].statuscommand,driver.sliders[prop].querystatus, prop);
            theDevice.addSlider({
              name: prop, 
              label: (driver.sliders[prop].label == '') ? (prop) : (driver.sliders[prop].label),
              range: [0,100], unit: driver.sliders[prop].unit 
            },
            {
              setter: theHelper.set, getter: theHelper.get
            })
          }
        }
        for (var prop in driver.directories) { // Dynamic creation of directories
          if (Object.prototype.hasOwnProperty.call(driver.directories, prop)) {
            const theHelper = controller.addDirectoryHelper();
            for (var feed in driver.directories[prop].feeders) {
              let feedConfig = {"name":feed, 
                                "label":driver.directories[prop].feeders[feed].label, 
                                "querylabel":driver.directories[prop].feeders[feed].querylabel, 
                                "type":driver.directories[prop].feeders[feed].type, 
                                "command":driver.directories[prop].feeders[feed].command, 
                                "actioncommand":driver.directories[prop].feeders[feed].actioncommand, 
                                "queryname":driver.directories[prop].feeders[feed].queryname, 
                                "imageurl":driver.directories[prop].feeders[feed].imageurl, 
                                "imageurlpost":driver.directories[prop].feeders[feed].imageurlpost, 
                                "queryimage":driver.directories[prop].feeders[feed].queryimage, 
                                "variable2assign":driver.directories[prop].feeders[feed].variable2assign, 
                                "nextdatafeeder":driver.directories[prop].feeders[feed].nexdatafeeder};
              console.log(feedConfig)                        
              theHelper.addFeederHelper(feedConfig);
            }
            theDevice.addDirectory({
              name: prop, 
              label: (driver.directories[prop].label == '') ? (prop) : (driver.directories[prop].label),
            }, theHelper.browse)

          }
        }
/*        for (var prop in driver.linkeddirectories) { // Dynamic creation of navigation directories
          if (Object.prototype.hasOwnProperty.call(driver.linkeddirectories, prop)) {
            const theHelper = controller.addDirectoryHelper(driver.directories[prop].type, driver.directories[prop].command, driver.directories[prop].actioncommand,driver.directories[prop].queryname, prop, driver.directories[prop].querylabel, driver.directories[prop].imageurl, driver.directories[prop].imageurlpost, driver.directories[prop].queryimage, driver.directories[prop].variable2assign);
            theDevice.addDirectory({
              name: prop, 
              label: (driver.directories[prop].label == '') ? (prop) : (driver.directories[prop].label),
            }, theHelper.browse)
          }
        }
*/        theDevice.addButtonHandler((name, deviceId) => controller.onButtonPressed(name, deviceId))
        theDevice.registerSubscriptionFunction(controller.registerStateUpdateCallback);
  
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
      if (!config.brainport) {config.brainport = 4000}
      const neeoSettings = {
      brain: config.brainip.toString(),
      port: config.brainport.toString(),
      name: "Meta Driver",
      devices: driverTable
    };
    console.log(neeoSettings)
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
  .catch ((err) => {console.log('Error during device creation.' + err)})

 
