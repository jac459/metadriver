
'use strict';

const { imageHelper } = require("./imageHelper");
const { labelHelper } = require("./labelHelper");
const { switchHelper } = require("./switchHelper");
const { sensorHelper } = require("./sensorHelper");
const { sliderHelper } = require("./sliderHelper");
const { directoryHelper } = require("./directoryHelper");
const { builtHelperName, getDeviceIdFromBuiltName, getBuiltNameSeparator, getNameFromBuiltName} = require("./helpers");

const { cachedDataVersionTag } = require('v8'); // check if needed for discovery of neeo brain and suppress otherwise.
const { resolve } = require("path");

const { exec } = require("child_process");
const { spawn } = require("child_process").spawn;
const xpath = require('xpath');
const xmldom = require('xmldom').DOMParser;
const parserXMLString = require('xml2js').Parser({explicitArray:false, mergeAttrs : true});
const http = require('http.min');
const jpath = require('jsonpath');
const io = require('socket.io-client');
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
const NDJSONTCP = 'ndjsontcp';
const WOL = 'wol';
const DEFAULT = 'default'; //NEEO SDK deviceId default value
const rpc = require('json-rpc2');
const lodash = require('lodash');



//STRATEGY DESIGN PATTERN FOR THE COMMAND TO BE USED (HTTPGET, post, websocket, ...) New processor to be added here. This strategy mix both transport and data format (json, soap, ...)
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
  initiate(connection) {
    return new Promise( (resolve, reject) => {
      this._processor.initiate(connection)
      .then((result) => {resolve(result)})
      .catch((err) => reject (err))
    })
  }
  process(params) {
    return new Promise( (resolve, reject) => {
      this._processor.process(params)
      .then((result) => {resolve(result)})
      .catch((err) => reject (err))
    })
  }
  query(params) {
    return this._processor.query(params)
  }
  startListen (params, deviceId) {
    return this._processor.startListen(params, deviceId)
  }
  stopListen (params) {
    return this._processor.stopListen(params)
  }
  wrapUp(connection) {
    return new Promise( (resolve, reject) => {
      this._processor.wrapUp(connection)
      .then((result) => {resolve(result)})
      .catch((err) => reject (err))
    })
  }
}
class httpgetProcessor {
  constructor() {
  }; 
  process (params) {
    return new Promise(function (resolve, reject) {
      http(params.command) 
      .then(function(result) { 
        resolve(result.data)
      })
      .catch((err) => {
        reject (err)})
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
      if (params.query) {
        try {
          if (typeof(params.data) == 'string') {params.data = JSON.parse(params.data)}
          resolve(jpath.query(params.data, params.query));
        }
        catch (err) {
          console.log('error ' + err + ' in JSONPATH ' + params.query + ' processing of :' + params.data)
        }
      }
      else {resolve(params.data)}
    })
  }
  startListen (params, deviceId) {
    return new Promise(function (resolve, reject) {
        let previousResult = '';
        clearInterval(params.listener.timer);
        params.listener.timer = setInterval(() => {
          http(params.command) 
          .then(function(result) { 
            if (result != previousResult) {
              previousResult = result;
              params._listenCallback(result, params.listener, deviceId);
            }
            resolve('');
          })
          .catch((err) => {console.log(err)})
        }, (params.listener.pooltime?params.listener.pooltime:1000));
        if (params.listener.poolduration && (params.listener.poolduration != '')) {
            setTimeout(() => {
              clearInterval(params.listener.timer)
            }, params.listener.poolduration);
        }
    })
  }
  stopListen (params) {
    clearInterval(params.timer);
  }
}
class webSocketProcessor {
  initiate (connection) {
    return new Promise(function (resolve, reject) {
      try {
        if (connection.connector != "" && connection.connector != undefined) {
          connection.connector.close();
        } //to avoid opening multiple
        connection.connector = io.connect(connection.descriptor);
        resolve(connection);
      }
      catch (err) {
        console.log('Error while intenting connection to the target device.')
        console.log(err)
      }
    })//to avoid opening multiple
  }
  process (params) {
    return new Promise(function (resolve, reject) {
      if (typeof(params.command) == 'string') {params.command = JSON.parse(params.command)}
      if (params.command.call){
        params.connection.connector.emit(params.command.call, params.command.message);
        resolve('');
      }
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
      try {
        if (params.query) {
          resolve(jpath.query(params.data, params.query));
        }
        else {
          resolve(params.data);
        }
      }
      catch (err) {
        console.log('error ' + err + ' in JSONPATH ' + params.query + ' processing of :' + params.data)
      }
    })
  }
  startListen (params, deviceId) {
    return new Promise(function (resolve, reject) {
        params.connection.connector.on(params.command, (result) => {params._listenCallback(result, params.listener, deviceId)});
        resolve('');
   })
  }
  stopListen (params) {
  }
  wrapUp (connection) {
    return new Promise(function (resolve, reject) {
      if (connection.connector != "" && connection.connector != undefined) {
        connection.connector.close();
      } 
      resolve(connection);
    })
  }
}

