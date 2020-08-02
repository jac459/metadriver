
class sensorHelper {
  constructor(sensorName, variableListened, controller) {
    this.sensorName = sensorName;
    this.variableListened = variableListened;
    this.value = '';
    var self = this;
    this.get = function () {
       return self.value;
    }

    this.update = function (theValue, deviceId) {
      return new Promise(function (resolve, reject) {
        self.value = theValue;
       // controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.sensorName, value: theValue })
       //   .catch((err) => {console.log(err); reject(err); });
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.update);
  }
}
exports.sensorHelper = sensorHelper;
