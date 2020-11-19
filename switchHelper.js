const MQTT = 'mqtt';

class switchHelper {
  constructor(deviceId, name, variableListened, evaldo, controller) {
    this.name = name;
    this.deviceId = deviceId;
    this.variableListened = variableListened;
    this.evaldo = evaldo;
    this.controller = controller;
    this.value = false;
    var self = this;
 
    this.get = function () {
      return self.value;
    };
     
    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          self.controller.commandProcessor("{\"topic\":\"" + self.controller.name + "/" + deviceId + "\",\"message\":\"{\\\"type\\\":\\\"switch\\\", \\\"name\\\":\\\"" + self.name + "\\\", \\\"value\\\":\\\"" + theValue + "\\\"}\"}", MQTT, deviceId)
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .then((result) => {console.log("Updates performed : new value : " + theValue + " component " + controller.name + "/"+ self.name+"/"+deviceId);console.log(result)})
          .catch((err) => {console.log("Error while trying to put the value : " + theValue+ " in this component : " + deviceId + " / " + self.name + " => " + err); reject(err); });
        }
        resolve();
      });
    };

    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          self.controller.commandProcessor("{\"topic\":\"" + self.controller.name + "/" + deviceId + "\",\"message\":\"{\\\"type\\\":\\\"switch\\\", \\\"name\\\":\\\"" + self.name + "\\\", \\\"value\\\":\\\"" + theValue + "\\\"}\"}", MQTT, deviceId)
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .then((result) => {console.log("Set performed : new value : " + theValue + " component " + controller.name + "/"+ self.name+"/"+deviceId);console.log(result)})
          .catch((err) => {console.log("Error while trying to put the value : " + theValue+ " in this component : " + self.name + " => " + err); reject(err); });
        }
        controller.vault.writeVariable(variableListened, theValue, deviceId);
        controller.evalDo(evaldo, theValue, deviceId)
        resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
    }
  }
}
exports.switchHelper = switchHelper;
