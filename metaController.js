
'use strict';
const path = require('path');
const { imageHelper } = require(path.join(__dirname,"imageHelper"));
const { labelHelper } = require(path.join(__dirname,"labelHelper"));
const { switchHelper } = require(path.join(__dirname,"switchHelper"));
const { sensorHelper } = require(path.join(__dirname,"sensorHelper"));
const { sliderHelper } = require(path.join(__dirname,"sliderHelper"));
const { directoryHelper } = require(path.join(__dirname,"directoryHelper"));
const { variablesVault } = require(path.join(__dirname,"variablesVault"));

const { cachedDataVersionTag } = require('v8'); // check if needed for discovery of neeo brain and suppress otherwise.
const { resolve } = require("path");

const { spawn } = require("child_process").spawn;

const wol = require('wake_on_lan');
const { isArray } = require("util");
const variablePattern = {'pre':'$','post':''};
const RESULT = variablePattern.pre + 'Result' + variablePattern.post;
const HTTPGET = 'http-get';
const HTTPGETSOAP = 'http-get-soap';
const HTTPPOST = 'http-post';
const STATIC = 'static';
const CLI = 'cli';
const CLIInt = 'cli-i';
const WEBSOCKET = 'webSocket';
const JSONTCP = 'jsontcp';
const WOL = 'wol';
const DEFAULT = 'default'; //NEEO SDK deviceId default value
const { ProcessingManager, httpgetProcessor, httpgetSoapProcessor, httppostProcessor, cliProcessor, cliIProcessor, staticProcessor, webSocketProcessor, jsontcpProcessor } = require("./ProcessingManager");

const processingManager = new ProcessingManager();
const myHttpgetProcessor = new httpgetProcessor();
const myHttpgetSoapProcessor = new httpgetSoapProcessor();
const myHttppostProcessor = new httppostProcessor();
const myCliProcessor = new cliProcessor();
const myCliIProcessor = new cliIProcessor();
const myStaticProcessor = new staticProcessor();
const myWebSocketProcessor = new webSocketProcessor();
const myJsontcpProcessor = new jsontcpProcessor();

