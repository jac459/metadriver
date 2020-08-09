
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
          console.log('update ' + self.name + ' -------------- '+self.value)
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
            .catch((err) => {console.log(err); reject(err); });
        }
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.update);
  }
}
exports.sensorHelper = sensorHelper;