class ndjsontcpProcessor {
  initiate (connection) {
    return new Promise(function (resolve, reject) {
      //if (connection.connector == "" || connection.connector == undefined) {
        rpc.SocketConnection.$include({
          write: function($super, data) {
            return $super(data + "\r\n");
          },
          call: function($super, method, params, callback) {
            if (!lodash.isArray(params) && !lodash.isObject(params)) {
              params = [params];
            }
            `A`
            var id = null;
            if (lodash.isFunction(callback)) {
              id = ++this.latestId;
              this.callbacks[id] = callback;
            }
        
            var data = JSON.stringify({jsonrpc: '2.0', method : method, params : params, id : id});
            this.write(data);
          }
       });
      let mySocket = rpc.Client.$create(1705, connection.descriptor, null, null);
      mySocket.connectSocket(function (err, conn){
        if (err) {
          console.log('Error connecting to the target device.');
          console.log(err); 
        }
        if (conn) {connection.connector = conn; console.log('connection to the device successful')
          resolve(connection)
        }
      })
      //} //to avoid opening multiple
    })
  }
  process (params) {
    return new Promise(function (resolve, reject) {
      if (typeof(params.command) == 'string') {params.command = JSON.parse(params.command)}
      
      if (params.command.call){
        params.connection.connector.call(params.command.call, params.command.message, function(err, result){
          if (err) {console.log(err)}
          resolve(result);
        });
      
      }
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
      try {
        if (params.query) {
          resolve(jpath.query(params.data, params.query));
        }
        else {
          resolve(params.data);
        }
      }
      catch (err) {
        console.log('error ' + err + ' in JSONPATH ' + params.query + ' processing of :' + params.data)
      }
    })
  }
  startListen (params, deviceId) {
    return new Promise(function (resolve, reject) {
      let previousResult = '';
      clearInterval(params.listener.timer);
      params.listener.timer = setInterval(() => {
        if (params.command.call){
          params.connection.connector.call(params.command.call, params.command.message, function(err, result){
            if (err) {console.log(err)}
            if (result != previousResult) {
              previousResult = result;
              params._listenCallback(result, params.listener, deviceId);
            }
          });
        
        }
       resolve('');
      }, (params.listener.pooltime?params.listener.pooltime:1000));
      if (params.listener.poolduration && (params.listener.poolduration != '')) {
          setTimeout(() => {
            clearInterval(params.listener.timer)
          }, params.listener.poolduration);
      }
      console.log(params)
      if (typeof(params.command) == 'string') {params.command = JSON.parse(params.command)}
      
    })
  }
  stopListen (params) {
    console.log('Stop listening to the device.')
//    TODO stop listening
//    listener.io.disconnect(listener.socket);
  }
}

function convertXMLTable2JSON (TableXML, indent, TableJSON) {
  return new Promise(function (resolve, reject) {
      parserXMLString.parseStringPromise(TableXML[indent]).then((result) => {
      if (result) {
        TableJSON.push(result)
        indent = indent + 1;
        if (indent < TableXML.length) {
          resolve(convertXMLTable2JSON(TableXML,indent,TableJSON))
        }
        else 
        {
          resolve(TableJSON);
        }
        
      }
      else {
        console.log(err);
      }
    });
  })
}