module.exports = function controller(driver) {
  this.buttons = []; //structure keeping all buttons of the driver
  this.sendComponentUpdate;
  this.name = driver.name;
  this.vault = new variablesVault();
  this.listeners = []; //container for all device listeners.
  this.connectionH = []; //helper for all connections.
  this.imageH = []; //image helper to store all the getter of the dynamically created images.
  this.sensorH = []; //sensor helper to store all the getter and setter of the dynamically created sensors.
  this.switchH = []; //sensor switch to store all the getter and setter of the dynamically created switches.
  this.labelH = []; //label helper to store all the getter and setter of the dynamically created labels.
  this.sliderH = []; //slider helper to store all the getter and setter of the dynamically created sliders.
  this.directoryH = []; //directory helper to store all the browse getter and setter of the dynamically created simple directories.
  var self = this;
   
  this.assignDiscoverHubController = function (theHubController) {//Assign the hub in order to send it the notifications
    self.sendComponentUpdate = theHubController.sendComponentUpdate;
    self.connectionH = theHubController.connectionH;
  }
 
  this.addListener = function(params) {
    self.listeners.push(params);
  }

  this.addConnection = function(params) {
    self.connectionH.push(params);
  }

  this.addButton = function(deviceId, name, value) {
    self.buttons.push({"deviceId":deviceId, "name":name,"value":value});
  }

  this.addImageHelper = function(deviceId, imageName, listened) {//function called by the MetaDriver to store 
    const newImageH = new imageHelper(deviceId, imageName, listened, self)
    self.imageH.push(newImageH);
    return newImageH;
  }
  
  this.addLabelHelper = function(deviceId, labelName, listened, actionListened) {//function called by the MetaDriver to store 
    const newLabelH = new labelHelper(deviceId, labelName, listened, self, actionListened)
    self.labelH.push(newLabelH);
    return newLabelH;
  }

  this.addSensorHelper = function(deviceId, sensorName, listened) {//function called by the MetaDriver to store 
    const newSensorH = new sensorHelper(deviceId, sensorName, listened, self)
    self.sensorH.push(newSensorH);
    return newSensorH;
  }

  this.addSwitchHelper = function(deviceId, switchName, listen, evaldo) {//function called by the MetaDriver to store 
    const newSwitchH = new switchHelper(deviceId, switchName, listen, evaldo, self)
    self.switchH.push(newSwitchH);
    return newSwitchH;
  }

  this.addSliderHelper = function(deviceId, listen, evaldo, slidername) {//function called by the MetaDriver to store 
    const newSliderH = new sliderHelper(deviceId, listen, evaldo, slidername, self)
    self.sliderH.push(newSliderH);
    return newSliderH;
  }

  this.addDirectoryHelper = function(deviceId, dirname) {//function called by the MetaDriver to store the features of the list 
    const newDirectoryH = new directoryHelper(deviceId, dirname, self)
    self.directoryH.push(newDirectoryH);
    return newDirectoryH;
  }

  this.registerStateUpdateCallback = function(updateFunction) {//technical function to send event to the remote.
    console.log('Component update registered for ' + self.name)
    self.sendComponentUpdate = updateFunction;
  };

  this.dynamicallyAssignSubscription = function(deviceId) {
    console.log('dynamicallyAssignSubscription')
    //  self.registerInitiationCallback(self.discoverHubController.updateFunction);
    //self.discoverHubController.updateFunction
    
  }

   this.registerInitiationCallback = function() {//technical function called at device initiation to start some listeners
    console.log('registerInitiationCallback')
  
  }
 
  this.assignTo = function(Pattern, inputChain, givenResult) //Assign a value to the input chain. Pattern found is replaced by given value
  {
   try {
      if (givenResult && !(typeof(givenResult) in {"string":"", "number":"", "boolean":""}) ) {//in case the response is a json object, convert to string
        givenResult = JSON.stringify(givenResult);
      }
     
      if (typeof(inputChain) == 'string') {
        if (inputChain.startsWith('DYNAMIK ')) {
          if (givenResult && (typeof(givenResult) == 'string' )) {
            givenResult = givenResult.replace(/\\/g, '\\\\') // Absolutely necessary to properly escape the escaped character. Or super tricky bug.
            givenResult = givenResult.replace(/"/g, '\\"') // Absolutely necessary to properly escape the escaped character. Or super tricky bug.
          }
          while (inputChain != inputChain.replace(Pattern, givenResult)) {
            inputChain = inputChain.replace(Pattern, givenResult);
          }
          return eval(inputChain.split('DYNAMIK ')[1]);
        }
        else {
          inputChain = inputChain.replace(Pattern, givenResult);
          return inputChain;
        }
      }
      return inputChain;
    }
    catch (err) {
      console.log('META found an error in the DYNAMIK Function created with ('+Pattern+', '+inputChain+', '+givenResult+'). Error: ');
      console.log(err);
    }
  }

  
  this.evalWrite = function (evalwrite, result, deviceId) {
    if (evalwrite) { //case we want to write inside a variable
      evalwrite.forEach(evalW => {
        //process the value
        let finalValue = self.vault.readVariables(evalW.value, deviceId);
        finalValue = self.assignTo(RESULT, finalValue, result);
        self.vault.writeVariable(evalW.variable, finalValue, deviceId); 
      });
    }
  }

    this.evalDo = function (evaldo, result, deviceId) {
    if (evaldo) { //case we want to trigger a button
      evaldo.forEach(evalD => {
        if (evalD.test == '' || evalD.test == true) {evalD.test = true}; //in case of no test, go to the do function
        let finalDoTest = self.vault.readVariables(evalD.test, deviceId);// prepare the test to assign variable and be evaluated.
        finalDoTest = self.assignTo(RESULT, finalDoTest, result);
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

  this.reInitVariablesValues = function(deviceId) {//it is to make sure that all variable have been interpreted after the register process
    self.vault.variables.forEach(element => {
      element.value = self.vault.readVariables(element.value, deviceId); 
    });
  }

  this.reInitConnectionsValues = function(deviceId) {//it is to make sure that all variable have been interpreted after the register process
    self.connectionH.forEach(element => {
      element.descriptor = self.vault.readVariables(element.descriptor, deviceId); 
     });
  }

  this.getConnection = function(commandtype) {
    return self.connectionH[self.connectionH.findIndex((item) => { return (item.name==commandtype) })];
  }

  this.assignProcessor = function(commandtype) {
    if (commandtype == HTTPGET) {
      processingManager.processor = myHttpgetProcessor;
    } 
    else if (commandtype == HTTPGETSOAP) {
      processingManager.processor = myHttpgetSoapProcessor;
    } 
    else if (commandtype == HTTPPOST) {
      processingManager.processor = myHttppostProcessor;
    }
    else if (commandtype == STATIC) {
      processingManager.processor = myStaticProcessor;
    }
    else if (commandtype == CLI) {
      processingManager.processor = myCliProcessor;
    }
    else if (commandtype == CLIInt) {
      processingManager.processor = myCliIProcessor;
    }
    else if (commandtype == WEBSOCKET) {
      processingManager.processor = myWebSocketProcessor;
    }
    else if (commandtype == JSONTCP) {
      processingManager.processor = myJsontcpProcessor;
    }
    else {console.log('Error in meta settings: The commandtype to process is not defined.' + commandtype)};
  }

  this.initiateProcessor = function(commandtype) { // Initiate communication protocoles
    return new Promise(function (resolve, reject) {
      self.assignProcessor(commandtype); //to get the correct processing manager.
      processingManager.initiate(self.getConnection(commandtype))
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {console.log('Error during initiation with commandtype : ' + commandtype);console.log(err);reject (err)})
    })    
  }

  this.wrapUpProcessor = function(commandtype) { // close communication protocoles
    return new Promise(function (resolve, reject) {

      self.assignProcessor(commandtype); //to get the correct processing manager.
      processingManager.wrapUp(self.getConnection(commandtype))
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {reject (err)})
    })    
  }

  
  this.commandProcessor = function(command, commandtype, deviceId) { // process any command according to the target protocole
    return new Promise(function (resolve, reject) {
     
      self.assignProcessor(commandtype);
      let connection = self.getConnection(commandtype);
      command = self.vault.readVariables(command, deviceId);
      command = self.assignTo(RESULT, command, "");
      let params = {'command' : command, 'connection' : connection};
      processingManager.process(params)
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {reject (err)})
    })    
  }

  this.listenProcessor = function(command, commandtype, listener, deviceId) { // process any command according to the target protocole
    return new Promise(function (resolve, reject) {

      self.assignProcessor(commandtype);
      let connection = self.getConnection(commandtype);
      
      command = self.vault.readVariables(command, deviceId);
      let params = {'command' : command, 'listener' : listener, '_listenCallback' : self.onListenExecute, 'connection' : connection};
      processingManager.startListen(params, deviceId)
        .then((result) => {
           resolve(result)
        })
        .catch((err) => {reject (err)})
    })    
  }

  this.stopListenProcessor = function(listener) { // process any command according to the target protocole
    return new Promise(function (resolve, reject) {
      self.assignProcessor(listener.type);
      processingManager.stopListen(listener);
    })    
  }

  this.queryProcessor = function (data, query, commandtype, deviceId) { // process any command according to the target protocole
    return new Promise(function (resolve, reject) {
     
      self.assignProcessor(commandtype);
      //console.log('Query Processor : ' + query)
      query = self.vault.readVariables(query, deviceId);
      let params = {'query' : query, 'data' : data}
      processingManager.query(params).then((data) => {
          resolve(data)
        })
    })
  }
 
  this.onListenExecute = function (result, listener, deviceId) {
    process.stdout.write('.');  
    self.queryProcessor(result, listener.queryresult, listener.type, deviceId).then((result) => {
      //result = result[0];
      if (Array.isArray(result)) {
        result = result[0];
      }
      if (listener.evalwrite) {self.evalWrite(listener.evalwrite, result, deviceId);}
      //if (listener.evaldo) {self.evalDo(listener.evaldo, result, deviceId);}
    })
  }

  this.listenStart = function (listener, deviceId) {
    return new Promise(function (resolve, reject) {
      try {
        self.listenProcessor(listener.command, listener.type, listener, deviceId);
      } 
      catch (err) {reject('Error when starting to listen. ' + err)}
    })
  }
  
  this.actionManager = function (deviceId, commandtype, command, queryresult, evaldo, evalwrite) {
    return new Promise(function (resolve, reject) {
      try {
        console.log(command+ ' - ' + commandtype)
        self.commandProcessor(command, commandtype, deviceId)
        .then((result) => {
          self.queryProcessor(result, queryresult, commandtype, deviceId).then((result) => {
            if (Array.isArray(result)) {
              result = result[0];
            }
            if (evalwrite) {self.evalWrite(evalwrite, result, deviceId);}
            if (evaldo) {self.evalDo(evaldo, result, deviceId);}
            resolve(result);
          })
        })
        .catch((result) => { //if the command doesn't work.
          result = 'Command failed:' + result;
          if (evalwrite) {self.evalWrite(evalwrite, result, deviceId);}
          if (evaldo) {self.evalDo(evaldo, result, deviceId);}
          resolve('Error during the post command processing' + result)
        }) 
      }
      catch {reject('Error while processing the command.')}
    })
  }
  
  this.onButtonPressed = function(name, deviceId) {
    console.log('[CONTROLLER]' + name + ' button pressed for device ' + deviceId);
    if (name == "INITIALISE") {//Device resources and connection management.
      self.sliderH.forEach((helper) => {helper.initialise(deviceId)});//No need to cleanup as double addition is protected
      self.switchH.forEach((helper) => {helper.initialise(deviceId)});//No need to cleanup as double addition is protected
      self.imageH.forEach((helper) => {helper.initialise(deviceId)});//No need to cleanup as double addition is protected
      self.labelH.forEach((helper) => {helper.initialise(deviceId)});//No need to cleanup as double addition is protected
      self.sensorH.forEach((helper) => {helper.initialise(deviceId)});//No need to cleanup as double addition is protected
 
      self.connectionH.forEach(connection => {//open all driver connections type
        self.initiateProcessor(connection.name, deviceId)
      });
      
      self.listeners.forEach(listener => {
        self.listenStart(listener, deviceId);
      });



    }

    if (name == "CLEANUP") {//listener management to listen to other devices. Stop listening on power off.
      self.listeners.forEach(listener => {
        self.stopListenProcessor(listener);
      });
      self.connectionH.forEach(connection => {
        self.wrapUpProcessor(connection.name);
      });
    }
    let theButton = self.buttons[self.buttons.findIndex((button) => {return button.name ==  name && button.deviceId == deviceId})].value;
    if (theButton != undefined) {
      if (theButton.type != WOL) { //all the cases
        if (theButton.command != undefined){ 
          self.actionManager(name, deviceId, theButton.type, theButton.command, theButton.queryresult, theButton.evaldo, theButton.evalwrite)
          .then(()=>{
            console.log('Action done.')
          })
          .catch((err) => { 
              console.log("Error when processing the command : " + err)
           })
        }
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
        //var magic_packet = wol.createMagicPacket(theButton.command);
      }
    }
  }
}

