
class labelHelper {
  constructor(name, variableListened, controller, actionVariableListened) {
    this.name = name;
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
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {console.log(err); reject(err); });
          setTimeout(() => {
            controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: self.value })
            .catch((err) => {console.log(err); reject(err); });
          }, 2000)
        }
        resolve();
      })
    }

    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {console.log(err); reject(err); });
        }
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.update);
    controller.addListenerVariable(actionVariableListened, self.updateAction);
  }
}
exports.labelHelper = labelHelper;
