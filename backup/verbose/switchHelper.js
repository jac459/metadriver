
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
        console.log('setin')
        //if (self.value != theValue) {
          self.value = theValue;
          console.log('updating ' + deviceId + " > " + self.name + " with " + theValue + " " + typeof(theValue))
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .then((disp) => {console.log("Successfully set the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + self.name + " => ");console.log(disp)})
          .catch((err) => {
          })      
          //}
        resolve();
      });
    };

    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        console.log('setin')
        //if (self.value != theValue) {
          self.value = theValue;
          console.log('updating ' + deviceId + " > " + self.name + " with " + theValue + " " + typeof(theValue))
          self.controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .then((disp) => {console.log("Successfully set the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + self.name + " => ");console.log(disp)})
          .catch((err) => {
          })     
        //}
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
