
'use strict';
const http = require('http.min');
const jpath = require('jsonpath');
const neeoapi = require('neeo-sdk');
const wol = require('wake_on_lan');
const { cachedDataVersionTag } = require('v8'); // check if needed for discovery of neeo brain and suppress otherwise.
const settings = require(__dirname + '/settings');

//STRATEGY DESIGN PATTERN FOR THE COMMAND TO BE USED (http-get, post, websocket, ...) New processor to be added here.
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
}
class httpgetProcessor {
  process (command) {
    return new Promise(function (resolve, reject) {
      http(command) 
      .then(function(result) { 
        resolve(result)
      })
      .catch((err) => {reject (err)})
    })
  }
}

const processingManager = new ProcessingManager();
const myHttpgetProcessor = new httpgetProcessor();
//END OF STRATEGY

function directoryHelper (commandtype, command, actioncommand, jpathname, directoryname, jpathlabel, preurl, posturl, jpathimage, controller) {
  
  console.log(jpathname);
 
  this.command = command;
  this.commandtype = commandtype;
  this.controller = controller;
  this.actioncommand = actioncommand;
  this.directoryname = directoryname;
  this.jpathname = jpathname;
  this.jpathlabel = jpathlabel;
  this.jpathimage = jpathimage;
  var self = this;
  
  this.browse = {
      getter: (deviceId, params) => this.fetchList(deviceId, params),
      action: (deviceId, params) => this.handleAction(deviceId, params),
  };  

  this.listFillHelper = function(dataset, list, jpathquery) {
    if (jpathquery != '' && jpathquery != undefined) {
      list = jpath.query(JSON.parse(dataset), jpathquery);
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
        nameList = self.listFillHelper(result.data, nameList, self.jpathname);
        imageList = self.listFillHelper(result.data, imageList, self.jpathimage);
        labelList = self.listFillHelper(result.data, labelList, self.jpathlabel);
        console.log(result.data);
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

function sliderHelper (min,max,commandtype, command, statuscommand, jpathstatus, slidername, controller) {
  this.min = min;
  this.max = max;
  this.command = command;
  this.statuscommand = statuscommand;
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
      .then(function(result) { resolve(jpath.query(JSON.parse(result.data), jpathstatus)[0])})
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
      console.log(result.data)
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
   
  this.addSliderHelper = function(min,max,commandtype, command, statuscommand, jpathstatus, slidername) {//function called by the MetaDriver to store 
    const newSliderH = new sliderHelper(min,max,commandtype, command, statuscommand, jpathstatus, slidername, self)
    self.sliderH.push(newSliderH);
    return newSliderH;
  }

  this.addDirectoryHelper = function(commandtype, command, actioncommand, jpathname, directoryname, jpathlabel, preurl, posturl, jpathimage) {//function called by the MetaDriver to store the features of the list 
    const newDirectoryH = new directoryHelper(commandtype, command, actioncommand, jpathname, directoryname, jpathlabel, preurl, posturl, jpathimage, self)
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
       if (commandtype = 'http-get') {processingManager.processor = myHttpgetProcessor;
        processingManager.process(command)
        .then(
          (result) => {resolve(result)})
        .catch((err) => {reject (err)})
      }
      else {reject('commandtype not defined.')}
    })    
  }

  this.commandButtonProcessor = function (name, deviceId, command, jpathresult, expectedresult, commandtype) {
    return new Promise(function (resolve, reject) {
      self.commandProcessor(command, commandtype)
      .then((result)=> {
        if (jpathresult != "") {
          console.log(result.data);
          console.log(jpathresult);
          result = jpath.query(JSON.parse(result.data), jpathresult)[0];
          console.log(result);
        }
        if (result == expectedresult) {
          resolve(name);
        }
        else {
          console.log(result);
          reject('Device return a different code than expected.');
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
      if (theButton.type in {'http-get':"", 'http-post':"", 'websocket':"", 'MQTT':""}) {
        if (theButton.command != undefined){ // In case the button has only one command defined
          self.commandButtonProcessor(name, deviceId, theButton.command, theButton.jpathresult, theButton.expectedresult, theButton.type)
          .then((successmessage)=>{
            self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: successmessage})
            .catch( (err) => {console.log(err)})
          })
          .catch((err) => { 
            if (theButton.fallbackButton) {
              self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: 'Trying Alternate methode.'})
              .catch( (err) => {console.log(err)})
              console.log('fallback!')
            }
            else {
              self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: err})
              .catch( (err) => {console.log(err)})
              console.log('No fallback possible!')
            }
          })
        }
        if (theButton.commands != undefined) { // in case the button has multiple commands defined
          console.log('multiple commands')
          let currentButton = self.buttonsWithMultipleCommands.find((button) => { return (button.name == name)});//getting back the last command used through the dynamic structure
          console.log(currentButton)
          if (currentButton == undefined) { // if no last command found, use the first command.
            currentButton = {'name':name,'index':0};
              self.buttonsWithMultipleCommands.push(currentButton)
          }
          console.log(theButton.commands[currentButton.index])
          self.commandButtonProcessor(name, deviceId, theButton.commands[currentButton.index], theButton.jpathresult, theButton.expectedresult, theButton.type)
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
            console.log (result);
            result = Number(result) + Number(theButton.step);
            console.log (result);
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

