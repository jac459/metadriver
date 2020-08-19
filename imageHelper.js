const { getNameFromBuiltName } = require("./helpers");

class imageHelper {
  constructor(name, variableListened, controller) {
    this.name = name;
    this.variableListened = variableListened;
    this.value = '';
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
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: getNameFromBuiltName(self.name), value: self.value})
            .catch((err) => { console.log("Image Update Error : " + err); });
        }
        resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.addListenerVariable(self.variableListened, self.update, deviceId);
    }
  }
}
exports.imageHelper = imageHelper;
