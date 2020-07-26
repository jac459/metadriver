const neeoapi = require('neeo-sdk');
const { JSONPath } = require('jsonpath/lib');
const jpath = require('jsonpath');

class directoryHelper {
  constructor(controller) {
    this.feederH = [];
    this.currentFeederIndex = 0;
    this.controller = controller;
    var self = this;
    this.addFeederHelper = function (feedConfig) {
      self.feederH.push(feedConfig);
    };
    this.browse = {
      getter: (deviceId, params) => this.fetchList(deviceId, params),
      action: (deviceId, params) => this.handleAction(deviceId, params),
    };

    this.evalNext = function (evalnext, result) {
      if (evalnext) { //case we want to go to another feeder
        evalnext.forEach(evalN => {
          if (evalN.test == '' || evalN.test == true) {evalN.test = true}; //in case of no test, go to the do function
          let finalNextTest = self.controller.assignVariables(evalN.test);// prepare the test to assign variable and be evaluated.
          finalNextTest = self.controller.assignResult(finalNextTest, result);
          if (finalNextTest) {
            if (evalN.then && evalN.then != '')
            {
              self.currentFeederIndex = self.feederH.findIndex((feed) => {return (feed.name == evalN.then)});
            }
          }
          else { 
            if (evalN.or && evalN.or != '')
            {
              self.currentFeederIndex = self.feederH.findIndex((feed) => {return (feed.name == evalN.or)});
            }
          }
         })
      }
    }

    this.fetchList = function (deviceId, params) {
      return new Promise(function (resolve, reject) {

      if (params.browseIdentifier != '') {
        self.controller.evalWrite(self.feederH[self.currentFeederIndex].evalwrite, params.browseIdentifier, deviceId)
        self.evalNext(self.feederH[self.currentFeederIndex].evalnext, params.browseIdentifier);//assign the good value to know the feeder
      }
      else if (params.history.length>0) {
          self.currentFeederIndex = params.history.length;
      }
      else {self.currentFeederIndex = 0}
      self.fetchCurrentList(deviceId, self.feederH[self.currentFeederIndex], params)
          .then((list) => { resolve(list); })
          .catch((err) => { reject(err); });
      });
    };

    this.fetchCurrentList = function (deviceId, config, params) {
      console.log("params: " + JSON.stringify(params));
      console.log("browseIdentifier: " + params.browseIdentifier);
      console.log("actionIdentifier: " + params.actionIdentifier);
      let neeoList;
      let resultList;
      let rName;
      let rImage;
      let rLabel;
      let rAction;
      let nameList =  [];
      let imageList = [];
      let labelList = [];
      let actionList = [];
      return new Promise(function (resolve, reject) {
        let processedCommand = self.controller.assignResult(config.command, params.browseIdentifier);
        processedCommand = self.controller.assignVariables(processedCommand);
        self.controller.commandProcessor(processedCommand, config.type)
          .then((result) => {
            resultList = self.controller.queryProcessor(result, config.queryresult, config.type);
            //console.log('Query result: ' + resultList);
            rName = self.controller.assignVariables(config.itemname); //ensure that the item name chain has the variable interpreted (except $Result)
            rImage = self.controller.assignVariables(config.itemimage); 
            rLabel = self.controller.assignVariables(config.itemlabel); 
            rAction = self.controller.assignVariables(config.itemaction ? config.itemaction : config.itembrowse); //check if this list will generate a browse or an action
            //console.log('Prepare to iterate through results : ')
            resultList.forEach(oneItemResult => { //As in this case, $Result is a table, transform $Result to get every part of the table as one $Result
              //console.log(oneItemResult)
              nameList.push(self.controller.assignResult(rName, oneItemResult));//push the result of the itemname expression with result item to the namelist
              imageList.push(self.controller.assignResult(rImage, oneItemResult));
              labelList.push(self.controller.assignResult(rLabel, oneItemResult));
              actionList.push(self.controller.assignResult(rAction, oneItemResult));
              
            });
            //console.log(nameList)
            //console.log('NameList : ' + nameList);
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
              let iImage = imageList ? imageList[i] : ''; 
              let iAction = actionList[i];
              neeoList.addListItem({
                title: iTitle,
                label: iLabel,
                thumbnailUri: iImage,
                actionIdentifier: config.itemaction ? iAction : undefined,
                browseIdentifier: config.itemaction ? undefined : iAction,
                uiAction: config.itemaction ? '' : 'reload',
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
        self.handleCurrentAction(deviceId, self.feederH[self.currentFeederIndex], params)
          .then((action) => { resolve(action); })
          .catch((err) => { reject(err); });
      });
    };

    this.handleCurrentAction = function (deviceId, config, params) {
      console.log(params);
      return new Promise(function (resolve, reject) {
       //here, the action identifier is the result.
        self.controller.commandProcessor(params.actionIdentifier, config.type)
          .then(function (result) { resolve(result) })
          .catch(function (err) { reject(err); });
      });
    };
  }
}
exports.directoryHelper = directoryHelper;
