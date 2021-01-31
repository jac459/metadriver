const MQTT = 'mqtt';
const path = require('path');
const settings = require(path.join(__dirname,'settings'));

//LOGGING SETUP AND WRAPPING
//Disable the NEEO library console warning.
const { metaMessage, LOG_TYPE } = require("./metaMessage");
console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
function metaLog(message) {
  let initMessage = { component:'sliderHelper', type:LOG_TYPE.INFO, content:'', deviceId: null };
  let myMessage = {...initMessage, ...message}
  return metaMessage (myMessage);
} 

class sliderHelper {
  constructor(deviceId, variableListened, evaldo, slidername, controller) {
    this.variableListened = variableListened;
    this.deviceId = deviceId;
    this.name = slidername;
    this.value = 50;
    this.evaldo = evaldo;
    var self = this;
    this.get = function () {
      return new Promise(function (resolve, reject) {
        resolve(self.value);
      });
    };
    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: Math.round(theValue)})
          .then((result) => {
            metaLog({type:LOG_TYPE.VERBOSE, content:"Update performed : new value : " + theValue + " component " + controller.name + "/"+ self.name, deviceId:deviceId})
            metaLog({type:LOG_TYPE.VERBOSE, content:result, deviceId:deviceId})
          })
          .catch((err) => {metaLog({type:LOG_TYPE.ERROR, content:err, deviceId:deviceId}); reject(err); });
        }
       resolve();
      });
    };
    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        theValue = Math.round(theValue);
        if (self.value != theValue) {
          self.value = theValue;
          controller.commandProcessor("{\"topic\":\"" + settings.mqtt_topic + controller.name + "/" + deviceId + "/slider/" + self.name + "\",\"message\":\"" + theValue + "\", \"options\":\"{\\\"retain\\\":true}\"}", MQTT, deviceId)
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue})
          .then((result) => {metaLog({type:LOG_TYPE.VERBOSE, content:"set performed : new value : " + theValue + " component " + controller.name + "/"+ self.name+"/"+result, deviceId:deviceId})})
          .catch((err) => {metaLog({type:LOG_TYPE.ERROR, content:err, deviceId:deviceId}); reject(err); });
          controller.vault.writeVariable(variableListened, Math.round(theValue), deviceId);
          controller.evalDo(evaldo, Math.round(theValue), deviceId)
        }
       resolve();
      });
    };
    this.initialise = function (deviceId) {
      metaLog({type:LOG_TYPE.VERBOSE, content:"Initialise sliderHelper", deviceId:deviceId})
      controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
    }
  }
}
exports.sliderHelper = sliderHelper;