class httpgetSoapProcessor {
  process (params) {
    return new Promise(function (resolve, reject) {
      http(params.command) 
      .then(function(result) { 
        resolve(result.data)
      })
      .catch((err) => {reject (err)})
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
      if (params.query) {
        try {
          //console.log('RAW XPATH Return elt 0: ' + data);
          var doc = new xmldom().parseFromString(params.data);
          //console.log('RAW XPATH Return elt 0.1: ' + doc);
          //console.log('RAW XPATH Return elt 0.1: ' + query);
          var nodes = xpath.select(params.query, doc);
          //console.log('RAW XPATH Return elt : ' + nodes);
          //console.log('RAW XPATH Return elt 2: ' + nodes.toString());
          let JSonResult = [];
          convertXMLTable2JSON(nodes, 0, JSonResult).then((result) => {
            console.log('Result of conversion +> ');
            console.log(result);
            resolve(result)
          })
        }
        catch (err) {
          console.log('error ' + err + ' in XPATH ' + params.query + ' processing of :' + params.data)
        }
      }
      else {resolve(params.data)}
    })
  }
  listen (params) {
    return '';
  }
}
class httppostProcessor {
  process (params) {
    return new Promise(function (resolve, reject) {
      if (typeof(params.command) == 'string') {params.command = JSON.parse(params.command)}
      if (params.command.call){
        http.post(params.command.call, params.command.message) 
        .then(function(result) { 
          resolve(result.data)
        })
        .catch((err) => {console.log("Error in the post command: "); console.log(err);reject (err)})
      }
      else {reject('no post command provided or improper format')}
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
      try {
        resolve(jpath.query(JSON.parse(params.data), params.query));
      }
      catch (err) {
        console.log('error ' + err + ' in JSONPATH ' + params.query + ' processing of :' + params.data)
      }
    })
  }
  listen (params) {
    return '';
  }
}
class staticProcessor {
  process (params) {
    return new Promise(function (resolve, reject) {
      resolve(params.command);
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
        try {
          if (params.query && params.query != '') {
            resolve(jpath.query(JSON.parse(params.data), params.query));
          }
          else {
            if (params.data != '') {
              resolve(JSON.parse(params.data))
            }
            else {resolve()}
          }
        }
        catch {
          console.log('error in JSONPATH ' + params.query + ' processing of :' + params.data)
        }
    })
  }
  listen (params) {
    return '';
  }
}
class cliProcessor {
  process (params) {
    return new Promise(function (resolve, reject) {
        exec(params.command, (stdout, stderr) => {
          if (stdout) {
            resolve(stdout);
          }
          else {
            resolve(stderr);
          }
        })
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
      try {
        //let resultArray = new [];
        resolve(params.data.split(params.query));
      }
      catch {
        console.log('error in string.search regex :' + params.query + ' processing of :' + params.data)
      }
    })
  }
  listen (params) {
    return '';
  }
}
class cliIProcessor {
  process (params) {
    return new Promise(function (resolve, reject) {
      if (params.interactiveCLIProcess) {
        console.log('call interactive')
        params.interactiveCLIProcess.stdin.write(params.command + '\n');
        console.log('call interactive done');
        resolve('Finished ' + params.command)
      }
    })
  }
  query (params) {
    return new Promise(function (resolve, reject) {
      try {
        //let resultArray = new [];
        resolve(params.data.split(params.query));
      }
      catch {
        console.log('error in string.search regex :' + params.query + ' processing of :' + params.data)
      }
    })
  }
  listen (params) {
    return '';
  }
}

const processingManager = new ProcessingManager();
const myHttpgetProcessor = new httpgetProcessor();
const myHttpgetSoapProcessor = new httpgetSoapProcessor();
const myHttppostProcessor = new httppostProcessor();
const myCliProcessor = new cliProcessor();
const myCliIProcessor = new cliIProcessor();
const myStaticProcessor = new staticProcessor();
const myWebSocketProcessor = new webSocketProcessor();
const myNdjsontcpProcessor = new ndjsontcpProcessor();

