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
const Telnet = require('telnet-client'); 
const Promise = require('bluebird');
const mqtt = require('mqtt');

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
var mqttClient;
var  MyMQTTTopic = [""];
var MyMQTTMessage = [""];

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
    this.self = this;
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
    return new Promise((resolve, reject) => {
      this._processor.startListen(params, deviceId)
      .then((result) => { resolve(result); })
      .catch((err) => reject(err));
    });
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
class TelnetProcessor {

  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
    


process(params) {
  var _this = this;
  var theConnector
  metaLog({type:LOG_TYPE.VERBOSE, content:'Process Telnet'});
  if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }

  var connection = new Telnet()
  var cmd = "ls -al"
  // set some entries correct in input params. 
  // 1: make a url lut of host and port parms, so it can be used in findindex in connection-stack
  // 2: JSON does not support regexp's, so they need to be enclosed as strings. Here we make thenm regexp's again (unquoting)
  params.command.connection=params.command.TelnetParms.host+":"+params.command.TelnetParms.port;
  if (params.command.TelnetParms.loginPrompt) 
    params.command.TelnetParms.loginPrompt    = RegExp(params.command.TelnetParms.loginPrompt.slice(1, -1),'i');
  if (params.command.TelnetParms.passwordPrompt)
    params.command.TelnetParms.passwordPrompt = RegExp(params.command.TelnetParms.passwordPrompt.slice(1, -1),'i');
  if (params.command.TelnetParms.shellPrompt)
    params.command.TelnetParms.shellPrompt    = RegExp(params.command.TelnetParms.shellPrompt.slice(1, -1),'i');
  
