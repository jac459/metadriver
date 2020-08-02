class sliderHelper {
  constructor(min, max, commandtype, command, statuscommand, querystatus, slidername, controller) {
    this.min = min;
    this.max = max;
    this.command = command;
    this.statuscommand = statuscommand;
    this.querystatus = querystatus;
    this.slidername = slidername;
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
        controller.commandProcessor(self.statuscommand, self.commandtype)
          .then(function (result) {
            resolve(controller.queryProcessor(result, self.querystatus, self.commandtype)[0]);
          })
          .catch(function (err) { reject(err); });
      });
    };
    this.set = function (deviceId, newValue) {
      controller.commandProcessor(self.command + self.toDeviceValue(newValue), self.commandtype) // set the slider to the same range than the target device
        .then(function (result) {
          controller.sendComponentUpdate({ uniqueDeviceId: deviceId, component: slidername, value: newValue })
            .catch((err) => { console.log(err); });
//          controller.displayStatus(deviceId, self.toDeviceValue(newValue));
          console.log(result);
        })
        .catch(function (err) {
          console.log(err);
        });
    };
  }
}
exports.sliderHelper = sliderHelper;
