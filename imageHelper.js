
//LOGGING SETUP AND WRAPPING
//Disable the NEEO library console warning.
const { metaMessage, LOG_TYPE } = require("./metaMessage");
console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
function metaLog(message) {
  let initMessage = { component:'imageHelper', type:LOG_TYPE.INFO, content:'', deviceId: null };
  let myMessage = {...initMessage, ...message}
  return metaMessage (myMessage);
} 

class imageHelper {
  constructor(deviceId, name, variableListened, controller) {
    this.name = name;
    this.deviceId = deviceId;
    this.variableListened = variableListened;
    this.value = '';
    this.controller = controller;
    var self = this;
    this.get = function (deviceId) {
      return new Promise(function (resolve, reject) {
        resolve(self.value);
      })
    }; 

    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: self.value})
            .catch((err) => { metaLog({type:LOG_TYPE.ERROR, content:err, deviceId:deviceId})});
        }
        resolve();
      });
    };
    this.initialise = function (deviceId) {
      self.controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
    }
  }
}
exports.imageHelper = imageHelper;
