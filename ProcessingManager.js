const { exec } = require("child_process");
const xpath = require('xpath');
const path = require('path');
const http = require('http.min');
const { JSONPath } = require ('jsonpath-plus');
const io = require('socket.io-client');
const rpc = require('json-rpc2');
const lodash = require('lodash');
const { parserXMLString, xmldom } = require("./metaController");
const got = require('got');
const Net = require('net');
const Promise = require('bluebird');

const CONSTANTS =  {KEY_DELAY: 100,
  CONNECTION_STATE: {
    DISCONNECTED: 0,
    CONNECTING: 1,
    AUTHENTICATING: 2,
    AUTHENTICATED: 3,
    CONNECTED: 4
  }}

const settings = require(path.join(__dirname,'settings'));
//const { connect } = require("socket.io-client");
const WebSocket = require('ws');
var socket = "";


//LOGGING SETUP AND WRAPPING
//Disable the NEEO library console warning.
const { metaMessage, LOG_TYPE } = require("./metaMessage");
console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
function metaLog(message) {
  let initMessage = { component:'processingManager', type:LOG_TYPE.INFO, content:'', deviceId: null };
  let myMessage = {...initMessage, ...message}
  return metaMessage (myMessage);
} 

//STRATEGY FOR THE COMMAND TO BE USED (HTTPGET, post, websocket, ...) New processor to be added here. This strategy mix both transport and data format (json, soap, ...)
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
    return new Promise((resolve, reject) => {
      this._processor.initiate(connection)
        .then((result) => resolve(result))
        .catch((err) => reject(err))
    });
  }
  process(params) {
    return new Promise((resolve, reject) => {
      this._processor.process(params)
        .then((result) => { resolve(result); })
        .catch((err) => reject(err));
    });
  }
  query(params) {
    return this._processor.query(params);
  }
  startListen(params, deviceId) {
    return this._processor.startListen(params, deviceId);
  }
  stopListen(params) {
    return this._processor.stopListen(params);
  }
  wrapUp(connection) {
    return new Promise((resolve, reject) => {
      this._processor.wrapUp(connection)
        .then((result) => { resolve(result); })
        .catch((err) => reject(err));
    });
  }
}
exports.ProcessingManager = ProcessingManager;

class httprestProcessor {
  constructor() {
  };
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      try {
        if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
        if (params.command.verb == 'post') {
          got.post(params.command.call, {json:params.command.message, responseType: 'json'})
         .then((response) => {
            resolve(response.body);
          })
          .catch((err) => {
            metaLog({type:LOG_TYPE.ERROR, content:'Post request didn\'t work : '});
            metaLog({type:LOG_TYPE.ERROR, content:params});
            metaLog({type:LOG_TYPE.ERROR, content:err});
            reject(err);
          });
        }
        else if (params.command.verb == 'put') {
          metaLog({type:LOG_TYPE.VERBOSE, content:'Put http request. Final address:'});
          metaLog({type:LOG_TYPE.VERBOSE, content:params.command.call});
          got.put(params.command.call, {json:params.command.message, responseType: 'json'})
          .then((response) => {
            resolve(response.body[0]);
          })
          .catch((err) => {
            metaLog({type:LOG_TYPE.ERROR, content:'Put request didn\'t work : '});
            metaLog({type:LOG_TYPE.ERROR, content:params});
            metaLog({type:LOG_TYPE.ERROR, content:err});
            reject(err);
          });
        }
        else if (params.command.verb == 'get') {
          got(params.command.call)
          .then(function (result) {
            metaLog({type:LOG_TYPE.VERBOSE, content:'result of Request Get before query result, request size and content'});
            metaLog({type:LOG_TYPE.VERBOSE, content:result.body.length});
            metaLog({type:LOG_TYPE.VERBOSE, content:result.body});
            resolve(result.body);
          })
          .catch((err) => {
            reject(err);
          });
        }
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:'Meta Error during the rest command processing'});
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
     });
    }
    query(params) {
      return new Promise(function (resolve, reject) {
        if (params.query) {
          try {
            metaLog({type:LOG_TYPE.VERBOSE, content:'Rest command query processing, parameters, result JSON path: '+ JSONPath(params.query, params.data)});
            if (typeof (params.data) == 'string') { params.data = JSON.parse(params.data); }
            resolve(JSONPath(params.query, params.data));
          }
          catch (err) {
            metaLog({type:LOG_TYPE.ERROR, content:'HTTP Error ' + err + ' in JSONPATH ' + params.query + ' processing of :' + params.data});
          }
        }
        else { resolve(params.data); }
      });
    }
  startListen(params, deviceId) {
    return new Promise(function (resolve, reject) {
      let previousResult = '';
      clearInterval(params.listener.timer);
      params.listener.timer = setInterval(() => {
        http(params.command)
          .then(function (result) {
            //if (result != previousResult) {
              previousResult = result;
              params._listenCallback(result, params.listener, deviceId);
            //}
            resolve('');
          })
          .catch((err) => { metaLog({type:LOG_TYPE.ERROR, content:err});
; });
      }, (params.listener.pooltime ? params.listener.pooltime : 1000));
      if (params.listener.poolduration && (params.listener.poolduration != '')) {
        setTimeout(() => {
          clearInterval(params.listener.timer);
        }, params.listener.poolduration);
      }
    });
  }
  stopListen(params) {
    clearInterval(params.timer);
  }
}
exports.httprestProcessor = httprestProcessor;

