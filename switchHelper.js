class switchHelper {
  constructor(switchname, variableListened, controller) {
    
    this.switchname = switchname;
    this.variableListened = variableListened;
    this.value = '';
    var self = this;

    this.get = function () {
      return self.value;
    };

    this.set = function (theValue, deviceId) {
      return new Promise(function (resolve, reject) {
        self.value = theValue;
        controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.switchname, value: theValue })
          .catch((err) => {console.log(err); reject(err); });
        controller.writeVariable(variableListened, theValue, deviceId);
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.set);
  }
}
exports.switchHelper = switchHelper;
