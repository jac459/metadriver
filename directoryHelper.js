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
//@//        self.controller.evalWrite(self.feederH[self.currentFeederIndex].evalwrite, params.browseIdentifier, deviceId)
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

    this.fetchCurrentList = function (deviceId, allconfigs, params) {
      console.log("params: " + JSON.stringify(params));
      console.log("browseIdentifier: " + params.browseIdentifier);
      console.log("actionIdentifier: " + params.actionIdentifier);
      console.log(allconfigs);
      console.log(allconfigs.name);
      let cacheList = [];
      return new Promise(function (resolve, reject) {
        
        self.fillTheList(cacheList, allconfigs, params, 0, 0).then((cacheList) => {
            console.log(cacheList);
            //Feed the neeo list
            let neeoList;
            neeoList = neeoapi.buildBrowseList({
              title: allconfigs.name,
              totalMatchingItems: cacheList.length,
              limit: 64,
              offset: (params.offset || 0),
              browseIdentifier: 'browseEverything'
            });
            var i;
            for (i = (params.offset || 0); (i < ((params.offset || 0) + 64) && (i < cacheList.length)); i++) {
              if (cacheList[i].itemtype == 'listitem') {
                neeoList.addListItem({
                  title: cacheList[i].name,
                  label: cacheList[i].label,
                  thumbnailUri: cacheList[i].image,
                  actionIdentifier: cacheList[i].action,
                  browseIdentifier: cacheList[i].browse,
                  uiAction: cacheList[i].action || 'reload',
                });
              }
              if (cacheList[i].itemtype == 'tile') {
                let tiles = [];
                tiles.push({
                    thumbnailUri: cacheList[i].image,
                    actionIdentifier: cacheList[i].action,
                    uiAction: cacheList[i].action || 'reload',
                })
                if ((i+1 < cacheList.length) && (cacheList[i+1].itemtype == 'tile')) {
                  //test if the next item is also a tile to put on the right, if it is not the end of the list
                  i++
                  tiles.push({
                    thumbnailUri: cacheList[i].image,
                    actionIdentifier: cacheList[i].action,
                    uiAction: cacheList[i].action || 'reload',
                  });
                }
                neeoList.addListTiles(tiles);
              }
            }
            resolve(neeoList);
          })
        
      })
    }

    this.fillTheList = function (cacheList, allconfigs, params, indentCommand) {
        let resultList;
        let rAction;
        let rBrowse;
        let rName;
        let rItemType;
        let rImage;
        let rLabel;
        console.log('fill')
        return new Promise(function (resolve, reject) {
          if (indentCommand < allconfigs.commandset.length) {
            console.log('ici')
            let commandSet = allconfigs.commandset[indentCommand];
            console.log(commandSet)
            let processedCommand = self.controller.assignResult(commandSet.command, params.browseIdentifier);
            console.log(processedCommand)
            processedCommand = self.controller.assignVariables(processedCommand);
            console.log(processedCommand)
            console.log('ici')
            self.controller.commandProcessor(processedCommand, commandSet.type)
              .then((result) => {
                console.log('ici')
                resultList = self.controller.queryProcessor(result, commandSet.queryresult, commandSet.type);
                rName = self.controller.assignVariables(commandSet.itemname); //ensure that the item name chain has the variable interpreted (except $Result)
                rImage = self.controller.assignVariables(commandSet.itemimage); 
                rItemType = self.controller.assignVariables(commandSet.itemtype); 
                rLabel = self.controller.assignVariables(commandSet.itemlabel); 
                rAction = self.controller.assignVariables(commandSet.itemaction); 
                rBrowse = self.controller.assignVariables(commandSet.itembrowse); 
                resultList.forEach(oneItemResult => { //As in this case, $Result is a table, transform $Result to get every part of the table as one $Result
                  cacheList.push({
                    'name' : self.controller.assignResult(rName, oneItemResult),
                    'image' : self.controller.assignResult(rImage, oneItemResult),
                    'itemtype' : rItemType,
                    'label' : self.controller.assignResult(rLabel, oneItemResult),
                    'action' : self.controller.assignResult(rAction, oneItemResult),
                    'browse' : self.controller.assignResult(rBrowse, oneItemResult)
                    
                  });//push the result of the itemname expression with result item to the namelist
                });
                console.log('ici')
                resolve(self.fillTheList(cacheList, allconfigs, params, indentCommand + 1));
              })
              .catch(function (err) {
                console.log("Fetching error: " + err);
              });
          }
          else {
            resolve(cacheList);
          }
        })
    }
    
  

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
