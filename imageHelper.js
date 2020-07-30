class imageHelper {
  constructor(imageName, variableListened, controller) {
    this.imageName = imageName;
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
        self.value = theValue;
        controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.imageName, value: self.value})
          .catch((err) => { console.log(err); reject(err); });
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.update);
  }
}
exports.imageHelper = imageHelper;
