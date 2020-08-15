
const { getNameFromBuiltName } = require("./helpers");

class sensorHelper {
  constructor(name, variableListened, controller) {
    this.name = name;
    this.variableListened = variableListened;
    this.value = '';
    var self = this;
    this.get = function (deviceId) {
       return self.value;
    }

    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: getNameFromBuiltName(self.name), value: theValue })
            .catch((err) => {console.log('SENSOR ERROR' + err); });
        }
        resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.addListenerVariable(self.variableListened, self.update, deviceId);
    }
  }
}
exports.sensorHelper = sensorHelper;
