//LOGGING SETUP AND WRAPPING
//Disable the NEEO library console warning.
const { metaMessage, LOG_TYPE } = require("./metaMessage");
console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
function metaLog(message) {
  let initMessage = { component:'labelHelper', type:LOG_TYPE.INFO, content:'', deviceId: null };
  let myMessage = {...initMessage, ...message}
  return metaMessage (myMessage);
} 

class labelHelper {
  constructor(deviceId, name, variableListened, controller, actionVariableListened) {
    this.name = name;
    this.controller = controller;
    this.deviceId = deviceId;
    this.variableListened = variableListened;
    this.actionVariableListened = actionVariableListened;
    this.actionValue = '';
    this.value = '';
    var self = this;
    this.get = function () {
      return self.value;
    }

    this.updateAction = function (deviceId, theValue) { //display something just for a while
      return new Promise(function (resolve, reject) {
        if (self.actionValue != theValue) {
          self.actionValue = theValue;
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {metaLog({type:LOG_TYPE.ERROR, content:err, deviceId:deviceId})});
          setTimeout(() => {
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: self.value })
          .catch((err) => {metaLog({type:LOG_TYPE.ERROR, content:err, deviceId:deviceId})});
          }, 2000)
        }
        resolve();
      })
    }

    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {metaLog({type:LOG_TYPE.ERROR, content:err, deviceId:deviceId})});
        }
        resolve();
      });
    };

    this.initialise = function (deviceId) {
      self.controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
      self.controller.vault.addObserver(self.actionVariableListened, self.updateAction, deviceId, self.name);
    }

  }
}
exports.labelHelper = labelHelper;
