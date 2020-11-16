const neeoapi = require('neeo-sdk');
const variablePattern = {'pre':'$','post':''};
const RESULT = variablePattern.pre + 'Result' + variablePattern.post;
const BROWSEID = variablePattern.pre + 'NavigationIdentifier' + variablePattern.post;
const MQTT = 'mqtt';

class directoryHelper {
  constructor(deviceId, dirname, controller) {
    this.name = dirname;
    this.deviceId = deviceId;
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

    this.evalNext = function (deviceId, evalnext, result, browseIdentifierValue) {
      if (evalnext) { //case we want to go to another feeder
        evalnext.forEach(evalN => {
          //if (evalN.test == '') {evalN.test = true}; //in case of no test, go to the do function TODO: correction, not working.
          let finalNextTest = self.controller.vault.readVariables(evalN.test, deviceId);// prepare the test to assign variable and be evaluated.
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
        //Take the good feeder:
        //Take the good commandset:
        let PastQueryValue = params.browseIdentifier.split("$PastQueryValue=")[1];
        console.log('PastQueryValue' + JSON.stringify(PastQueryValue))
        params.browseIdentifier = params.browseIdentifier.split("$PastQueryValue=")[0];
        let commandSetIndex = params.browseIdentifier.split("$CommandSet=")[1];
        params.browseIdentifier = params.browseIdentifier.split("$CommandSet=")[0];
        self.controller.evalWrite(self.feederH[self.currentFeederIndex].commandset[commandSetIndex].evalwrite, PastQueryValue, deviceId);
        self.evalNext(deviceId, self.feederH[self.currentFeederIndex].commandset[commandSetIndex].evalnext, PastQueryValue, params.browseIdentifier);//assign the good value to know the feeder
      }
      else if (params.history != undefined && params.history.length>0 && params.offset==0 && self.previousOffset == 0) {//case where we browse backward
        self.currentFeederIndex = self.browseHistory[params.history.length];
        if (self.currentFeederIndex == undefined) {self.currentFeederIndex = 0;}
        console.log('current feeder' + self.currentFeederIndex)
      }
      else if ( params.offset != undefined && params.offset>0) {
        self.previousOffset = params.offset;
      }
      else if ( params.offset != undefined && params.offset==0 && self.previousOffset > 0) {//we were scrolling and get back to begining of list either by up scroll or back button
        self.previousOffset = 0;
      }
      else {
        self.currentFeederIndex = 0
      } // beginning

      if (params.history != undefined) {
        if (self.browseHistory.length<params.history.length) {
          self.browseHistory.push(self.currentFeederIndex) //memorize the path of browsing for feeder 
        }
        else {self.browseHistory[params.history.length] = self.currentFeederIndex}
      }

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

        self.fillTheList(deviceId, cacheList, allconfigs, params, 0, 0).then((cacheList) => {//cacheList, allconfigs, params, indentCommand
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
                    actionIdentifier: (cacheList[i].action ? cacheList[i].action + "$ListIndex=" + (i-1) : cacheList[i].action), //For support of index
                    uiAction: cacheList[i].UI ? cacheList[i].UI : ''
                })
                if ((i+1 < cacheList.length) && (cacheList[i+1].itemtype == 'tile')) {
                  //test if the next item is also a tile to put on the right, if it is not the end of the list
                  i++
                  tiles.push({
                    thumbnailUri: cacheList[i].image,
                    actionIdentifier: cacheList[i].action,
                    uiAction: cacheList[i].UI ? cacheList[i].UI : ''
                  });
                }
                neeoList.addListTiles(tiles);
              }
              else {
                neeoList.addListItem({
                  title: cacheList[i].name,
                  label: cacheList[i].label,
                  thumbnailUri: cacheList[i].image,
                  actionIdentifier: (cacheList[i].action ? cacheList[i].action + "$ListIndex=" + (i-1) : cacheList[i].action), //For support of index
                  browseIdentifier: cacheList[i].browse,
                  uiAction: cacheList[i].UI ? cacheList[i].UI : ((cacheList[i].action != '' || cacheList[i].action != undefined) ? '' : 'reload'),
                });
              }
            }
            resolve(neeoList);
          })
        
      })
    }

    this.fillTheList = function (deviceId, cacheList, allconfigs, params, indentCommand) {
        let rAction;
        let rUI;
        let rBrowse;
        let rName;
        let rItemType;
        let rImage;
        let rLabel;
        return new Promise(function (resolve, reject) {
          if (indentCommand < allconfigs.commandset.length) {
            cacheList, allconfigs, params, indentCommand
            let commandSet = allconfigs.commandset[indentCommand];
            let processedCommand = self.controller.assignTo(BROWSEID, commandSet.command, params.browseIdentifier);
            processedCommand = self.controller.vault.readVariables(processedCommand, deviceId);
            console.log('Final processed Command:' + processedCommand);
            self.controller.commandProcessor(processedCommand, commandSet.type, deviceId)
              .then((result) => {
                rName = self.controller.vault.readVariables(commandSet.itemname, deviceId); //ensure that the item name chain has the variable interpreted (except $Result)
                rImage = self.controller.vault.readVariables(commandSet.itemimage, deviceId); 
                rItemType = self.controller.vault.readVariables(commandSet.itemtype, deviceId); 
                rLabel = self.controller.vault.readVariables(commandSet.itemlabel, deviceId); 
                rAction = self.controller.vault.readVariables(commandSet.itemaction, deviceId); 
                rUI = self.controller.vault.readVariables(commandSet.itemUI, deviceId); 
                rBrowse = self.controller.vault.readVariables(commandSet.itembrowse, deviceId); 
                self.controller.queryProcessor(result, commandSet.queryresult, commandSet.type, deviceId).then ((tempResultList) => {
                  let resultList = [];
                  if (!Array.isArray(tempResultList)) {//must be an array so make it an array if not
                    resultList.push(tempResultList);
                  }
                  else {resultList = tempResultList;}

                  resultList.forEach(oneItemResult => { //As in this case, $Result is a table, transform $Result to get every part of the table as one $Result
                    cacheList.push({
                      'name' : self.controller.assignTo(RESULT, rName, oneItemResult),
                      'image' : self.controller.assignTo(RESULT, rImage, oneItemResult),
                      'itemtype' : rItemType,
                      'label' : self.controller.assignTo(RESULT, rLabel, oneItemResult),
                      'action' : rAction ? self.controller.assignTo(RESULT, rAction, oneItemResult)+"$CommandSet="+indentCommand+"$PastQueryValue=" + ((typeof(oneItemResult) == 'string')?oneItemResult:JSON.stringify(oneItemResult)) : rAction,
                      'UI' : self.controller.assignTo(RESULT, rUI, oneItemResult),
                      'browse' : "$CommandSet="+indentCommand+"$PastQueryValue=" + ((typeof(oneItemResult) == 'string')?oneItemResult:JSON.stringify(oneItemResult))
                    });
                  });
                  resolve(self.fillTheList(deviceId, cacheList, allconfigs, params, indentCommand + 1));
                })
                
              })
              .catch(function (err) {
                console.log("Fetching error: ");
                console.log(err);
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
      return new Promise(function (resolve, reject) {
          
        //here, the action identifier is the result.  
        let ListIndex = params.actionIdentifier.split("$ListIndex=")[1];
        params.actionIdentifier = params.actionIdentifier.split("$ListIndex=")[0];
        let PastQueryValue = params.actionIdentifier.split("$PastQueryValue=")[1];
        //MQTT Logging
        self.controller.commandProcessor("{\"topic\":\"" + "/" + self.controller.name + "\",\"message\":\"{\\\"type\\\":\\\"directory\\\", \\\"name\\\":\\\"" + self.name + "\\\", \\\"value\\\":\\\"" + ListIndex + "\\\"}\"}", MQTT, deviceId)
        params.actionIdentifier = params.actionIdentifier.split("$PastQueryValue=")[0];
        let commandSetIndex = params.actionIdentifier.split("$CommandSet=")[1];
        params.actionIdentifier = params.actionIdentifier.split("$CommandSet=")[0];
        if (self.feederH[self.currentFeederIndex].commandset[commandSetIndex]) {
          self.controller.evalWrite(self.feederH[self.currentFeederIndex].commandset[commandSetIndex].evalwrite, PastQueryValue, deviceId);
        }
        //finding the feeder which is actually an action feeder
        let ActionIndex = self.feederH.findIndex((feed) => {return (feed.name == params.actionIdentifier)});
        
        //Processing all commandset recursively
        resolve(self.executeAllActions(deviceId, PastQueryValue, ListIndex, self.feederH[ActionIndex].commandset, 0));
      });
    };

    this.executeAllActions = function (deviceId, PastQueryValue, ListIndex, allCommandSet, indexCommand) {
      return new Promise(function (resolve, reject) {
        if (indexCommand < allCommandSet.length){
          let commandSet = allCommandSet[indexCommand]; 
          self.controller.evalWrite(commandSet.evalwrite, PastQueryValue, deviceId);
          let processedCommand = commandSet.command;
          processedCommand = self.controller.vault.readVariables(processedCommand, deviceId);
          processedCommand = self.controller.assignTo(RESULT, processedCommand, PastQueryValue);
          while (processedCommand != processedCommand.replace("$ListIndex", ListIndex)) { // Manage Index values
            processedCommand = processedCommand.replace("$ListIndex", ListIndex);
          } 
          console.log(processedCommand);
          self.controller.commandProcessor(processedCommand, commandSet.type, deviceId)
            .then((resultC) => {
              console.log(resultC);
          
              self.controller.queryProcessor(resultC, commandSet.queryresult, commandSet.type, deviceId)
              .then ((result) => {
                console.log(result)
                resolve(self.executeAllActions(deviceId, result, ListIndex, allCommandSet, indexCommand+1))
              })
              .catch ((err) => {
                console.log("Error while parsing the command result.")
                resolve(err);
              })
          })
        }
        else
        {
          resolve(); 
        } 
      })           
    };
  }
}
exports.directoryHelper = directoryHelper;