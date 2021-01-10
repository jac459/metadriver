const MQTT = 'mqtt';
//LOGGING SETUP AND WRAPPING
//Disable the NEEO library console warning.
const { metaMessage, LOG_TYPE } = require("./metaMessage");
console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
function metaLog(message) {
  let initMessage = { component:'switchHelper', type:LOG_TYPE.INFO, content:'', deviceId: null };
  let myMessage = {...initMessage, ...message}
  return metaMessage (myMessage);
} 

class switchHelper {
  constructor(deviceId, name, variableListened, evaldo, controller) {
    this.name = name;
    this.deviceId = deviceId;
    this.variableListened = variableListened;
    this.evaldo = evaldo;
    this.controller = controller;
    this.value = false;
    var self = this;
 
    this.get = function () {
      return self.value;
    };
     
    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          self.controller.commandProcessor("{\"topic\":\"" + self.controller.name + "/" + deviceId + "/switch/" + self.name + "\",\"message\":\"" + theValue + "\", \"options\":\"{\\\"retain\\\":true}\"}", MQTT, deviceId)
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .then((result) => {metaLog({type:LOG_TYPE.VERBOSE, content:"Updates performed, new value : " + theValue + " component " + self.controller.name + "/"+ self.name+"/"+deviceId, deviceId:deviceId})})
          .catch((err) => {metaLog({type:LOG_TYPE.ERROR, content:"Error while trying to put the value : " + theValue+ " in this component : " + deviceId + " / " + self.name + " => " + err, deviceId:deviceId}); reject(err); });
        }
        resolve();
      });
    };

    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          self.controller.commandProcessor("{\"topic\":\"" + self.controller.name + "/" + deviceId + "/switch/" + self.name + "\",\"message\":\"" + Boolean(theValue) + "\", \"options\":\"{\\\"retain\\\":true}\"}", MQTT, deviceId)
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .then((result) => {metaLog({type:LOG_TYPE.VERBOSE, content:"Set performed, new value : " + theValue + " component " + self.controller.name + "/"+ self.name+"/"+deviceId, deviceId:deviceId})})
          .catch((err) => {metaLog({type:LOG_TYPE.ERROR, content:"Error while trying to put the value : " + theValue+ " in this component : " + deviceId + " / " + self.name + " => " + err, deviceId:deviceId}); reject(err); });
         }
        controller.vault.writeVariable(variableListened, theValue, deviceId);
        controller.evalDo(evaldo, theValue, deviceId)
        resolve();
      });
    };
    this.initialise = function (deviceId) {
      metaLog({type:LOG_TYPE.VERBOSE, content:"Initialise switchHelper", deviceId:deviceId})
      controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
    }
  }
}
exports.switchHelper = switchHelper;
