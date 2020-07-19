const neeoapi = require('neeo-sdk');

class directoryHelper {
  constructor(controller) {
    this.feederH = [];
    this.currentFeeder = 0;
    this.controller = controller;
    var self = this;
    this.addFeederHelper = function (feedConfig) {
      self.feederH.push(feedConfig);
    };
    this.browse = {
      getter: (deviceId, params) => this.fetchList(deviceId, params),
      action: (deviceId, params) => this.handleAction(deviceId, params),
    };
    this.listFillHelper = function (dataset, list, query, commandtype) {
      if (query != '' && query != undefined) {
        list = controller.queryProcessor(dataset, query, commandtype);
        return list;
      }
      else {
        return null;
      }
    };
    this.fetchList = function (deviceId, params) {
      return new Promise(function (resolve, reject) {
        self.fetchCurrentList(deviceId, self.feederH[self.currentFeeder], params)
          .then((list) => { resolve(list); })
          .catch((err) => { reject(err); });
      });
    };
    this.fetchCurrentList = function (deviceId, config, params) {
      console.log(params);
      let neeoList;
      let nameList;
      let imageList;
      let labelList;
      return new Promise(function (resolve, reject) {
        self.controller.commandProcessor(config.command, config.type)
          .then((result) => {
            nameList = self.listFillHelper(result, nameList, config.queryname, config.type);
            imageList = self.listFillHelper(result, imageList, config.queryimage, config.type);
            labelList = self.listFillHelper(result, labelList, config.querylabel, config.type);
            console.log('Command result: ' + result);
            console.log('NameList : ' + nameList);
            neeoList = neeoapi.buildBrowseList({
              title: config.directoryname,
              totalMatchingItems: nameList.length,
              limit: nameList.length,
              offset: 0,
            });
          })
          .then(function () {
            var i;
            for (i = 0; i < nameList.length; i++) {
              let iTitle = nameList[i];
              let iLabel = labelList ? labelList[i] : config.directoryname;
              let iImage = imageList ? config.imageurl + imageList[i] + config.imageurlpost : ((config.imageurl != '' ? config.imageurl + nameList[i] + config.imageurlpost : '')); //imagelist taken, if not, static url, if not, no image.
              let iAction = labelList ? labelList[i] : nameList[i]; //If label is provided, the label will be used as action identifier
              neeoList.addListItem({
                title: iTitle,
                label: iLabel,
                thumbnailUri: iImage,
                actionIdentifier: iAction,
                //browseIdentifier: iAction,
                //uiAction: 'close'
              });
            }
            resolve(neeoList);
          })
          .catch(function (err) {
            console.log("Fetching error: " + err);
          });
      });
    };
    this.handleAction = function (deviceId, params) {
      return new Promise(function (resolve, reject) {
        self.handleCurrentAction(deviceId, self.feederH[self.currentFeeder], params)
          .then((action) => { resolve(action); })
          .catch((err) => { reject(err); });
      });
    };
    this.handleCurrentAction = function (deviceId, config, params) {
      console.log(params);
      return new Promise(function (resolve, reject) {
        if (self.variable2assign != undefined && self.variable2assign != '') { //Assign Variables if needed
          let varIndex = controller.deviceVariables.findIndex((variableIt) => { return (variableIt.name == self.variable2assign); });
          console.log(controller.deviceVariables[varIndex].value);
          if (varIndex >= 0) {
            controller.deviceVariables[varIndex].value = params.actionIdentifier;
          };
          console.log(controller.deviceVariables[varIndex].value);
        }
        self.controller.commandProcessor(config.actioncommand + params.actionIdentifier, config.type)
          .then(function (result) { resolve(result) })
          .catch(function (err) { reject(err); });
      });
    };
  }
}
exports.directoryHelper = directoryHelper;
