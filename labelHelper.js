
class labelHelper {
  constructor(deviceId, name, variableListened, controller, actionVariableListened) {
    this.name = name;
    this.controller = controller;
    this.deviceId = deviceId;
    this.variableListened = variableListened;
    this.actionVariableListened = actionVariableListened;
    this.actionValue = '';
    this.value = '';
    var self = this;
    this.get = function () {
      return self.value;
    }

    this.updateAction = function (deviceId, theValue) { //display something just for a while
      return new Promise(function (resolve, reject) {
        if (self.actionValue != theValue) {
          self.actionValue = theValue;
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {console.log("Label Update Action Error : " + deviceId + " / " + err) });
          setTimeout(() => {
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: self.value })
          .catch((err) => {console.log("Label Update Action Error : " + deviceId + " / " + err); });
          }, 2000)
        }
        resolve();
      })
    }

    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          console.log(self)
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {console.log("Label Update Error : " + deviceId + " / " + err) });
        }
        resolve();
      });
    };

    this.initialise = function (deviceId) {
      self.controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
      self.controller.vault.addObserver(self.actionVariableListened, self.updateAction, deviceId, self.name);
    }

  }
}
exports.labelHelper = labelHelper;