class httpgetProcessor {

  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
process(params) {
    return new Promise(function (resolve, reject) {
      metaLog({type:LOG_TYPE.ERROR,content:"Single command"});

      got(params.command)
        .then(function (result) {
          resolve(result.body);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  query(params) {
    try {

    return new Promise(function (resolve, reject) {
      if (params.query) {
        try {
          if (typeof (params.data) == 'string') { params.data = JSON.parse(params.data); };
          resolve(JSONPath(params.query, params.data));
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
      else { resolve(params.data); }
    });
  }
  catch (err) {
    metaLog({type:LOG_TYPE.ERROR,content:"Error in ProcessingManager.js process: "+err});
  }

  }
  startListen(params, deviceId) {
    try {
    return new Promise(function (resolve, reject) {
      let previousResult = '';
      clearInterval(params.listener.timer);
      params.listener.timer = setInterval(() => {
        if (params.command == "") {resolve("")}; //for 
        http(params.command)
          .then(function (result) {
            if (result.data != previousResult) {
              previousResult = result.data;
              params._listenCallback(result.data, params.listener, deviceId);
            }
            resolve('');
          })
          .catch((err) => { 
            metaLog({type:LOG_TYPE.ERROR, content:err});
           });
        }, (params.listener.pooltime ? params.listener.pooltime : 1000));
        if (params.listener.poolduration && (params.listener.poolduration != '')) {
          setTimeout(() => {
            clearInterval(params.listener.timer);
          }, params.listener.poolduration);
        }
      });
    }
    catch (err) {
      metaLog({type:LOG_TYPE.ERROR,content:"Error in ProcessingManager.js startlisten" + err});
    }
  
    }
    stopListen(params) {
      clearInterval(params.timer);
    }
}
exports.httpgetProcessor = httpgetProcessor;
class webSocketProcessor {
  initiate() {
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
      if  (!params.connection.connections) { params.connection.connections = []};
      let connectionIndex = params.connection.connections.findIndex((con) => {return con.descriptor == params.command.connection});
      metaLog({type:LOG_TYPE.VERBOSE, content:'Connection Index:' + connectionIndex});
      metaLog({type:LOG_TYPE.DEBUG, content:params.connection.connections[connectionIndex]});
      if  (connectionIndex < 0) { //checking if connection exist
        try {
          let theConnector = new WebSocket(params.command.connection);
          params.connection.connections.push({"descriptor": params.command.connection, "connector": theConnector});
          connectionIndex = params.connection.connections.length - 1;
          theConnector.on('error', (result) => { 
            if (params.connection.connections) {
              if (params.connection.connections[connectionIndex]) {
                if (params.connection.connections[connectionIndex].connector) {
                  params.connection.connections[connectionIndex].connector.terminate();
                  params.connection.connections[connectionIndex].connector = null;
                  params.connection.connections.splice(connectionIndex, 1);
                  metaLog({type:LOG_TYPE.WARNING, content:'Error event called on the webSocket.'});
                }
              }
            }
          });
          theConnector.on('close', (result) => { 
            if (params.connection.connections) {
              if (params.connection.connections[connectionIndex]) {
                if (params.connection.connections[connectionIndex].connector) {
                  params.connection.connections[connectionIndex].connector.terminate();
                  params.connection.connections[connectionIndex].connector = null;
                  params.connection.connections.splice(connectionIndex, 1);
                  metaLog({type:LOG_TYPE.WARNING, content:'Error event called on the webSocket.'});
                }
              }
            }
          });
          theConnector.on('open', (result) => { 
            try {
              metaLog({type:LOG_TYPE.INFO, content:'Connection webSocket open.'});
              metaLog({type:LOG_TYPE.VERBOSE, content:'New Connection Index:' + connectionIndex});
              metaLog({type:LOG_TYPE.DEBUG, content:params});
            }
            catch (err) {
              metaLog({type:LOG_TYPE.WARNING, content:'Error while intenting connection to the target device.'});
              metaLog({type:LOG_TYPE.WARNING, content:err});
              
            }
          });
          resolve('');
        }
        catch (err) {
          metaLog({type:LOG_TYPE.WARNING, content:'Error while intenting connection to the target device.'});
          metaLog({type:LOG_TYPE.WARNING, content:err});
          resolve('');
        }
      }
      else if (params.command.message) {
        if (typeof (params.command.message) != 'string') {params.command.message = JSON.stringify(params.command.message)}
        try {
          metaLog({type:LOG_TYPE.VERBOSE, content:'Emitting: ' + params.command.message});
          if (params.connection.connections[connectionIndex]) {
            if (params.connection.connections[connectionIndex].connector) {
              params.connection.connections[connectionIndex].connector.send(params.command.message);
            }
          }
          resolve('');
        }
        catch (err) {
          metaLog({type:LOG_TYPE.WARNING, content:'Error while sending message to the target device.'});
          metaLog({type:LOG_TYPE.WARNING, content:err});
          if (params.connection.connections) {
            if (params.connection.connections[connectionIndex]) {
              if (params.connection.connections[connectionIndex].connector) {
                params.connection.connections[connectionIndex].connector.terminate();
                params.connection.connections[connectionIndex].connector = null;
                params.connection.connections.splice(connectionIndex, 1);
              }
            }
          }
          resolve('');
        }
      }
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      try {
        if (params.query) {
          resolve(JSONPath(params.query, params.data));
        }
        else {
          resolve(params.data);
        }
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:err});
        resolve('');
      }
    });
  }
  
  startListen(params, deviceId) {
    return new Promise(function (resolve, reject) {
      try {
        metaLog({type:LOG_TYPE.VERBOSE, content:params});
        if  (!params.connection.connections) { params.connection.connections = []};
        if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
        metaLog({type:LOG_TYPE.VERBOSE, content:'Starting to listen with this params:'});
        metaLog({type:LOG_TYPE.DEBUG, content:params});
        if (params.command.connection)
        {
          let connectionIndex = params.connection.connections.findIndex((con)=> {return con.descriptor == params.command.connection});
          if  (connectionIndex < 0) { //checking if connection exist
              try {
              let theConnector = new WebSocket(params.command.connection);
              params.connection.connections.push({"descriptor": params.command.connection, "connector": theConnector});
              connectionIndex = params.connection.connections.length - 1;
              theConnector.on('error', (result) => { 
                if (params.connection.connections) {
                  if (params.connection.connections[connectionIndex]) {
                    if (params.connection.connections[connectionIndex].connector) {
                      params.connection.connections[connectionIndex].connector.terminate();
                      params.connection.connections[connectionIndex].connector = null;
                      params.connection.connections.splice(connectionIndex, 1);
                      metaLog({type:LOG_TYPE.WARNING, content:'Error event called on the webSocket.'});
                    }
                  }
                }
              });
              theConnector.on('close', (result) => { 
                if (params.connection.connections) {
                  if (params.connection.connections[connectionIndex]) {
                    if (params.connection.connections[connectionIndex].connector) {
                      params.connection.connections[connectionIndex].connector.terminate();
                      params.connection.connections[connectionIndex].connector = null;
                      params.connection.connections.splice(connectionIndex, 1);
                      metaLog({type:LOG_TYPE.WARNING, content:'Error event called on the webSocket.'});
                    }
                  }
                }
              });
              theConnector.on('open', (result) => { 
                try {
                  metaLog({type:LOG_TYPE.INFO, content:'Connection webSocket open.'});
                  metaLog({type:LOG_TYPE.VERBOSE, content:'New Connection Index:' + connectionIndex});
                  metaLog({type:LOG_TYPE.DEBUG, content:params});
                  params.connection.connections[connectionIndex].connector.on((params.command.message?params.command.message:'message'), (result) => { params._listenCallback(result, params.listener, deviceId); });
                }
                catch (err) {
                  metaLog({type:LOG_TYPE.WARNING, content:'Error while intenting connection to the target device.'});
                  metaLog({type:LOG_TYPE.WARNING, content:err});
                  
                }
              });
              resolve('');
            }
            catch (err) {
              metaLog({type:LOG_TYPE.WARNING, content:'Error while intenting connection to the target device.'});
              metaLog({type:LOG_TYPE.WARNING, content:err});
              resolve('');
            }
          }
          else { //checking if connection exist
            try {
              if (params.connection.connections[connectionIndex]) {
                if (params.connection.connections[connectionIndex].connector) {
                  params.connection.connections[connectionIndex].connector.on((params.command.message?params.command.message:'message'), (result) => { params._listenCallback(result, params.listener, deviceId); });
                }
              }
            }
            catch (err) {
              metaLog({type:LOG_TYPE.ERROR, content:'Error while intenting connection to the target device.'});
              metaLog({type:LOG_TYPE.ERROR, content:err});
              resolve('');
            }
          }
   
        resolve('');
        }  
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:'Error with listener configuration.'});
        metaLog({type:LOG_TYPE.ERROR, content:err});
        resolve('');
      }

    });
  }
  stopListen(params) {
 
  }
  wrapUp(connection) { 
      connection.connections.forEach(myCon => {
        myCon.connector.terminate();
        myCon.connector = null;
      });
      connection.connections = undefined;
   }
}
exports.webSocketProcessor = webSocketProcessor;
class socketIOProcessor {

