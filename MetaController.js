
'use strict';
const http = require('http.min');
const jpath = require('jsonpath');
const neeoapi = require('neeo-sdk');
const wol = require('wake_on_lan');
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
      return data.search(query);
    }
    catch {
      console.log('error in string.search regex :' + query + ' processing of :' + data)
    }
  }
}

const processingManager = new ProcessingManager();
const myHttpgetProcessor = new httpgetProcessor();
const myCliProcessor = new cliProcessor();
//END OF STRATEGY

function directoryHelper (commandtype, command, actioncommand, queryname, directoryname, querylabel, preurl, posturl, queryimage, controller) {
  
  console.log(queryname);
 
  this.command = command;
  this.commandtype = commandtype;
  this.controller = controller;
  this.actioncommand = actioncommand;
  this.directoryname = directoryname;
  this.queryname = queryname;
  this.querylabel = querylabel;
  this.queryimage = queryimage;
  var self = this;
  
  this.browse = {
      getter: (deviceId, params) => this.fetchList(deviceId, params),
      action: (deviceId, params) => this.handleAction(deviceId, params),
  };  

  this.listFillHelper = function(dataset, list, query) {
    if (query != '' && query != undefined) {
      list = controller.queryProcessor(dataset, query, self.commandtype);
      return list; 
    }
    else {return null}
  }

  this.fetchList = function (deviceId, params) { 
    
    let neeoList;
    let nameList;
    let imageList;
    let labelList;
    return new Promise(function (resolve, reject) {
      self.controller.commandProcessor(self.command, self.commandtype)
      .then(function(result) { 
        nameList = self.listFillHelper(result, nameList, self.queryname);
        imageList = self.listFillHelper(result, imageList, self.queryimage);
        labelList = self.listFillHelper(result, labelList, self.querylabel);
        console.log(result);
        console.log(nameList);
        neeoList = neeoapi.buildBrowseList({
          title: self.directoryname,
          totalMatchingItems: nameList.length,
          limit: nameList.length,
          offset: 0,
          browseIdentifier: 'browseEverything',
          uiAction : 'close'
        })
      })
      .then(function() { 
        var i;
        for (i = 0; i<nameList.length; i++) {
            let iTitle = nameList[i];
            let iLabel = labelList ? labelList[i] : directoryname;
            let iImage = imageList ? imageList[i] : ((preurl != '' ? preurl+nameList[i]+posturl : '')); //imagelist taken, if not, static url, if not, no image.
            let iAction = labelList ? labelList[i] : nameList[i]; //If label is provided, the label will be used as action identifier
            neeoList.addListItem({
                title : iTitle , 
                label: iLabel, 
                thumbnailUri: iImage,
                actionIdentifier : iAction
            })
        }
        console.log(neeoList)
        resolve(neeoList);
      })
      .catch(function(err) {
        console.log(err);
      })
      
    })
  }
  this.handleAction = function (deviceId, params) { 
    console.log(params)
    return new Promise(function (resolve, reject) {
      self.controller.commandProcessor(self.actioncommand+params.actionIdentifier, commandtype)
      .then(function(result) { console.log('ok')})
      .catch(function(err) {reject(err)})
    })
  }

}

function sliderHelper (min,max,commandtype, command, statuscommand, querystatus, slidername, controller) {
  this.min = min;
  this.max = max;
  this.command = command;
  this.statuscommand = statuscommand;
  this.querystatus = querystatus;
  this.slidername = slidername;
  this.commandtype = commandtype
  var self = this;

  this.toDeviceValue = function (value) { //range converter between target device range and slider range
    return Math.round(self.min+(self.max-self.min)*value/100)
  }

  this.toSliderValue = function (value) { //range converter between target device range and slider range
    return Math.round(100*(value-self.min)/(self.max-self.min))
  }

  this.get = function () { 
     return new Promise(function (resolve, reject) {
      controller.commandProcessor(self.statuscommand, self.commandtype)
      .then(function (result) { 
        resolve(controller.queryProcessor(result, self.querystatus, self.commandtype)[0])
      })
      .catch(function(err) {reject(err)})
    })
  }

  this.set = function (deviceId, newValue) {
    controller.commandProcessor(self.command+self.toDeviceValue(newValue), self.commandtype) // set the slider to the same range than the target device
    .then(function(result) { 
      controller.sendComponentUpdate({uniqueDeviceId: deviceId,component: slidername,value: newValue})
        .catch( (err) => {console.log(err)})  
      controller.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: self.toDeviceValue(newValue)})
        .catch( (err) => {console.log(err)})
      console.log(result)
    })
    .catch(function(err) { 
      console.log(err)
    })
  }
}

module.exports = function controller(driver) {
  this.buttons = driver.buttons; //structure keeping all buttons of the driver
  this.sendComponentUpdate;
  this.sliderH = []; //slider helper to store all the getter and setter of the dynamically created sliders.
  this.directoryH = []; //directory helper to store all the browse getter and setter of the dynamically created directories.
  this.buttonsWithMultipleCommands = []; //Memorize for each button with multiple command associated, the last command used. (useful for example for toggle buttons)
  var self = this;
   
  this.addSliderHelper = function(min,max,commandtype, command, statuscommand, querystatus, slidername) {//function called by the MetaDriver to store 
    const newSliderH = new sliderHelper(min,max,commandtype, command, statuscommand, querystatus, slidername, self)
    self.sliderH.push(newSliderH);
    return newSliderH;
  }

  this.addDirectoryHelper = function(commandtype, command, actioncommand, queryname, directoryname, querylabel, preurl, posturl, queryimage) {//function called by the MetaDriver to store the features of the list 
    const newDirectoryH = new directoryHelper(commandtype, command, actioncommand, queryname, directoryname, querylabel, preurl, posturl, queryimage, self)
    self.directoryH.push(newDirectoryH);
    return newDirectoryH;
  }


  this.registerStateUpdateCallback = function(updateFunction) {//technical function to send event to the remote.
    self.sendComponentUpdate = updateFunction;
  };
  
  this.getStatus = function() {
    return '';
  }

  this.commandProcessor = function (command, commandtype) { // process any command according to the target protocole
    return new Promise(function (resolve, reject) {
      if (commandtype == 'http-get') {
        processingManager.processor = myHttpgetProcessor;
      }
      else if (commandtype == 'cli') {
        processingManager.processor = myCliProcessor;
      }
      else {reject('commandtype not defined.')}
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
      return processingManager.query(data, query);
  }

  this.commandButtonProcessor = function (name, deviceId, command, queryresult, expectedresult, commandtype) {
    return new Promise(function (resolve, reject) {
      self.commandProcessor(command, commandtype)
      .then((result)=> {
        if (queryresult != "") {
          console.log(result);
          console.log('Query :' + queryresult);
          result = self.queryProcessor(result, queryresult, commandtype)[0];
          //result = jpath.query(JSON.parse(result.data), queryresult)[0];
          console.log(result);
        }
        if (result == expectedresult) {
          resolve(name);
        }
        else {
          console.log(result);
          reject('Device returned a different code than expected.');
        }
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
          .then((successmessage)=>{
            self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: successmessage})
            .catch( (err) => {console.log(err)})
          })
          .catch((err) => { 
            console.log('Button Value:' + theButton)
            if (theButton.fallbackbutton != '') {
              self.onButtonPressed(theButton.fallbackbutton,deviceId);
              self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: 'Trying Alternate methode.'})
              .catch( (err) => {console.log(err)})
              
            }
            else {
              console.log("Error : " + err)
              self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: 'Couldn\'t execute the function'})
              .catch( (err) => {console.log(err)})
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

