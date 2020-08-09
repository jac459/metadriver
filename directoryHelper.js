const neeoapi = require('neeo-sdk');
const { JSONPath } = require('jsonpath/lib');
const jpath = require('jsonpath');
const variablePattern = {'pre':'$','post':''};
const RESULT = variablePattern.pre + 'Result' + variablePattern.post;
const BROWSEID = variablePattern.pre + 'NavigationIdentifier' + variablePattern.post;

class directoryHelper {
  constructor(dirname, controller) {
    this.name = dirname;
    this.feederH = [];
    this.browseHistory = [];
    this.currentFeederIndex = 0;
    this.controller = controller;
    this.previousOffset = 0; //check if we were scrolling;
    var self = this;
    this.addFeederHelper = function (feedConfig) {
      self.feederH.push(feedConfig);
    };
    this.browse = {
      getter: (deviceId, params) => this.fetchList(deviceId, params),
      action: (deviceId, params) => this.handleAction(deviceId, params),
    };

    this.evalNext = function (evalnext, result, browseIdentifierValue) {
      if (evalnext) { //case we want to go to another feeder
        evalnext.forEach(evalN => {
          if (evalN.test == '' || evalN.test == true) {evalN.test = true}; //in case of no test, go to the do function
          let finalNextTest = self.controller.readVariables(evalN.test);// prepare the test to assign variable and be evaluated.
          finalNextTest = self.controller.assignTo(RESULT, finalNextTest, result);
          if (browseIdentifierValue) {
            finalNextTest = self.controller.assignTo(BROWSEID, finalNextTest, browseIdentifierValue);
          }
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

    this.fetchList = function (deviceId, params) { //browse management and delegation to feeders. to be refactored later>
      return new Promise(function (resolve, reject) {
      if (params.browseIdentifier != undefined && params.browseIdentifier != '') { //case were a directory was selected in the list
        console.log('browsing forward')
        //Take the good feeder:
        //Take the good commandset:
        let PastQueryValue = params.browseIdentifier.split("$PastQueryValue=")[1];
        console.log('PastQueryValue' + JSON.stringify(PastQueryValue))
        params.browseIdentifier = params.browseIdentifier.split("$PastQueryValue=")[0];
        let commandSetIndex = params.browseIdentifier.split("$CommandSet=")[1];
        params.browseIdentifier = params.browseIdentifier.split("$CommandSet=")[0];
        self.controller.evalWrite(self.feederH[self.currentFeederIndex].commandset[commandSetIndex].evalwrite, PastQueryValue, deviceId, params.browseIdentifier);
        self.evalNext(self.feederH[self.currentFeederIndex].commandset[commandSetIndex].evalnext, PastQueryValue, params.browseIdentifier);//assign the good value to know the feeder
      }
      else if (params.history != undefined && params.history.length>0 && params.offset==0 && self.previousOffset == 0) {//case where we browse backward
        console.log('browsing backward')
        console.log(params.history.length)
        console.log(self.browseHistory.length)
        console.log(self.browseHistory)
        self.currentFeederIndex = self.browseHistory[params.history.length];
        if (self.currentFeederIndex == undefined) {self.currentFeederIndex = 0;}
        console.log('current feeder' + self.currentFeederIndex)
      }
      else if ( params.offset != undefined && params.offset>0) {
        console.log ('scrolling')
        self.previousOffset = params.offset;
      }
      else if ( params.offset != undefined && params.offset==0 && self.previousOffset > 0) {//we were scrolling and get back to begining of list either by up scroll or back button
        self.previousOffset = 0;
      }
      else {
        console.log ('browsing initiation')
        self.currentFeederIndex = 0
      } // beginning

      if (params.history != undefined) {
        if (self.browseHistory.length<params.history.length) {
          self.browseHistory.push(self.currentFeederIndex) //memorize the path of browsing for feeder 
        }
        else {self.browseHistory[params.history.length] = self.currentFeederIndex}
      }

      console.log('my browse feeder history : ' + self.browseHistory )

      self.fetchCurrentList(deviceId, self.feederH[self.currentFeederIndex], params)
          .then((list) => {resolve(list);})
          .catch((err) => { reject(err); });
      });
    };

    this.fetchCurrentList = function (deviceId, allconfigs, params) {
      console.log("params: " + JSON.stringify(params));
      console.log("browseIdentifier: " + params.browseIdentifier);
      console.log("actionIdentifier: " + params.actionIdentifier);
      console.log("current feeder: " + self.currentFeederIndex);
      let cacheList = [];
      return new Promise(function (resolve, reject) {
        
//        self.currentCommandResult = [];//initialise as new commands will be done now.

        self.fillTheList(cacheList, allconfigs, params, 0, 0).then((cacheList) => {
            //console.log(cacheList);
            //Feed the neeo list
            let neeoList;
            neeoList = neeoapi.buildBrowseList({
              title: allconfigs.name,
              totalMatchingItems: cacheList.length,
              limit: 64,
              offset: (params.offset || 0),
            });
            var i;
            for (i = (params.offset || 0); (i < ((params.offset || 0) + 64) && (i < cacheList.length)); i++) {
              if (cacheList[i].itemtype == 'tile') {
                let tiles = [];
                tiles.push({
                    thumbnailUri: cacheList[i].image,
                    actionIdentifier: cacheList[i].action,
                    uiAction: 'reload',
                })
                if ((i+1 < cacheList.length) && (cacheList[i+1].itemtype == 'tile')) {
                  //test if the next item is also a tile to put on the right, if it is not the end of the list
                  i++
                  tiles.push({
                    thumbnailUri: cacheList[i].image,
                    actionIdentifier: cacheList[i].action,
                    uiAction: 'reload',
                  });
                }
                neeoList.addListTiles(tiles);
              }
              else {
                neeoList.addListItem({
                  title: cacheList[i].name,
                  label: cacheList[i].label,
                  thumbnailUri: cacheList[i].image,
                  actionIdentifier: (cacheList[i].action ? cacheList[i].action + "$ListIndex=" + i : cacheList[i].action), //For support of index
                  browseIdentifier: cacheList[i].browse,
                  uiAction: (cacheList[i].action != '' || cacheList[i].action != undefined) ? '' : 'reload',
                });
              }
            }
            resolve(neeoList);
          })
        
      })
    }

    this.fillTheList = function (cacheList, allconfigs, params, indentCommand) {
        let rAction;
        let rBrowse;
        let rName;
        let rItemType;
        let rImage;
        let rLabel;
        return new Promise(function (resolve, reject) {
          if (indentCommand < allconfigs.commandset.length) {
            let commandSet = allconfigs.commandset[indentCommand];
            let processedCommand = self.controller.assignTo(BROWSEID, commandSet.command, params.browseIdentifier);
            processedCommand = self.controller.readVariables(processedCommand);
            console.log('Final processed Command:' + processedCommand)
            self.controller.commandProcessor(processedCommand, commandSet.type)
              .then((result) => {
                rName = self.controller.readVariables(commandSet.itemname); //ensure that the item name chain has the variable interpreted (except $Result)
                rImage = self.controller.readVariables(commandSet.itemimage); 
                rItemType = self.controller.readVariables(commandSet.itemtype); 
                rLabel = self.controller.readVariables(commandSet.itemlabel); 
                rAction = self.controller.readVariables(commandSet.itemaction); 
                rBrowse = self.controller.readVariables(commandSet.itembrowse); 
                self.controller.queryProcessor(result, commandSet.queryresult, commandSet.type).then ((resultList) => {
                  resultList.forEach(oneItemResult => { //As in this case, $Result is a table, transform $Result to get every part of the table as one $Result
                    cacheList.push({
                      'name' : self.controller.assignTo(RESULT, rName, oneItemResult),
                      'image' : self.controller.assignTo(RESULT, rImage, oneItemResult),
                      'itemtype' : rItemType,
                      'label' : self.controller.assignTo(RESULT, rLabel, oneItemResult),
                      'action' : rAction ? self.controller.assignTo(RESULT, rAction, oneItemResult)+"$CommandSet="+indentCommand+"$PastQueryValue=" + ((typeof(oneItemResult) == 'string')?oneItemResult:JSON.stringify(oneItemResult)) : rAction,
                      'browse' : rBrowse ? self.controller.assignTo(RESULT, rBrowse, oneItemResult)+"$CommandSet="+indentCommand+"$PastQueryValue=" + ((typeof(oneItemResult) == 'string')?oneItemResult:JSON.stringify(oneItemResult)) : rBrowse
                    });
                  });
                  resolve(self.fillTheList(cacheList, allconfigs, params, indentCommand + 1));
                })
                
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
        self.handleCurrentAction(deviceId, params)
          .then((action) => { resolve(action); })
          .catch((err) => { reject(err); });
      });
    };

    this.handleCurrentAction = function (deviceId, params) {
      console.log(params);
      return new Promise(function (resolve, reject) {
        //here, the action identifier is the result.  
        let ListIndex = params.actionIdentifier.split("$ListIndex=")[1];
        params.actionIdentifier = params.actionIdentifier.split("$ListIndex=")[0];
        let PastQueryValue = params.actionIdentifier.split("$PastQueryValue=")[1];
        params.actionIdentifier = params.actionIdentifier.split("$PastQueryValue=")[0];
        let commandSetIndex = params.actionIdentifier.split("$CommandSet=")[1];
        params.actionIdentifier = params.actionIdentifier.split("$CommandSet=")[0];
        self.controller.evalWrite(self.feederH[self.currentFeederIndex].commandset[commandSetIndex].evalwrite, PastQueryValue, deviceId);
           
        //finding the feeder which is actually an action feeder
        let ActionIndex = self.feederH.findIndex((feed) => {return (feed.name == params.actionIdentifier)});
        let commandSet = self.feederH[ActionIndex].commandset[0]
        let processedCommand = self.feederH[ActionIndex].commandset[0].command;
        processedCommand = self.controller.readVariables(self.feederH[ActionIndex].commandset[0].command);
        processedCommand = self.controller.assignTo(RESULT, processedCommand, PastQueryValue);
        while (processedCommand != processedCommand.replace("$ListIndex", ListIndex)) {
          processedCommand = processedCommand.replace("$ListIndex", ListIndex);
        }
        self.controller.commandProcessor(processedCommand, commandSet.type)
          .then((result) => {
            console.log(result)
        })
        resolve();
      });
    };
  }
}
exports.directoryHelper = directoryHelper;