  initiate(connection) {
   
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      if  (!params.connection.connections) { params.connection.connections = []};
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
      let connectionIndex = params.connection.connections.findIndex((con) => {return con.descriptor == params.command.connection});
      metaLog({type:LOG_TYPE.VERBOSE, content:'Connection Index:' + connectionIndex});
      metaLog({type:LOG_TYPE.VERBOSE, content:params.connection.connections[connectionIndex]});

      if  (connectionIndex < 0) { //checking if connection exist
        try {
          //  if (params.command.connection != "" && params.command.connection != undefined) {
          //    connection.connector.close();
          //  } //to avoid opening multiple
          params.connection.connections.push({"descriptor": params.command.connection, "connector":io.connect(params.command.connection)});
          connectionIndex = params.connection.connections.length - 1;
          metaLog({type:LOG_TYPE.VERBOSE, content:'New Connection Index:' + connectionIndex});
          metaLog({type:LOG_TYPE.DEBUG, content:params});
            }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'Error while intenting connection to the target device.'});
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
      if (params.command.message.call) {
        metaLog({type:LOG_TYPE.VERBOSE, content:'Emitting: ' + params.command.message.call});
        params.connection.connections[connectionIndex].connector.emit(params.command.message.call, params.command.message.message);
        resolve('');
      }
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      try {
        if (params.query) {
          resolve(JSONPath(params.query, params.data));
        }
        else {
          resolve(params.data);
        }
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    });
  }
  startListen(params, deviceId) {
    return new Promise(function (resolve, reject) {
      if  (!params.connection.connections) { params.connection.connections = []};
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
      metaLog({type:LOG_TYPE.VERBOSE, content:'Starting to listen with this params:'});
      metaLog({type:LOG_TYPE.DEBUG, content:params});
      if (params.command.connection)
      {
        let connectionIndex = params.connection.connections.findIndex((con)=> {return con.descriptor == params.command.connection});
        if  (connectionIndex < 1) { //checking if connection exist
          try {
            params.connection.connections.push({"descriptor": params.command.connection, "connector":io.connect(params.command.connection)});
            connectionIndex = params.connection.connections.length - 1;
          }
          catch (err) {
            metaLog({type:LOG_TYPE.ERROR, content:'Error while intenting connection to the target device.'});
            metaLog({type:LOG_TYPE.ERROR, content:err});
          }
        }
        metaLog({type:LOG_TYPE.VERBOSE, content:'listening with this params:' + connectionIndex});
        metaLog({type:LOG_TYPE.DEBUG, content:params});
        params.connection.connections[connectionIndex].connector.on(params.command.message, (result) => { params._listenCallback(result, params.listener, deviceId); });
      }  
      resolve('');

    });
  }
  stopListen(params) {
  }
  wrapUp(connection) {
    return new Promise(function (resolve, reject) {
      if (connection.connector != "" && connection.connector != undefined) {
        connection.connector.close();
      }
      resolve(connection);
    });
  }
}
exports.socketIOProcessor = socketIOProcessor;


