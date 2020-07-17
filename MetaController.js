
'use strict';
const http = require('http.min');
const jpath = require('jsonpath');
const neeoapi = require('neeo-sdk');
const { cachedDataVersionTag } = require('v8');
const settings = require(__dirname + '/settings');

function directoryHelper (command, actioncommand, jpathstatus, directoryname, preurl, posturl, jpathimage, controller) {
  this.command = command;
  this.actioncommand = actioncommand;
  this.directoryname = directoryname;
  var self = this;
  this.browse = {
      getter: (deviceId, params) => this.fetchList(deviceId, params),
      action: (deviceId, params) => this.handleAction(deviceId, params),
  };  
  
  this.fetchList = function (deviceId, params) { 
    let neeoList;
    let dataList;
    let imageList;
    return new Promise(function (resolve, reject) {
      http(self.command)
      .then(function(result) { 
        console.log(result.data);
        dataList = jpath.query(JSON.parse(result.data), jpathstatus);
        console.log(dataList);
        console.log(jpathimage)
        if (jpathimage != '' && jpathimage != undefined) {
          imageList = jpath.query(JSON.parse(result.data), jpathimage);
          console.log(imageList)
        }
        neeoList = neeoapi.buildBrowseList({
          title: self.directoryname,
          totalMatchingItems: dataList.length,
          limit: dataList.length,
          offset: 0,
          browseIdentifier: 'browseEverything',
          uiAction : 'close'
        })
      })
      .then(function() { 
        var i;
        for (i = 0; i<dataList.length; i++) {
            if (preurl != "") {
              console.log(preurl+dataList[i]+posturl);
              neeoList.addListItem({
                title : dataList[i] , label: directoryname, 
                thumbnailUri: preurl+dataList[i]+posturl,
                actionIdentifier : dataList[i]
              })
            }
            else if (jpathimage != "" && jpathimage != undefined) {
              neeoList.addListItem({
                title : dataList[i] , label: directoryname, 
                thumbnailUri: imageList[i],
                actionIdentifier : dataList[i]
              })
            }
            else {
              neeoList.addListItem({
                title : dataList[i] , label: directoryname, 
                actionIdentifier : dataList[i]
              })
            }
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
     http(self.actioncommand+params.actionIdentifier)
     .then(function(result) { console.log('ok')})
     .catch(function(err) {reject(err)})
     })
  }

}

function sliderHelper (min,max,command, statuscommand, jpathstatus, slidername, controller) {
  this.min = min;
  this.max = max;
  this.command = command;
  this.statuscommand = statuscommand;
  this.slidername = slidername;
  var self = this;

  this.toDeviceValue = function (value) { //range converter between target device range and slider range
    return Math.round(self.min+(self.max-self.min)*value/100)
  }

  this.toSliderValue = function (value) { //range converter between target device range and slider range
    return Math.round(100*(value-self.min)/(self.max-self.min))
  }

  this.get = function () { 
     return new Promise(function (resolve, reject) {
      http(self.statuscommand)
      .then(function(result) { resolve(jpath.query(JSON.parse(result.data), jpathstatus)[0])})
      .catch(function(err) {reject(err)})
    })
  }

  this.set = function (deviceId, newValue) {
    let range = self.max - self.min;
    http(self.command+self.toDeviceValue(newValue)) // set the slider to the same range than the target device
    .then(function(result) { 
      controller.sendComponentUpdate({uniqueDeviceId: deviceId,component: slidername,value: newValue})
        .catch( (err) => {console.log(err)})  
      controller.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: Math.round(self.min+range*newValue/100)})
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
   
  this.addSliderHelper = function(min,max,command, statuscommand, jpathstatus, slidername) {//function called by the MetaDriver to store 
    const newSliderH = new sliderHelper(min,max,command, statuscommand, jpathstatus, slidername, self)
    self.sliderH.push(newSliderH);
    return newSliderH;
  }

  this.addDirectoryHelper = function(command, actioncommand, jpathstatus, directoryname, preurl, posturl, jpathimage) {//function called by the MetaDriver to store 
    const newDirectoryH = new directoryHelper(command, actioncommand, jpathstatus, directoryname, preurl, posturl, jpathimage, self)
    self.directoryH.push(newDirectoryH);
    console.log('sputik')
    return newDirectoryH;
  }


  this.registerStateUpdateCallback = function(updateFunction) {//technical function to send event to the remote.
    self.sendComponentUpdate = updateFunction;
  };
  
  this.getStatus = function() {
    return '';
  }

  this.onButtonPressed = function(name, deviceId) {
    console.log('[CONTROLLER]' + name + ' button pressed for device ' + deviceId);
    let theButton = self.buttons[name];
     if (theButton != undefined) {
      if (theButton.type == 'http-get') {
        if (theButton.command != undefined){ // In case the button has only one command defined
          http(theButton.command) 
            .then(function(result) { 
             console.log( theButton)
              if (theButton.jpathresult != "") {
                console.log(result.data);
                console.log(theButton.jpathresult);
                result = jpath.query(JSON.parse(result.data), theButton.jpathresult)[0];
                console.log(result);
              }
               if (result == theButton.expectedresult) {
                self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: name})
                .catch( (err) => {console.log(err)})
              }
              else {
                console.log(result);
                self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: result})
                .catch( (err) => {console.log(err)})
              }
            }) 
            .catch(function(err){ console.log(err);})
        }
        if (theButton.commands != undefined) { // in case the button has multiple commands defined
          let currentButton = self.buttonsWithMultipleCommands.find((button) => { return (button.name == name)});
          console.log(currentButton)
          if (currentButton == undefined) {
            currentButton = {'name':name,'index':0};
              self.buttonsWithMultipleCommands.push(currentButton)
          }
          console.log(theButton.commands[currentButton.index])
          if (theButton.type == 'http-get') { 
            http(theButton.commands[currentButton.index]) 
            .then(function(result) { 
              if (result.data == theButton.expectedresult) {
                self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: name})
                .catch( (err) => {console.log(err)})
              }
              else {
                self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: result.data})
                .catch( (err) => {console.log(err)})
              }
            }) 
            .catch(function(err){ console.log(err);})
          }
          currentButton.index = (currentButton.index<theButton.commands.length-1) ? currentButton.index+1 : 0; //go to next command
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
    }
  }
}

