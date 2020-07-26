
'use strict';

const { sliderHelper } = require("./sliderHelper");
const { directoryHelper } = require("./directoryHelper");

const http = require('http.min');
const jpath = require('jsonpath');
const wol = require('wake_on_lan');
const variablePattern = {'pre':'$','post':''};
const RESULT = variablePattern.pre + 'Result' + variablePattern.post;
const { exec } = require("child_process");
const { cachedDataVersionTag } = require('v8'); // check if needed for discovery of neeo brain and suppress otherwise.
const { labelHelper } = require("./labelHelper");

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
    if (query) {
      try {
        let temp = JSON.parse(data);
        return jpath.query(temp, query);
      }
      catch (err) {
        console.log('error ' + err + ' in JSONPATH ' + query + ' processing of :' + data)
      }
    }
    else {return data}
  }
}
class httppostProcessor {
  process (command) {
    return new Promise(function (resolve, reject) {
      console.log(command);
      if (command.post){
        http.post(command.post, command.message) 
        .then(function(result) { 
          resolve(result.data)
        })
        .catch((err) => {reject (err)})
      }
      else {reject('no post command provided or improper format')}
    })
  }
  query (data, query) {
    try {
      return jpath.query(JSON.parse(data), query);
    }
    catch (err) {
      console.log('error ' + err + ' in JSONPATH ' + query + ' processing of :' + data)
    }
  }
}
class staticProcessor {
  process (command) {
    return new Promise(function (resolve, reject) {
      resolve(command);
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
const myHttppostProcessor = new httppostProcessor();
const myCliProcessor = new cliProcessor();
const myStaticProcessor = new staticProcessor();





module.exports = function controller(driver) {
  this.buttons = driver.buttons; //structure keeping all buttons of the driver
  this.sendComponentUpdate;
  this.deviceVariables = []; //container for all device variables.
  this.labelH = []; //slider helper to store all the getter and setter of the dynamically created sliders.
  this.sliderH = []; //slider helper to store all the getter and setter of the dynamically created sliders.
  this.directoryH = []; //directory helper to store all the browse getter and setter of the dynamically created simple directories.
  this.linkedDirectoryH = []; //directory helper to store all the browse getter and setter of the dynamically created linked directories.
  this.buttonsWithMultipleCommands = []; //Memorize for each button with multiple command associated, the last command used. (useful for example for toggle buttons)
  var self = this;
   
  this.addVariable = function(name, value) {
    self.deviceVariables.push({'name':name, 'value':value, 'listeners': []});
  }

  this.addListenerVariable = function(theVariable, theFunction) {
    const listenerList = self.deviceVariables.find(elt => {return elt.name == theVariable}).listeners;
    listenerList.push(theFunction);
    return listenerList[listenerList.length-1];
  }

  this.assignValueToVariable = function(theVariable, theValue, deviceId) {//deviceId necessary as push to components.
    let foundVar = self.deviceVariables.find(elt => {return elt.name == theVariable});
    foundVar.value = theValue;
    foundVar.listeners.forEach(element => {
      element(foundVar.value, deviceId);
    });

  }

  this.assignResult = function(inputChain, givenResult)
  {
    //console.log('AssignResult on :' + inputChain)
 //   console.log((givenResult))
    if (!(typeof(givenResult) in {"string":"", "number":"", "boolean":""}) ) {//in case the response is a json object, convert to string, escape quotes
      givenResult = JSON.stringify(givenResult).replace(/"/g, '\\"').replace(/'/g, "\\'")//.replace(/(?=[()])/g, '\\');//.replace(/\(/g,"\(").replace(/\\)/g,"\\)");
      givenResult = givenResult.replace(/\\\\/g, '\\\\\\') // Absolutely necessary to properly escape the escaped character. Or super tricky bug.
    }
    if (typeof(inputChain) == 'string') {inputChain = inputChain.replace(RESULT, givenResult);}
   
    return eval(inputChain);
    //return inputChain.replace(RESULT, givenResult);
  }

  this.assignVariables = function(inputChain) {
    let preparedResult = inputChain;
    if (typeof(inputChain) == 'string')
    {
      self.deviceVariables.forEach(variable => {
        let token = variablePattern.pre + variable.name + variablePattern.post;
        preparedResult = preparedResult.replace(token, variable.value);
      })
    }
    console.log('Chain Assigned : ' + preparedResult)
    return preparedResult;
  }

  this.addLabelHelper = function(labelName, listened) {//function called by the MetaDriver to store 
    const newLabelH = new labelHelper(labelName, listened, self)
    self.labelH.push(newLabelH);
    return newLabelH;
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
  
  this.commandProcessor = function(command, commandtype) { // process any command according to the target protocole
    return new Promise(function (resolve, reject) {
      if (commandtype == 'http-get') {
        processingManager.processor = myHttpgetProcessor;
      } 
      else if (commandtype == 'http-post') {
        processingManager.processor = myHttppostProcessor;
      }
      else if (commandtype == 'static') {
        processingManager.processor = myStaticProcessor;
      }
      else if (commandtype == 'cli') {
        processingManager.processor = myCliProcessor;
      }
      else {reject('The commandtype is not defined.' + commandtype + ' command : ' + command)}
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
      else if (commandtype == 'http-post') {
        processingManager.processor = myHttppostProcessor;
      }
      else if (commandtype == 'static') {
        processingManager.processor = myStaticProcessor;
      }
      else if (commandtype == 'cli') {
        processingManager.processor = myCliProcessor;
      }
      else {reject('commandtype not defined.')}
      //console.log('Query Processor : ' + query)
      query = self.assignVariables(query);
      //console.log('Query Processor : ' + query)
      return processingManager.query(data, query);
  }
/*
  this.displayStatus = function (deviceId, message) {

    self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: message})
    .catch( (err) => {console.log ("Message was " + message + " - Error generated is : " + err)})
    setTimeout(() => {
      self.sendComponentUpdate({uniqueDeviceId: deviceId, component: 'Status',value: 'Ready'})
      .catch( (err) => {console.log ("Message was " + message + " - Error generated is : " + err)})
    }, 3000);

  }
*/
  
  this.evalWrite = function (evalwrite, result, deviceId) {
    console.log('EVALWRITE!!!!!!!!!!!!!')
    console.log(evalwrite)
    if (evalwrite) { //case we want to write inside a variable
      evalwrite.forEach(evalW => {
        console.log(evalW);
        //process the value
        let finalValue = self.assignVariables(evalW.value);
        finalValue = self.assignResult(finalValue, result);
        self.assignValueToVariable(evalW.variable, finalValue, deviceId);       
      });
    }
  }

  this.evalDo = function (evaldo, result, deviceId) {
    if (evaldo) { //case we want to trigger a button
      evaldo.forEach(evalD => {
        console.log('test value : ' + evalD.test);
        if (evalD.test == '' || evalD.test == true) {evalD.test = true}; //in case of no test, go to the do function
        let finalDoTest = self.assignVariables(evalD.test);// prepare the test to assign variable and be evaluated.
        console.log('finaldo :' + finalDoTest)
        finalDoTest = self.assignResult(finalDoTest, result);
        console.log('test value final : ' + finalDoTest);
        if (finalDoTest) {
          if (evalD.then && evalD.then != '')
          {
           self.onButtonPressed(evalD.then, deviceId);
          }
        }
        else { 
          if (evalD.or && evalD.or != '')
          {
            self.onButtonPressed(evalD.or, deviceId)
          }
        }
       })
    }
  }

  this.commandButtonProcessor = function (name, deviceId, commandtype, command, queryresult, evaldo, evalwrite) {
    return new Promise(function (resolve, reject) {
      try {
        console.log(command+commandtype)
        self.commandProcessor(command, commandtype)
        .then((result) => {
          console.log(result)
          if (queryresult != "") {// Case we want to parse the result
            console.log('Query :' + queryresult);
            result = self.queryProcessor(result, queryresult, commandtype)[0];
            console.log(result);
          }
           
          self.evalWrite(evalwrite, result, deviceId);
          
          self.evalDo(evaldo, result, deviceId);
    
          resolve(result);
        })
        .catch((result) => { //if the command doesn't work.
          result = 'Command failed:' + result;
          self.evalWrite(evalwrite, result, deviceId);
          self.evalDo(evaldo, result, deviceId);
          resolve('Error during the post command processing' + result)
        }) 
      }
      catch {reject('Error while processing the command.')}
    })
  }
  
  this.onButtonPressed = function(name, deviceId) {
    console.log('[CONTROLLER]' + name + ' button pressed for device ' + deviceId);
    let theButton = self.buttons[name];
    console.log(theButton)
    if (theButton != undefined) {
      if (theButton.type in {'http-get':"", 'http-post':"", "static":"", 'websocket':"", 'MQTT':"", 'cli':""}) {
        if (theButton.command != undefined){ // In case the button has only one command defined
          self.commandButtonProcessor(name, deviceId, theButton.type, theButton.command, theButton.queryresult, theButton.evaldo, theButton.evalwrite)
          .then((result)=>{
            console.log('Processed: '+result)
          })
          .catch((err) => { 
              console.log("Error when processing the command : " + err)
           })
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
            console.log('Success')
            // done sending packets
          }
        });
        var magic_packet = wol.createMagicPacket(theButton.command);
      }
    }
  }
}

