const { exec } = require("child_process");
const xpath = require('xpath');
const path = require('path');
const http = require('http.min');
const { JSONPath } = require ('jsonpath-plus');
const io = require('socket.io-client');
const rpc = require('json-rpc2');
const lodash = require('lodash');
const { parserXMLString, xmldom } = require("./metaController");
//const mqtt = require('mqtt');
const got = require('got');
const settings = require(path.join(__dirname,'settings'));
const { connect } = require("socket.io-client");
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
        .then((result) => { resolve(result); })
        .catch((err) => reject(err));
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
  constructor() {
  };
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
  process(params) {
    return new Promise(function (resolve, reject) {
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
  startListen(params, deviceId) {
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
    stopListen(params) {
      clearInterval(params.timer);
    }
}
exports.httpgetProcessor = httpgetProcessor;
class webSocketProcessor {
  initiate(connection) {/*
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
    }); //to avoid opening multiple
    */
  }
  process(params) {
    return new Promise(function (resolve, reject) {
      if  (!params.connection.connections) { params.connection.connections = []};
      if (typeof (params.command) == 'string') { params.command = JSON.parse(params.command); }
      let connectionIndex = params.connection.connections.findIndex((con) => {return con.descriptor == params.command.connection});
      metaLog({type:LOG_TYPE.VERBOSE, content:'Connection Index:' + connectionIndex});
      metaLog({type:LOG_TYPE.VERBOSE, content:params});

      if  (connectionIndex < 0) { //checking if connection exist
        try {
          //  if (params.command.connection != "" && params.command.connection != undefined) {
          //    connection.connector.close();
          //  } //to avoid opening multiple
          params.connection.connections.push({"descriptor": params.command.connection, "connector":io.connect(params.command.connection)});
          connectionIndex = params.connection.connections.length - 1;
          metaLog({type:LOG_TYPE.VERBOSE, content:'New Connection Index:' + connectionIndex});
          metaLog({type:LOG_TYPE.VERBOSE, content:params});
            }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'Error while intenting connection to the target device.'});
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
      if (params.command.message.call) {
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
      metaLog({type:LOG_TYPE.VERBOSE, content:params});
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
        metaLog({type:LOG_TYPE.VERBOSE, content:'listenning with this params:' + connectionIndex});
        metaLog({type:LOG_TYPE.VERBOSE, content:params});
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
exports.webSocketProcessor = webSocketProcessor;
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
  stopListen(params) {
    clearInterval(params.timer);
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

class mqttProcessor {
  initiate(connection) {
    return new Promise(function (resolve, reject) {
      //nothing to do, it is done globally.
      //connection.connector = mqttClient;
    }); 
  } 
  process (params) {
    return new Promise(function (resolve, reject) {
      metaLog({type:LOG_TYPE.VERBOSE, content:'MQTT Processing'});
      metaLog({type:LOG_TYPE.VERBOSE, content:params.command});
      params.command = JSON.parse(params.command);
      if (params.command.message) {// here we publish into a topic
        metaLog({type:LOG_TYPE.VERBOSE, content:'MQTT publishing ' + params.command.message + ' to ' + settings.mqtt_topic + params.command.topic + ' with options : ' + params.command.options});
        try {
          params.connection.connector.publish(params.command.topic, params.command.message, (params.command.options ? JSON.parse(params.command.options) : ""));
          resolve('');
        }
        catch (err) {
          metaLog({type:LOG_TYPE.ERROR, content:'Meta found an error processing the MQTT command'});
          metaLog({type:LOG_TYPE.ERROR, content:err});
        }
      }
      else if (params.command.topic) {//here we get a value from a topic
        params.connection.connector.subscribe(params.command.topic, (result) => {metaLog({type:LOG_TYPE.VERBOSE, content:'Subscription MQTT : '+ result})});
        params.connection.connector.on('message', function (topic, message) {
          if (topic == params.command.topic) {
            metaLog({type:LOG_TYPE.VERBOSE, content:'message received : ' + message.toString()});
            params.connection.connector.unsubscribe(params.command.topic);
            resolve(message.toString());
          }
        });
      }
      else {
        metaLog({type:LOG_TYPE.ERROR, content:"Meta Error: Your command MQTT seems incorrect"});
        metaLog({type:LOG_TYPE.ERROR, content:err});
      }
    })
  }
  query(params) {
    return new Promise(function (resolve, reject) {
      if (params.query) {
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
      params.connection.connector.subscribe(params.command, (result) => {metaLog({type:LOG_TYPE.VERBOSE, content:'Subscription MQTT : '+ result})});
      params.connection.connector.on('message', function (topic, message) {
        if (topic == params.command) {
          metaLog({type:LOG_TYPE.VERBOSE, content:'message received : ' + message.toString()});
          params._listenCallback(message.toString(), params.listener, deviceId);
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
