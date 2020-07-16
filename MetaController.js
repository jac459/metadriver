
'use strict';
const http = require('http.min');
const jpath = require('jsonpath');

const settings = require(__dirname + '/settings');

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
  this.sliderH = [];
  this.buttonsWithMultipleCommands = []; //Memorize for each buttons with multiple command associated, the last command used. (useful for example for toggle buttons)
  var self = this;
   
  this.addSliderHelper = function(min,max,command, statuscommand, jpathstatus, slidername) {
    const newSliderH = new sliderHelper(min,max,command, statuscommand, jpathstatus, slidername, self)
    self.sliderH.push(newSliderH);
    return newSliderH;
  }

  this.registerStateUpdateCallback = function(updateFunction) {
    self.sendComponentUpdate = updateFunction;
  };
  
  this.getStatus = function() {
  }

  this.onButtonPressed = function(name, deviceId) {
    console.log('[CONTROLLER]' + name + ' button pressed for device ' + deviceId);
    
    let theButton = self.buttons[name];
     if (theButton != undefined) {
      if (theButton.type == 'http-get') {
        if (theButton.command != undefined){ // In case the button has only one command defined
          http(theButton.command) 
            .then(function(result) { 
              if (result.data == theButton.expectedresult) {
                self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: 'Button ' + name + ' pressed successfully'})
                .catch( (err) => {console.log(err)})
              }
              else {
                self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: result.data})
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

