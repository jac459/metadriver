const { getNameFromBuiltName } = require("./helpers");

class sliderHelper {
  constructor(variableListened, evaldo, slidername, controller) {
    this.variableListened = variableListened;
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
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: getNameFromBuiltName(self.name), value: theValue})
          .catch((err) => {console.log("Error while trying to update the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + getNameFromBuiltName(self.name) + " => " + err); reject(err); });
        }
       resolve();
      });
    };
    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: getNameFromBuiltName(self.name), value: theValue})
          .catch((err) => {console.log("Error while trying to set the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + getNameFromBuiltName(self.name) + " => " + err);});
          controller.writeVariable(variableListened, Math.round(theValue), deviceId);
          controller.evalDo(evaldo, Math.round(theValue), deviceId)
        }
       resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.addListenerVariable(self.variableListened, self.update, deviceId);
    }
  }
}
exports.sliderHelper = sliderHelper;