module.exports = function controller(driver) {
  this.buttons = []; //structure keeping all buttons of the driver
  this.sendComponentUpdate;
  this.name = driver.name;
  this.deviceVariables = []; //container for all device variables.
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

  this.addButton = function(name, value) {
    self.buttons.push({"name":name,"value":value});
  }

  this.addVariable = function(name, value) {
    if (self.deviceVariables.findIndex(myVar => {myVar.name == name}) < 0) {//to avoid adding multiple times a listener
      self.deviceVariables.push({'name':name, 'value':value, 'listeners': []});
   }
  }

  this.addListenerVariable = function(theVariable, theFunction, deviceId) { // who listen to variable changes.
    try {
      if (theVariable != undefined && theVariable != '' && theFunction != undefined && theFunction) {
        let listenerList = self.deviceVariables.find(elt => {return elt.name == builtHelperName(theVariable, deviceId)}).listeners; 
        if (listenerList.findIndex(func => {func.call == theFunction}) < 0) {//to avoid adding multiple times a listener
          
          listenerList.push({"deviceId" : deviceId, "call" : theFunction});
          return listenerList[listenerList.length-1];
        }
      }
      else {return undefined};
    }
    catch (err) {
      console.log("It seems that you haven\'t created the variable yet");
      console.log(err)
    }
  }

  this.addImageHelper = function(imageName, listened) {//function called by the MetaDriver to store 
    const newImageH = new imageHelper(imageName, listened, self)
    self.imageH.push(newImageH);
    return newImageH;
  }
  
  this.addLabelHelper = function(labelName, listened, actionListened) {//function called by the MetaDriver to store 
    const newLabelH = new labelHelper(labelName, listened, self, actionListened)
    self.labelH.push(newLabelH);
    return newLabelH;
  }

  this.addSensorHelper = function(sensorName, listened) {//function called by the MetaDriver to store 
    const newSensorH = new sensorHelper(sensorName, listened, self)
    self.sensorH.push(newSensorH);
    return newSensorH;
  }

  this.addSwitchHelper = function(switchName, listen, evaldo) {//function called by the MetaDriver to store 
    const newSwitchH = new switchHelper(switchName, listen, evaldo, self)
    self.switchH.push(newSwitchH);
    return newSwitchH;
  }

  this.addSliderHelper = function(listen, evaldo, slidername) {//function called by the MetaDriver to store 
    const newSliderH = new sliderHelper(listen, evaldo, slidername, self)
    self.sliderH.push(newSliderH);
    return newSliderH;
  }

  this.addDirectoryHelper = function(dirname) {//function called by the MetaDriver to store the features of the list 
    const newDirectoryH = new directoryHelper(dirname, self)
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
  

  this.writeVariable = function(theVariable, theValue, deviceId) {//deviceId necessary as push to components.
    let foundVar = self.deviceVariables.find(elt => {return elt.name == builtHelperName(theVariable, deviceId)});
        
    if (foundVar.value != theValue) {// If the value changed.
      foundVar.value = theValue; //Write value here
      foundVar.listeners.forEach(element => { //invoke all listeners
        if (element.deviceId == deviceId) {
          element.call(deviceId, foundVar.value);
        }
      });
    }
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


  this.readVariables = function(inputChain, deviceId) { //replace in the input chain, all the variables found.
    let preparedResult = inputChain;
    if (typeof(preparedResult) == 'object') {
      preparedResult = JSON.stringify(preparedResult);
    }
    if (typeof(preparedResult) == 'string')
      self.deviceVariables.forEach(variable => {
        if (variable.name.startsWith(deviceId+getBuiltNameSeparator())) {//we get the full name including the deviceId
          let token = variablePattern.pre + getNameFromBuiltName(variable.name);//get only the name variable
          while (preparedResult != preparedResult.replace(token, variable.value)) {
            preparedResult = preparedResult.replace(token, variable.value);
          }
        }
    })
     return preparedResult;
  }

   
  this.evalWrite = function (evalwrite, result, deviceId) {
    if (evalwrite) { //case we want to write inside a variable
      evalwrite.forEach(evalW => {
        //process the value
        let finalValue = self.readVariables(evalW.value, deviceId);
        finalValue = self.assignTo(RESULT, finalValue, result);
        self.writeVariable(evalW.variable, finalValue, deviceId); 
      });
    }
  }

    this.evalDo = function (evaldo, result, deviceId) {
    if (evaldo) { //case we want to trigger a button
      evaldo.forEach(evalD => {
        if (evalD.test == '' || evalD.test == true) {evalD.test = true}; //in case of no test, go to the do function
        let finalDoTest = self.readVariables(evalD.test, deviceId);// prepare the test to assign variable and be evaluated.
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
    else if (commandtype == NDJSONTCP) {
      processingManager.processor = myNdjsontcpProcessor;
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
      command = self.readVariables(command, deviceId);
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
      
      command = self.readVariables(command, deviceId);
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
      query = self.readVariables(query, deviceId);
      let params = {'query' : query, 'data' : data}
      processingManager.query(params).then((data) => {
          resolve(data)
        })
    })
  }
 
  this.onListenExecute = function (result, listener, deviceId) {
    process.stdout.write('.');  
    self.queryProcessor(result, listener.queryresult, listener.type, deviceId).then((result) => {
      if (Array.isArray(result)) {
        result = result[0];
      }
      console.log(result)
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
  
  this.actionManager = function (name, deviceId, commandtype, command, queryresult, evaldo, evalwrite) {
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
        if (getDeviceIdFromBuiltName(listener.name) == deviceId) {
          console.log('Starting this listener ' + listener.name + ' for ' + deviceId)
          self.listenStart(listener, deviceId);
        }
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
    let theButton = self.buttons[self.buttons.findIndex((button) => {return button.name ==  builtHelperName(name,deviceId)})].value;
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

