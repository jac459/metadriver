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

    this.update = function (theValue, deviceId) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: self.value})
            .catch((err) => { console.log(err); reject(err); });
        }
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.update);
  }
}
exports.imageHelper = imageHelper;
