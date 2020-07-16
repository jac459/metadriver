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
      const controller = new metacontrol(driver, driver.sliders.length);
      const theDevice = neeoapi.buildDevice("JAC MetaDriver " + driver.name) 
        .setType("AVRECEIVER") 
        .setDriverVersion(8)
        .setManufacturer(driver.manufacturer)
        .addTextLabel(
          { name: 'Status', label: '' }, controller.getStatus);
      
        for (var prop in driver.buttons) { // Dynamic creation of all buttons
          if (Object.prototype.hasOwnProperty.call(driver.buttons, prop)) {
            theDevice.addButton({name: prop, label: (driver.buttons[prop].label == '') ? (prop) : (driver.buttons[prop].label)})
          }
        }
        for (var prop in driver.sliders) { // Dynamic creation of all sliders
           if (Object.prototype.hasOwnProperty.call(driver.sliders, prop)) {
            let theHelper = controller.addSliderHelper(driver.sliders[prop].min,driver.sliders[prop].max,driver.sliders[prop].command, driver.sliders[prop].statuscommand,driver.sliders[prop].jpathstatus, prop);
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
        theDevice.addButtonHandler((name, deviceId) => controller.onButtonPressed(name, deviceId))
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
        console.log('test')
          fs.writeFile('./config.js', JSON.stringify(config), err => {
            console.log('test2')
       
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

 