  return new Promise(function (resolve, reject) {

    try {
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
      if  (!params.connection.connections) { params.connection.connections = []};
      console.log("        connectionparms are now",params.command.connection);
      let connectionIndex = params.connection.connections.findIndex((con) => {return con.descriptor == params.command.connection});
      if  (connectionIndex < 0) { //checking if connection exist
           theConnector =   new Telnet(); 
           metaLog({type:LOG_TYPE.VERBOSE, content:"Adding Telnet connector" + params.command.connection})
          params.connection.connections.push({"descriptor": params.command.connection, "connector": theConnector,"Connected":"init"});
          connectionIndex = params.connection.connections.length - 1;
      }

      if (params.connection.connections[connectionIndex].Connected == "init") {
        params.connection.connections[connectionIndex].connector.on('ready', function(prompt) {
          metaLog({type:LOG_TYPE.VERBOSE, content:"We have a telnet prompt"})
            params.connection.connections[connectionIndex].Connected = "connected"
            if (params.command.message) {
              metaLog({type:LOG_TYPE.VERBOSE, content:"Executing command" + params.command.message})
              params.connection.connections[connectionIndex].connector.exec(params.command.message, function(err, response) {
                resolve(response)
                return
              })
            }
            else
              resolve('') 
          })

          params.connection.connections[connectionIndex].connector.on('timeout', function() {
            metaLog({type:LOG_TYPE.WARNING, content:'Telnet socket timeout!'})
            params.connection.connections[connectionIndex].connector.end()
            params.connection.connections[connectionIndex].Connected = false;
            params.connection.connections[connectionIndex].Connected = "closed"
          })
          
          params.connection.connections[connectionIndex].connector.on('close', function() {
            params.connection.connections[connectionIndex].Connected = false;
            params.connection.connections[connectionIndex].Connected == "closed"
            metaLog({type:LOG_TYPE.VERBOSE, content:'Telnet connection closed'})
          })
          
          params.connection.connections[connectionIndex].connector.on('error', function(err) {
            metaLog({type:LOG_TYPE.VERBOSE, content:'Telnet connection got error'+err})
          })

          params.connection.connections[connectionIndex].Connected = "setup"
        }

      if (params.connection.connections[connectionIndex].Connected == "setup" ||
        params.connection.connections[connectionIndex].Connected == "closed" ) {
        params.connection.connections[connectionIndex].connector.connect(params.command.TelnetParms);
      }
      if (params.command.message) {
        metaLog({type:LOG_TYPE.VERBOSE, content:"Received request for message" +params.command.message + " to " +params.command.connection})
        if (params.connection.connections[connectionIndex].Connected != "connected") {
          metaLog({type:LOG_TYPE.ERROR, content:"Cannot send command, login is required"})
          reject('Cannot send command, login is required')
        }
        params.connection.connections[connectionIndex].connector.exec(params.command.message,function(err, response) {
          resolve(response);
        })
        }
        else resolve('')      
      }
    catch (err) {console.log("Process error",err)
                reject('Process error');}
  })
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
    resolve('')
  })
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
exports.TelnetProcessor = TelnetProcessor;
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
  constructor() {
    this.MyUseCount = [];
    for (var i=0;i<5;i++) {
      this.MyUseCount.push(0);
    }

  }
  initiate(connection) {
    return new Promise(function (resolve, reject) {


      resolve('');
      //nothing to do, it is done globally.
      //connection.connector = mqttClient;
    }); 
  } 

  process (params) {
    var _this = this;

    var OnMessageHandler = function OnMessageHandler (topic, message,packet) {
          try {
            let Matched = HandleMQTTIncoming(_this.GetThisTopic,params,topic,message,params.connection.connections[_this.connectionIndex].connector);
            if (Matched) {
              metaLog({type:LOG_TYPE.VERBOSE, content:"We have a message with matchin topic in process " + topic.toString() + " "  + message.toString()});
              clearTimeout(_this.Timer);
              UnsubscribeMQTT(params,_this.GetThisTopic);
              _this.MyUseCount[_this.connectionIndex]--;
              if (!_this.MyUseCount[_this.connectionIndex] ) {
                params.connection.connections[_this.connectionIndex].connector.off('message',OnMessageHandler); 
              }
              _this.CheckOnMessage=false;
              _this.promiseResolve("{\"topic\": \""+ topic.toString()+ "\",\"message\" : " +message.toString()+"}");                          
            }
          }  
          catch (err) {
            metaLog({type:LOG_TYPE.ERROR,content:"Error in ProcessingManager.js MQTT-process: "+err});
          }
        }   
        console.log("MQTT-Process 1") 

    return new Promise(function (resolve, reject) {
      _this.promiseResolve = resolve;
      _this.promiseReject  = reject;
    try {
      metaLog({type:LOG_TYPE.VERBOSE, content:'MQTT Processing'});
      metaLog({type:LOG_TYPE.DEBUG, content:params.command});
      params.command = JSON.parse(params.command);
      if  (!params.connection.connections) { params.connection.connections = []};
      _this.connectionIndex = params.connection.connections.findIndex((con) => {return con.descriptor == params.command.connection});
      metaLog({type:LOG_TYPE.VERBOSE, content:'Connection Index:' + _this.connectionIndex});
      metaLog({type:LOG_TYPE.DEBUG, content:params.connection.connections[_this.connectionIndex]});
    } 
    catch (err) {metaLog({type:LOG_TYPE.ERROR, content:'Error init MQTT-connection ' + err});}
      if  (_this.connectionIndex < 0) { //checking if connection exist
        try {
          let MQTT_IP = (params.command.connection)?'mqtt:'+params.command.connection:'mqtt://'+ settings.mqtt
          metaLog({type:LOG_TYPE.VERBOSE, content:'Connecting MQTT on: ' + MQTT_IP});
          let clientID="processingCntroller"+MQTT_IP
          mqttClient = mqtt.connect(MQTT_IP, {clientId:clientID}); // Connect to the designated mqtt broker
          mqttClient.setMaxListeners(0); //CAREFULL OF MEMORY LEAKS HERE.
          params.connection.connections.push({"descriptor": params.command.connection, "connector": mqttClient});
          _this.connectionIndex = params.connection.connections.length - 1;

        }
        catch (err) {metaLog({type:LOG_TYPE.ERROR, content:'Error setting up MQTT-connection ' + err});}
      }
      try {
      metaLog({type:LOG_TYPE.VERBOSE,content:"ConnectionIndex:" + _this.connectionIndex});
      metaLog({type:LOG_TYPE.DEBUG, content:params.connection.connections[_this.connectionIndex].connector});
      var MQTTSubscribed = false;
      if ((params.command.replytopic)||(params.command.topic&&!params.command.message)) {//here we get a value from a topic
        _this.GetThisTopic = params.command.topic;
        _this.CheckOnMessage = true;

        _this.Timer = setTimeout(() => {
          UnsubscribeMQTT(params,_this.GetThisTopic);
          metaLog({type:LOG_TYPE.ERROR, content:'Timeout waiting for MQTT-topic ' + _this.GetThisTopic});
          _this.MyUseCount[_this.connectionIndex]--;
          if (!_this.MyUseCount[_this.connectionIndex]) {
            metaLog({type:LOG_TYPE.DEBUG,content:"Messagehandler usecount has become 0, removing messagehandler"}) 
            params.connection.connections[_this.connectionIndex].connector.off('message',OnMessageHandler);

          }
          _this.CheckOnMessage=false;
          reject('');return;
        }, (params.command.timeout ? params.command.timeout  : 10000));

        metaLog({type:LOG_TYPE.DEBUG, content:'Check if we need to setup a message handler'});  
        metaLog({type:LOG_TYPE.DEBUG, content:_this.MyUseCount[_this.connectionIndex]});

        if (params.command.replytopic)
          _this.GetThisTopic = params.command.replytopic;   
        if (!_this.MyUseCount[_this.connectionIndex]) {  // Message handler not yet registered?
          params.connection.connections[_this.connectionIndex].connector.on('message', OnMessageHandler);
          }
        metaLog({type:LOG_TYPE.VERBOSE, content:"Subscribing to " + _this.GetThisTopic });     
        _this.MyUseCount[_this.connectionIndex]++;
        params.connection.connections[_this.connectionIndex].connector.subscribe(_this.GetThisTopic);
  
        }
      }
      catch (err) {metaLog({type:LOG_TYPE.ERROR, content:"error in message handler " +err})}

      try {
         // Next is a bit complex: if we have a message to send **OR** No listen action started and no message to send? Then send a message (though it will be empty)
      if (params.command.message || (!MQTTSubscribed && !params.command.message)) {    
        metaLog({type:LOG_TYPE.VERBOSE, content:'MQTT publishing ' + params.command.message + ' to ' + settings.mqtt_topic + params.command.topic + ' with options : ' + params.command.options});
        try {
          params.connection.connections[_this.connectionIndex].connector.publish(params.command.topic, params.command.message, (params.command.options ? JSON.parse(params.command.options) : ""));
          if (params.command.replytopic== undefined) { //Only resolve when not waiting on response
            metaLog({type:LOG_TYPE.DEBUG, content:"No replytopic, so we'll return immediately"})
            resolve('');
          }
          else 
          metaLog({type:LOG_TYPE.DEBUG, content:"Replytopic, so we'll wait for a response on MQTT " +params.command.replytopic})
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'Meta found an error processing the MQTT command'});
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
    }
      catch (err) {metaLog({type:LOG_TYPE.VERBOSE, content:"error in publish part " +err})}
    
  })
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
      metaLog({type:LOG_TYPE.VERBOSE, content:'startlisten mqtt'  });
      // Here, we need top add handler for ip-address of mqtt-server, if provided; else 'mqtt://' + settings.mqtt
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
      if  (!params.connection.connections) { params.connection.connections = []};
      let connectionIndex = params.connection.connections.findIndex((con) => {return con.Listenerdescriptor == params.command.connection});
      metaLog({type:LOG_TYPE.VERBOSE, content:'Connection Index:' + connectionIndex});
      metaLog({type:LOG_TYPE.DEBUG, content:params.connection.connections[connectionIndex]});
      if  (connectionIndex < 0) { //checking if connection exist
        try {
          let MQTT_IP = (params.command.connection)?'mqtt:'+params.command.connection:'mqtt://' + settings.mqtt;
                    mqttClient = mqtt.connect(MQTT_IP, {clientId:"processingCntroller"}); // Connect to the designated mqtt broker
          mqttClient.setMaxListeners(0); //CAREFULL OF MEMORY LEAKS HERE.
//          let theConnector = new WebSocket(params.command.connection);
          params.connection.connections.push({"Listenerdescriptor": params.command.connection, "connector": mqttClient});
          connectionIndex = params.connection.connections.length - 1;
        }
        catch (err) {metaLog({type:LOG_TYPE.ERROR, content:'Error setting up MQTT-connection ' + err});}
      }
//      params.connection.connections[connectionIndex].connector.terminate()
      params.connection.connections[connectionIndex].connector.subscribe(params.command, (result) => {metaLog({type:LOG_TYPE.VERBOSE, content:'Subscription MQTT : '+ result})});
      params.connection.connections[connectionIndex].connector.on('message', function (topic, message,packet) {
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

