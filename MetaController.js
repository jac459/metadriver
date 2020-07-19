
'use strict';

const { sliderHelper } = require("./sliderHelper");

const { directoryHelper } = require("./directoryHelper");

const http = require('http.min');
const jpath = require('jsonpath');
const wol = require('wake_on_lan');
const variablePattern = {'pre':'@=>','post':'<=@'}
const { exec } = require("child_process");
const { cachedDataVersionTag } = require('v8'); // check if needed for discovery of neeo brain and suppress otherwise.


//STRATEGY DESIGN PATTERN FOR THE COMMAND TO BE USED (http-get, post, websocket, ...) New processor to be added here. This strategy mix both transport and data format (json, soap, ...)
class ProcessingManager {
  constructor() {
    this._processor = null;
  };
  set processor(processor) {
    this._processor = processor;
  };
  get processor() {
    return this._processor;
  }
  process(command) {
    return new Promise( (resolve, reject) => {
      this._processor.process(command)
      .then((result) => {resolve(result)})
      .catch((err) => reject (err))
    })
  }
  query(data, query) {
    return this._processor.query(data, query)
  }
}
class httpgetProcessor {
  process (command) {
    return new Promise(function (resolve, reject) {
      http(command) 
      .then(function(result) { 
        resolve(result.data)
      })
      .catch((err) => {reject (err)})
    })
  }
  query (data, query) {
    try {
      return jpath.query(JSON.parse(data), query);
    }
    catch {
      console.log('error in JSONPATH ' + query + ' processing of :' + data)
    }
  }
}
class cliProcessor {
  process (command) {
    return new Promise(function (resolve, reject) {
        exec(command, (stdout, stderr) => {
          if (stdout) {
            resolve(stdout);
          }
          else {
            resolve(stderr);
          }
        })
    })
  }
  query (data, query) {
    try {
      //let resultArray = new [];
      return data.split(query);
    }
    catch {
      console.log('error in string.search regex :' + query + ' processing of :' + data)
    }
  }
}
const processingManager = new ProcessingManager();
const myHttpgetProcessor = new httpgetProcessor();
const myCliProcessor = new cliProcessor();

