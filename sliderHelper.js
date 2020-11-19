 const MQTT = 'mqtt';

class sliderHelper {
  constructor(deviceId, variableListened, evaldo, slidername, controller) {
    this.variableListened = variableListened;
    this.deviceId = deviceId;
    this.name = slidername;
    this.value = 50;
    this.evaldo = evaldo;
    var self = this;
    this.get = function () {
      return new Promise(function (resolve, reject) {
        resolve(self.value);
      });
    };
    this.update = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          self.value = theValue;
          controller.commandProcessor("{\"topic\":\"" + controller.name + "\",\"message\":\"{\\\"type\\\":\\\"slider\\\", \\\"name\\\":\\\"" + self.name + "\\\", \\\"deviceId\\\":\\\"" + deviceId + "\\\", \\\"value\\\":\\\"" + theValue + "\\\"}\"}", MQTT, deviceId)
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: Math.round(theValue)})
          .then((result) => {console.log("Update performed : new value : " + theValue + " component " + controller.name + "/"+ self.name+"/"+deviceId);console.log(result)})
          .catch((err) => {console.log("Error while trying to update the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + self.name + " => " + err); reject(err); });
        }
       resolve();
      });
    };
    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        theValue = Math.round(theValue);
        if (self.value != theValue) {
          self.value = theValue;
          console.log(JSON.parse("{\"type\":\"slider\", \"name\":\"" + self.name + "\", \"value\":" + theValue + "}"))
          controller.commandProcessor("{\"topic\":\"" + controller.name + "\",\"message\":\"{\\\"type\\\":\\\"slider\\\", \\\"name\\\":\\\"" + self.name + "\\\", \\\"deviceId\\\":\\\"" + deviceId + "\\\", \\\"value\\\":\\\"" + theValue + "\\\"}\"}", MQTT, deviceId)
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue})
          .then((result) => {console.log("Set performed : new value : " + theValue + " component " + controller.name + "/"+ self.name+"/"+deviceId);console.log(result)})
          .catch((err) => {console.log("Error while trying to set the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + self.name + " => " + err);});
          controller.vault.writeVariable(variableListened, Math.round(theValue), deviceId);
          controller.evalDo(evaldo, Math.round(theValue), deviceId)
        }
       resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
    }
  }
}
exports.sliderHelper = sliderHelper;
