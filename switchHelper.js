class switchHelper {
  constructor(name, variableListened, controller) {
    
    this.name = name;
    this.variableListened = variableListened;
    this.value = false;
    var self = this;
    controller.addListenerVariable(variableListened, self.update);

    this.get = function () {
      return self.value;
    };
    this.update = function (theValue, deviceId) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
            self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {console.log("Error while trying to put the value : " + theValue+ " in this component : " + self.name + " => " + err); reject(err); });
        }
        resolve();
      });
    };

    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        self.update(theValue, deviceId)
        controller.writeVariable(variableListened, theValue, deviceId);
        resolve();
      });
    };
  }
}
exports.switchHelper = switchHelper;
