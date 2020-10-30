
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
        console.log('setin')
        //if (self.value != theValue) {
          self.value = theValue;
          console.log('updating ' + deviceId + " > " + self.name + " with " + theValue + " " + typeof(theValue))
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: Math.round(theValue)})
          .then((disp) => {console.log("Successfully set the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + self.name + " => ");console.log(disp)})
          .catch((err) => {
          });
        //}
       resolve();
      });
    };
    this.set = function (deviceId, theValue) {
      return new Promise(function (resolve, reject) {
        console.log('setin')
        theValue = Math.round(theValue);
        //if (self.value != theValue) {
          self.value = theValue;
          console.log('updating ' + deviceId + " > " + self.name + " with " + theValue + " " + typeof(theValue))
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue})
          .then((disp) => {console.log("Successfully set the value : " + theValue+ " in this component : " + controller.name + "/" + deviceId + "/" + self.name + " => ");console.log(disp)})
          .catch((err) => {
           })        
          controller.vault.writeVariable(variableListened, Math.round(theValue), deviceId);
          controller.evalDo(evaldo, Math.round(theValue), deviceId)
        //}
       resolve();
      });
    };
    this.initialise = function (deviceId) {
      controller.vault.addObserver(self.variableListened, self.update, deviceId, self.name);
    }
  }
}
exports.sliderHelper = sliderHelper;
