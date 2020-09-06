
class sensorHelper {
  constructor(deviceId, name, variableListened, controller) {
    this.name = name;
    this.deviceId = deviceId;
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
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
            .catch((err) => {console.log('SENSOR ERROR' + err); });
        }
        resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
    }
  }
}
exports.sensorHelper = sensorHelper;
