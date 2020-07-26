
class labelHelper {
  constructor(labelName, variableListened, controller) {
    this.labelName = labelName;
    this.variableListened = variableListened;
    this.value = '';
    var self = this;
    this.get = function () {
       return self.value;
    }

    this.update = function (theValue, deviceId) {
      return new Promise(function (resolve, reject) {
        controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.labelName, value: theValue })
          .catch((err) => {console.log(err); reject(err); });
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.update);
  }
}
exports.labelHelper = labelHelper;
