
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
            .catch((err) => { console.log("Image Update Error : " + deviceId + " / " + err); });
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