module.exports = function controller(driver) {
  this.buttons = driver.buttons; //structure keeping all buttons of the driver
  this.sendComponentUpdate;
  this.deviceVariables = []; //container for all device variables.
  this.sliderH = []; //slider helper to store all the getter and setter of the dynamically created sliders.
  this.directoryH = []; //directory helper to store all the browse getter and setter of the dynamically created simple directories.
  this.linkedDirectoryH = []; //directory helper to store all the browse getter and setter of the dynamically created linked directories.
  this.buttonsWithMultipleCommands = []; //Memorize for each button with multiple command associated, the last command used. (useful for example for toggle buttons)
  var self = this;
   
  this.addVariable = function(name, value) {
    self.deviceVariables.push({'name':name, 'value':value});
  }

  this.assignVariables = function(inputChain) {
    let result = inputChain;
    self.deviceVariables.forEach(variable => {
      let token = variablePattern.pre + variable.name + variablePattern.post;
      result = result.replace(token, variable.value);
    })
    return result;
  }

  this.addSliderHelper = function(min,max,commandtype, command, statuscommand, querystatus, slidername) {//function called by the MetaDriver to store 
    const newSliderH = new sliderHelper(min,max,commandtype, command, statuscommand, querystatus, slidername, self)
    self.sliderH.push(newSliderH);
    return newSliderH;
  }

  this.addDirectoryHelper = function() {//function called by the MetaDriver to store the features of the list 
    const newDirectoryH = new directoryHelper(self)
    self.directoryH.push(newDirectoryH);
    return newDirectoryH;
  }

  this.registerStateUpdateCallback = function(updateFunction) {//technical function to send event to the remote.
    self.sendComponentUpdate = updateFunction;
  };
  
  this.getStatus = function() {
    return '';
  }

  this.commandProcessor = function(command, commandtype) { // process any command according to the target protocole
    return new Promise(function (resolve, reject) {
      if (commandtype == 'http-get') {
        processingManager.processor = myHttpgetProcessor;
      }
      else if (commandtype == 'cli') {
        processingManager.processor = myCliProcessor;
      }
      else {reject('commandtype not defined.')}

      command = self.assignVariables(command);

      processingManager.process(command)
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {reject (err)})
    })    
  }

  this.queryProcessor = function (data, query, commandtype) { // process any command according to the target protocole
      if (commandtype == 'http-get') {
        processingManager.processor = myHttpgetProcessor;
      }
      else if (commandtype == 'cli') {
        processingManager.processor = myCliProcessor;
      }
      else {reject('commandtype not defined.')}

      query = self.assignVariables(query);

      return processingManager.query(data, query);
  }

  this.displayStatus = function (deviceId, message) {

    self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: message})
    .catch( (err) => {console.log ("Message was " + message + " - Error generated is : " + err)})
    setTimeout(() => {
      self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: 'Ready'})
      .catch( (err) => {console.log ("Message was " + message + " - Error generated is : " + err)})
    }, 3000);

  }


  this.commandButtonProcessor = function (name, deviceId, command, queryresult, expectedresult, commandtype) {
    return new Promise(function (resolve, reject) {
      self.commandProcessor(command, commandtype)
      .then((result)=> {
        if (queryresult != "") {// Case we want to parse the result
          console.log(result);
          console.log('Query :' + queryresult);
          result = self.queryProcessor(result, queryresult, commandtype)[0];
          console.log(result);
        }
        resolve(result);
      })
      .catch((err) => { 
          reject(err.code)
      })
    })
  }
  
  this.onButtonPressed = function(name, deviceId) {
    console.log('[CONTROLLER]' + name + ' button pressed for device ' + deviceId);
    let theButton = self.buttons[name];
    if (theButton != undefined) {
      if (theButton.type in {'http-get':"", 'http-post':"", 'websocket':"", 'MQTT':"", 'cli':""}) {
        if (theButton.command != undefined){ // In case the button has only one command defined
          self.commandButtonProcessor(name, deviceId, theButton.command, theButton.queryresult, theButton.expectedresult, theButton.type)
          .then((result)=>{
            
            if (theButton.variable2assign != undefined && theButton.variable2assign != '') { //Assign Variables if needed
              let varIndex = self.deviceVariables.findIndex( (variableIt) => {return (variableIt.name == theButton.variable2assign)}); 
              console.log('result')
              if (varIndex >= 0) {self.deviceVariables[varIndex].value = result}; 
              console.log(self.deviceVariables[varIndex])
            }

            if (theButton.expectedresult != undefined && theButton.expectedresult != '') {// case we want to check the result to see if ok.
              if (theButton.expectedresult == result) {
                self.displayStatus(deviceId, name + ' Command Success')
              }
              else {//FALLBACK LOGIC IF THE FIRST COMMAND DOESN'T RETURN the right value
                if (theButton.fallbackbutton != '') {
                  self.onButtonPressed(theButton.fallbackbutton,deviceId);
                  self.displayStatus(deviceId, 'Trying Alternate methode.')
                }
                else {
                  console.log("Error : " + err)
                  self.displayStatus(deviceId, 'Function didn\'t return the expected code.')
                }
              }
            }
            else { //case we just want to display the result.
              self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: result})
              .catch( (err) => {console.log(err)})
            }
          })
          .catch((err) => { //FALLBACK LOGIC IF THE FIRST COMMAND DOESN'T WORK
            if (theButton.fallbackbutton != '') {
              self.onButtonPressed(theButton.fallbackbutton,deviceId);
              self.displayStatus(deviceId, 'Trying Alternate methode.')
            }
            else {
              console.log("Error : " + err)
              self.displayStatus(deviceId, 'Couldn\'t execute the function')
             }
          })
        }
        if (theButton.commands != undefined) { // in case the button has multiple commands defined
          console.log('multiple commands')
          let currentButton = self.buttonsWithMultipleCommands.find((button) => { return (button.name == name)});//getting back the last command used through the dynamic structure
          console.log("Current button: " + currentButton)
          if (currentButton == undefined) { // if no last command found, use the first command.
            currentButton = {'name':name,'index':0};
              self.buttonsWithMultipleCommands.push(currentButton)
          }
          console.log('Command: ' + theButton.commands[currentButton.index])
          self.commandButtonProcessor(name, deviceId, theButton.commands[currentButton.index], theButton.queryresult, theButton.expectedresult, theButton.type)
          .then(() => {
            currentButton.index = (currentButton.index<theButton.commands.length-1) ? currentButton.index+1 : 0; //go to next command
            self.displayStatus(deviceId, currentButton.name + ' - ' + currentButton.index)
          })
          .catch(function(err){ console.log(err);})
         }
      }
      else if (theButton.type == 'slidercontrol') {
         let SH = self.sliderH.find((sliderhelper) => { return (sliderhelper.slidername == theButton.slidername)}); // get the right slider with get and set capacity
         SH.get()
          .then((result) => {
            result = Number(result) + Number(theButton.step);
            console.log ('Slider: ' + result);
            SH.set(deviceId, SH.toSliderValue(result));
          })
          .catch((err) => {
            console.log (err)
          })
      }
      else if (theButton.type == 'wol') {
        console.log(theButton.command)
        wol.wake(theButton.command, function(error) {
          if (error) {
            console.log(error)
          } else {
            console.log('Succes')
            // done sending packets
          }
        });
        var magic_packet = wol.createMagicPacket(theButton.command);
      }
    }
  }
}