class netsocketProcessor {
  constructor() {
    this.currentPowerState = false;
		this.modelName = 'modelName';
		this.modelDescription = 'modelDescription';
    this.Restarting = false;
    this.RestartTimer;
		// This keeps an array of digits, to make it possible to send just one 'command' for changing to channel e.g. "311" instead of 3 seperate connections.
		this.channelSelectTimer = null;
		this.channelDigits = [];
  };

  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
  Hex2Bin(s) {
    return Buffer.from(s, 'hex')
    //return new Buffer(s, "hex");
  }
    

  sendBinary(socket,data) {
    try {
      socket.write(data);
    }
  catch (err) {metaLog({type:LOG_TYPE.ERROR, content:err});}
  } 

process(params) {


  var _this = this;
  metaLog({type:LOG_TYPE.VERBOSE, content:'Process netSocket:' + params});

  try {
    if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
    if  (!params.connection.connections) { params.connection.connections = []};
    let connectionIndex = params.connection.connections.findIndex((con) => {return con.descriptor == params.command.connection});


    if  (connectionIndex < 0) { //checking if connection exist
        let theConnector =   new Net.Socket(); 
        params.connection.connections.push({"descriptor": params.command.connection, "connector": theConnector});
        connectionIndex = params.connection.connections.length - 1;
        let theresult = params.connection.connections[connectionIndex].connector.connect(params.command.port, params.command.connection);
        metaLog({type:LOG_TYPE.DEBUG, content:theresult});

      }


//        if (this.connectionState == CONSTANTS.CONNECTION_STATE.DISCONNECTED) {
//          this.disconnected('BOX_CONNECTION_CLOSED');
//          return;
//        }

  if (params.command.message == "RESETDRIVER") 
      this.startListen(params)
    else
    if (params.command.format == "HEX2BIN") {
      metaLog({type:LOG_TYPE.VERBOSE,content:"Sending Hex2Bin data:" + params.command.message});
      this.sendBinary(params.connection.connections[connectionIndex].connector,this.Hex2Bin(params.command.message));
    }
    else { 
      metaLog({type:LOG_TYPE.VERBOSE,content:"Sending ASCII data: " + params.command.message});
      this.sendBinary(params.connection.connections[connectionIndex].connector,params.command.message);
    }
  }
  catch (err) {console.log("Process error",err)}
  return '';
}

query(params) {
  try {

    return new Promise(function (resolve, reject) {
      if (params.query) {
        try {
          if (typeof (params.data) == 'string') { params.data = JSON.parse(params.data); };
          resolve(JSONPath(params.query, params.data));
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
      else { resolve(params.data); }
    });
  }
  catch (err) {
    metaLog({type:LOG_TYPE.ERROR,content:"Error in ProcessingManager.js process: "+err});
  }

}
startListen(params, deviceId) {
  var _this = this;
  var connectionIndex ;
  return new Promise(function (resolve, reject) {
    try {
        metaLog({type:LOG_TYPE.VERBOSE, content:'Starting to listen NetSocket with this params:'});
        metaLog({type:LOG_TYPE.VERBOSE, content:params});

        if  (!params.connection.connections) { params.connection.connections = []};

        if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
        if ((!params.command.connection)||(params.command.connection==""))
            {metaLog({type:LOG_TYPE.ERROR, content:'Connection requires field connection in command'});
            reject('');
        }

        connectionIndex = params.connection.connections.findIndex((con)=> {return con.descriptor == params.command.connection});
        if  (connectionIndex < 0) { //checking if connection exist
          metaLog({type:LOG_TYPE.VERBOSE, content:'Connection was not yet defined, doing so now'});
          params.connection.connections.push({"descriptor": params.command.connection, "connector": new Net.Socket()});
          connectionIndex = params.connection.connections.length - 1;

          if (params.command.errorhandling == "yes") {
            metaLog({type:LOG_TYPE.VERBOSE, content:'Error handling within meta.'});
            params.connection.connections[connectionIndex].connector.on('error', (result) => { 
              metaLog({type:LOG_TYPE.ERROR, content:'Error event called on the netSocket, closing it.'});
            });
            metaLog({type:LOG_TYPE.VERBOSE, content:'Error handler set.'});

            params.connection.connections[connectionIndex].connector.on('close', (result) => { 
              if (params.connection.connections) {
                if (params.connection.connections[connectionIndex]) {
                  if (params.connection.connections[connectionIndex].connector) {
                    metaLog({type:LOG_TYPE.ERROR, content:'Close event called on the webSocket.'});
                    _this.Restarting = true;
                    _this.RestartTimer = setTimeout(() => {
                      metaLog({type:LOG_TYPE.VERBOSE, content:'Restarting connection listener ' + params.command.connection});
                      params.connection.connections[connectionIndex].connector.connect(params.command.port, params.command.connection);
                    }, 250);
                  }
                }
              }
            });
            metaLog({type:LOG_TYPE.VERBOSE, content:'Close handler set.'});
          }

          // Data handler
          params.connection.connections[connectionIndex].connector.on('data', (result) => { 
            if (_this.Restarting) {
              metaLog({type:LOG_TYPE.ERROR, content:'Remove timer for reconnect.'});
              clearTimeout(_this.RestartTimer);
                _this.Restarting = false;
              }
          });
  
          // Open handler
          params.connection.connections[connectionIndex].connector.on('open', (result) => { 
              metaLog({type:LOG_TYPE.VERBOSE, content:'Connection netSocket open.'});
          });
  
          metaLog({type:LOG_TYPE.VERBOSE, content:'Connecting to ' + params.command.connection});
          params.connection.connections[connectionIndex].connector.connect(params.command.port, params.command.connection);
          metaLog({type:LOG_TYPE.VERBOSE, content:'Connection done'});
          metaLog({type:LOG_TYPE.VERBOSE, content: params.connection.connections[connectionIndex].connector});
        }

        try {
      //  if (params.connection.connections[connectionIndex].connector.message) {
          metaLog({type:LOG_TYPE.VERBOSE, content:'Subscribing to:' + params.command.message});                  
          params.connection.connections[connectionIndex].connector.on(params.command.message, (result) => { 
              metaLog({type:LOG_TYPE.VERBOSE, content:'Triggered on:' + params.command.message});                  

              metaLog({type:LOG_TYPE.DEBUG, content:'Result:' +  result});  
              metaLog({type:LOG_TYPE.DEBUG, content:'listener:' +  params.listener});  
              params._listenCallback(result.toString(), params.listener, deviceId); });
          metaLog({type:LOG_TYPE.VERBOSE, content:'Subscribed to:' + params.command.message});    
              
            }
            catch (err) {
                metaLog({type:LOG_TYPE.ERROR, content:'Error while setting up '+ params.command.message + ' subscription.'});
                metaLog({type:LOG_TYPE.ERROR, content:err});
                resolve('');
            }
                
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'Error while intenting connection to the target device.'});
          metaLog({type:LOG_TYPE.ERROR, content:err});
          resolve('');
        }
          
        resolve('');
      });
  }
  wrapUp(connection) { 
        connection.connections.forEach(myCon => {
          myCon.connector.terminate();
          myCon.connector = null;
        });
        connection.connections = undefined;
  }
  
    
  stopListen(params) {
      clearInterval(params.timer);
  }
}
exports.NetSocketProcessor = netsocketProcessor;


class jsontcpProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      //if (connection.connector == "" || connection.connector == undefined) {
      rpc.SocketConnection.$include({
        write: function ($super, data) {
          return $super(data + "\r\n");
        },
        call: function ($super, method, params, callback) {
          if (!lodash.isArray(params) && !lodash.isObject(params)) {
            params = [params];
          }
          `A`;
          var id = null;
          if (lodash.isFunction(callback)) {
            id = ++this.latestId;
            this.callbacks[id] = callback;
          }

          var data = JSON.stringify({ jsonrpc: '2.0', method: method, params: params, id: id });
          this.write(data);
        }
      });
      let mySocket = rpc.Client.$create(1705, connection.descriptor, null, null);
      mySocket.connectSocket(function (err, conn) {
        if (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'Error connecting to the target device.'});
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
        if (conn) {
          connection.connector = conn; 
          metaLog({type:LOG_TYPE.VERBOSE, content:'Connection to the JSONTCP device successful'});
          resolve(connection);
        }
      });
      //} //to avoid opening multiple
    });
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }

      if (params.command.call) {
        params.connection.connector.call(params.command.call, params.command.message, function (err, result) {
          if (err) { 
            metaLog({type:LOG_TYPE.ERROR, content:err});
          }
          resolve(result);
        });

      }
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      try {
        if (params.query) {
          resolve(JSONPath(params.query, params.data));
        }
        else {
          resolve(params.data);
        }
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    });
  }
  startListen(params, deviceId) {
    return new Promise(function (resolve, reject) {
      params.socketIO.on(params.command, (result) => { params._listenCallback(result, params.listener, deviceId); });
      resolve('');
    });
  }
  stopListen(params) {
    metaLog({type:LOG_TYPE.INFO, content:'Stop listening to the device.'});
  }
}
exports.jsontcpProcessor = jsontcpProcessor;
function convertXMLTable2JSON(TableXML, indent, TableJSON) {
  return new Promise(function (resolve, reject) {
    parserXMLString.parseStringPromise(TableXML[indent]).then((result) => {
      if (result) {
        TableJSON.push(result);
        indent = indent + 1;
        if (indent < TableXML.length) {
          resolve(convertXMLTable2JSON(TableXML, indent, TableJSON));
        }
        else {
          resolve(TableJSON);
        }

      }
      else {
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    });
  });
}
class httpgetSoapProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }  
  process(params) {
    return new Promise(function (resolve, reject) {
      http(params.command)
        .then(function (result) {
          resolve(result.data);
        })
        .catch((err) => { reject(err); });
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      if (params.query) {
        try {
          var doc = new xmldom().parseFromString(params.data);
          //console.log('RAW XPATH Return elt 0.1: ' + doc);
          //console.log('RAW XPATH Return elt 0.1: ' + query);
          var nodes = xpath.select(params.query, doc);
          //console.log('RAW XPATH Return elt : ' + nodes);
          //console.log('RAW XPATH Return elt 2: ' + nodes.toString());
          let JSonResult = [];
          convertXMLTable2JSON(nodes, 0, JSonResult).then((result) => {
   //         console.log('Result of conversion +> ');
     //       console.log(result);
            resolve(result);
          });
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
      else { resolve(params.data); }
    });
  }
  listen(params) {
    return '';
  }
}
exports.httpgetSoapProcessor = httpgetSoapProcessor;
class httppostProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
      if (params.command.call) {
        http.post(params.command.call, params.command.message)
          .then(function (result) {
            resolve(result.data);
          })
          .catch((err) => {  metaLog({type:LOG_TYPE.ERROR, content:err});reject(err); });
      }
      else { reject('no post command provided or improper format'); }
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      try {
        resolve(JSONPath(params.query, JSON.parse(params.data)));
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    });
  }
  listen(params) {
    return '';
  }
}
exports.httppostProcessor = httppostProcessor;
class staticProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      resolve(params.command);
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      try {
        if (params.query != undefined  && params.query != '') {
          resolve(JSONPath(params.query, JSON.parse(params.data)));
        }
        else {
          if (params.data != undefined) {
            if (typeof(params.data) == string){
              resolve(JSON.parse(params.data));
            }
            else 
            {
              resolve(params.data)
            }
          }
          else { resolve(); }
        }
      }
      catch {
        metaLog({type:LOG_TYPE.INFO, content:'Value is not JSON after processed by query: ' + params.query + ' returning as text:' + params.data});
        resolve(params.data)
      }
    });
  }
  startListen(params, deviceId) {
    return new Promise(function (resolve, reject) {
      clearInterval(params.listener.timer);
      params.listener.timer = setInterval(() => {
        params._listenCallback(params.command, params.listener, deviceId);
        resolve(params.command)
      }, (params.listener.pooltime ? params.listener.pooltime : 1000));
      if (params.listener.poolduration && (params.listener.poolduration != '')) {
        setTimeout(() => {
          clearInterval(params.listener.timer);
        }, params.listener.poolduration);
      }
    });
  }
  stopListen(listener) {
    clearInterval(listener.timer);
  }
}
exports.staticProcessor = staticProcessor;
class cliProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      exec(params.command, (stdout, stderr) => {
        if (stdout) {
          resolve(stdout);
        }
        else {
          resolve(stderr);
        }
      });
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      try {
        //let resultArray = new [];
        if (params.query!=undefined) {
          if (params.query!="") {
            let literal = params.query.slice(params.query.indexOf('/')+1, params.query.lastIndexOf('/'));
            let modifier = params.query.slice(params.query.lastIndexOf('/')+1);
            metaLog({type:LOG_TYPE.VERBOSE, content:"RegEx literal : " + literal + ", regEx modifier : " + modifier});
            let regularEx = new RegExp(literal, modifier);
           // let result = params.data.toString().match(regularEx);
           // if (result != null) {
              resolve(params.data.toString().match(regularEx));
           // }
           // else {
           //   resolve();
           // }
          }
          else {
            resolve(params.data.toString())
          }
        }
        else {resolve();}
      }
      catch {
        metaLog({type:LOG_TYPE.ERROR, content:'error in string.match regex :' + params.query + ' processing of :' + params.data});
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    });
  }
  listen(params) {
    return '';
  }
}
exports.cliProcessor = cliProcessor;
class replProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      try {
        if (connection.connector != "" && connection.connector != undefined) {
          connection.connector.close();
        } //to avoid opening multiple
        connection.connector = io.connect(connection.descriptor);
        resolve(connection);
      }
      catch (err) {
        metaLog({type:LOG_TYPE.ERROR, content:'Error while intenting connection to the target device.'});
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    });
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      if (params.interactiveCLIProcess) {
        params.interactiveCLIProcess.stdin.write(params.command + '\n');
        resolve('Finished ' + params.command);
      }
    });
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      try {
        //let resultArray = new [];
        resolve(params.data.split(params.query));
      }
      catch {
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    });
  }
  listen(params) {
    return '';
  }
}
exports.replProcessor = replProcessor;
function UnsubscribeMQTT(params,TheTopic) {
  params.connection.connector.unsubscribe(TheTopic);
  for (const key in params.connection.connector.messageIdToTopic) {
    for (let i = 0; i < params.connection.connector.messageIdToTopic[key].length; i++) {
      let elem = params.connection.connector.messageIdToTopic[key][i]
      if (elem == TheTopic)  params.connection.connector.messageIdToTopic[key].splice(i, 1);
    }
    if (params.connection.connector.messageIdToTopic[key].length<=0) delete params.connection.connector.messageIdToTopic[key] 
  }
  metaLog({type:LOG_TYPE.INFO, content :"Done unsubscribing, subscriptions are now:"})
  metaLog({type:LOG_TYPE.DEBUG, content : params.connection.connector.messageIdToTopic});

}
function HandleMQTTIncoming(GetThisTopic,params,topic,message){

  metaLog({type:LOG_TYPE.VERBOSE, content:'Topic received : ' + topic.toString()});
  metaLog({type:LOG_TYPE.VERBOSE, content:'Message received : ' + message.toString()});
  metaLog({type:LOG_TYPE.VERBOSE, content:'Looking for topic : ' + GetThisTopic});

  var RcvdTopicPart = topic.split("/"),i;
  var ParamsTopicPart = GetThisTopic.split("/");
  var Matched = true; 

  for (i = 0; i < RcvdTopicPart.length; i++) {
    if (ParamsTopicPart.length < i) {   // Does the topic we received have less sections than asked for?
      Matched=false;
      break;                      // Yes, it is not a match
    }
    if (ParamsTopicPart[i]=="#") {      // Full-Wildcard placed in this section, so exit compare-loop now
       Matched=true;
       break;
     }
     if (ParamsTopicPart[i]=="+")  {    // Section-wildcard placed in this section, so continue compare-loop now
        continue;
      }
    if (ParamsTopicPart[i]!=RcvdTopicPart[i]) {
      Matched=false;
      break;
    }
  }  
  if (Matched) {
    let GotMyMessage = false;         // check if we are still subscribed to this topic (duplicates)
    metaLog({type:LOG_TYPE.VERBOSE, content:'Topic match: ' + topic.toString()});
    /*for (const key in params.connection.connector.messageIdToTopic) {
        if (GetThisTopic == params.connection.connector.messageIdToTopic[key])
           GotMyMessage=true;
    }*/
    return(Matched);
  }

}

class mqttProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {


      resolve('');
      //nothing to do, it is done globally.
      //connection.connector = mqttClient;
    }); 
  } 
  OnMessage (topic, message,packet) {
    let Matched = HandleMQTTIncoming(GetThisTopic,params,topic,message);
    if (Matched) {
      metaLog({type:LOG_TYPE.VERBOSE, content:"We have a message " + topic.toString() + " "  + message.toString()});
      clearTimeout(t);
      UnsubscribeMQTT(params,GetThisTopic);
      resolve("{\"topic\": \""+ topic.toString()+ "\",\"message\" : " +message.toString()+"}");                          
    } 

  }
  foo() {
    console.log("foo")
  }
  process (params) {
/*    try {
      if (process.mylistener == undefined) {
        process.mylistener = "";

        // Test to see how many "on message" handlers are activated by default (should be 4)
        console.log("Event Handlers for message are now:",params.connection.connector._events.message.length);
        params.connection.connector.on('message', this.foo); //add one on('message' handlers (makes 5)
        params.connection.connector.on('message', this.foo); //=> 6 
        params.connection.connector.on('message', this.foo); //=> 7
        params.connection.connector.on('message', this.foo); //=8
        console.log("Event Handlers for message are now:",params.connection.connector._events.message.length); // should be 8
         params.connection.connector.off('message', this.foo); // should remove one, result goes to =>7
         params.connection.connector.off('message', this.foo); // =>6
         params.connection.connector.off('message', this.foo); // =>7
         params.connection.connector.off('message', this.foo); / => 4
         console.log("Event Handlers for message are now:",params.connection.connector._events.message.length); // All should be removed
        // This works great for a statically defined function:  emitter.off(eventName, listener), where listener is a static function like foo
        // BUT.... we use "on the fly defined functions": params.connection.connector.on('message', FUNCTION (topic, message,packet) {
        // and obviously node.js matches the function provided with the emitter.off with his internal list..... and won;t find a match

        // possible solutions: Use statically defined functions/methods with (on message' 
        // So, why "emitter.remove==>ALL<==listeners? "

      }

      if (process.mylistener!="") { 
        process.mylistener.removeListener('message', function () {console.log("remove message handler as removelistener")});
        console.log("Event Handlers for message are now:",params.connection.connector._events.message.length);
      }
//      var rawlisteners = params.connection.connector.removeAllListeners("message")
 //     console.log("raw",rawlisteners)
        //params.connection.connector.off();
    }
    catch (err){console.log("error in off",err) }*/
    return new Promise(function (resolve, reject) {
      metaLog({type:LOG_TYPE.INFO, content:'MQTT Processing'});
      metaLog({type:LOG_TYPE.DEBUG, content:params.command});
      params.command = JSON.parse(params.command);

      if ((params.command.replytopic)||(params.command.topic&&!params.command.message)) {//here we get a value from a topic
        let GetThisTopic = params.command.topic;
        //console.log("We need to get a message from",GetThisTopic)
        if (params.command.replytopic)
          GetThisTopic = params.command.replytopic;   
          metaLog({type:LOG_TYPE.VERBOSE, content:"Subscribing to " + GetThisTopic });     
        params.connection.connector.subscribe(GetThisTopic);

        var t = setTimeout(() => {
          UnsubscribeMQTT(params,GetThisTopic);
          metaLog({type:LOG_TYPE.ERROR, content:'Timeout waiting for MQTT-topic ' + GetThisTopic});
          reject('');
        }, (params.command.timeout ? params.command.timeout  : 10000));


        metaLog({type:LOG_TYPE.INFO, content:'Add message handler'});  
        process.mylistener = params.connection.connector.on('message', function (topic, message,packet) {
          let Matched = HandleMQTTIncoming(GetThisTopic,params,topic,message);
          if (Matched) {
            metaLog({type:LOG_TYPE.INFO, content:'Add message handler'});  
            metaLog({type:LOG_TYPE.VERBOSE, content:"We have a message " + topic.toString() + " "  + message.toString()});
            clearTimeout(t);
            UnsubscribeMQTT(params,GetThisTopic);
            resolve("{\"topic\": \""+ topic.toString()+ "\",\"message\" : " +message.toString()+"}");                          
          }        
        })
      }

      if (params.command.message) {// here we publish into a topic
        metaLog({type:LOG_TYPE.INFO, content:'MQTT publishing ' + params.command.message + ' to ' + settings.mqtt_topic + params.command.topic + ' with options : ' + params.command.options});
        try {
          params.connection.connector.publish(params.command.topic, params.command.message, (params.command.options ? JSON.parse(params.command.options) : ""));
          if (params.command.replytopic== undefined) //Only resolve when not waiting on response
            resolve('');
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'Meta found an error processing the MQTT command'});
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
      else {
        metaLog({type:LOG_TYPE.ERROR, content:"Meta Error: Your command MQTT seems incorrect"});
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }

    })
 // }
 // catch (err) {
 //   metaLog({type:LOG_TYPE.ERROR,content:"Error in ProcessingManager.js MQTT-process: "+err});
 // }
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      if (params.query) {
        metaLog({type:LOG_TYPE.VERBOSE, content:"MQTT params.query and data"});
        metaLog({type:LOG_TYPE.DEBUG, content:params.query});
        metaLog({type:LOG_TYPE.DEBUG, content:params.data});
        try {
          if (typeof (params.data) == 'string') { params.data = JSON.parse(params.data); }
          resolve(JSONPath(params.query, params.data));
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'error ' + err + ' in JSONPATH ' + params.query + ' processing of :'});
          metaLog({type:LOG_TYPE.ERROR, content:params.data});
        }
      }
      else { resolve(params.data); }
    });
  }
  startListen(params, deviceId) {

    return new Promise(function (resolve, reject) {
      metaLog({type:LOG_TYPE.VERBOSE, content:'startlisten'  });

      params.connection.connector.subscribe(params.command, (result) => {metaLog({type:LOG_TYPE.VERBOSE, content:'Subscription MQTT : '+ result})});
      params.connection.connector.on('message', function (topic, message,packet) {
      let  Matched = HandleMQTTIncoming(params.command,params,topic,message);
        if (Matched) {  
          params._listenCallback("{\"topic\": \""+ topic.toString()+ "\",\"message\" : " +message.toString()+"}", params.listener, deviceId);
        }
      });
      resolve('');
    });
  }
  stopListen(params) {
    metaLog({type:LOG_TYPE.INFO, content:'Stop listening to the MQTT device.'});
  };
  wrapUp(connection) {
    return new Promise(function (resolve, reject) {
      resolve(connection);
    });
  };
}
exports.mqttProcessor = mqttProcessor;

