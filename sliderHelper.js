class sliderHelper {
  constructor(min, max, commandtype, command, querystatus, variableListened, name, controller) {
    this.min = min;
    this.max = max;
    this.command = command;
    this.querystatus = querystatus;
    this.name = name;
    this.value;
    this.commandtype = commandtype;
    var self = this;
    this.toDeviceValue = function (value) {
      return Math.round(self.min + (self.max - self.min) * value / 100);
    };
    this.toSliderValue = function (value) {
      return Math.round(100 * (value - self.min) / (self.max - self.min));
    };
    this.get = function () {
      return new Promise(function (resolve, reject) {
        resolve(self.value);
        //controller.commandProcessor(self.statuscommand, self.commandtype)
        //  .then(function (result) {
        //    resolve(controller.queryProcessor(result, self.querystatus, self.commandtype)[0]);
        //  })
        //  .catch(function (err) { reject(err); });
      });
    };
    this.set = function (deviceId, newValue) {
      controller.commandProcessor(self.command + self.toDeviceValue(newValue), self.commandtype) // set the slider to the same range than the target device
        .then(function (result) {
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: name, value: newValue })
            .catch((err) => { console.log(err); });
          console.log(result);
        })
        .catch(function (err) {
          console.log(err);
        });
    };
    this.update = function (theValue, deviceId) {
      return new Promise(function (resolve, reject) {
        if (self.value != theValue) {
          console.log('theValue')
          console.log(theValue)
          self.value = theValue;
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: self.name, value: theValue })
          .catch((err) => {console.log(err); reject(err); });
        }
        resolve();
      });
    };
    controller.addListenerVariable(variableListened, self.update);


  }
}
exports.sliderHelper = sliderHelper;
