const { getNameFromBuiltName } = require("./helpers");

class switchHelper {
  constructor(name, variableListened, evaldo, controller) {
    
    this.name = name;
    this.variableListened = variableListened;
    this.evaldo = evaldo;
    this.value = false;
    var self = this;
 
    this.get = function () {
      return self.value;
    };
     
    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: getNameFromBuiltName(self.name), value: theValue })
          .catch((err) => {console.log("Error while trying to put the value : " + theValue+ " in this component : " + getNameFromBuiltName(self.name) + " => " + err); reject(err); });
        }
        resolve();
      });
    };

    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: getNameFromBuiltName(self.name), value: theValue })
          .catch((err) => {console.log("Error while trying to put the value : " + theValue+ " in this component : " + getNameFromBuiltName(self.name) + " => " + err); reject(err); });
        }
        controller.writeVariable(variableListened, theValue, deviceId);
        controller.evalDo(evaldo, theValue, deviceId)
        resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.addListenerVariable(self.variableListened, self.update, deviceId);
    }
  }
}
exports.switchHelper = switchHelper;
