const path = require('path');
const fs = require('fs');
const INTERNALNAMESEPARATOR = '_@_';
const variablePattern = {'pre':'$','post':''};


function toInternalName(name, deviceId) {
  return (deviceId + INTERNALNAMESEPARATOR + name);
}
function getExternalName(name) {
    return name.split(INTERNALNAMESEPARATOR)[1];
}
function getDeviceId(name) {
  return name.split(INTERNALNAMESEPARATOR)[0];
}
function getBuiltNameSeparator(name) {
  return INTERNALNAMESEPARATOR;
}

class variablesVault {
  constructor() {
    this.variables = [];
    this.dataStore;
    var self = this;

    this.initialiseVault= function(filename) {
      self.dataStore = filename;
        //Initialise the variable to datastore value.
       // self.variables = []; can't do that for multiple discovered devices

        self.getDataFromDataStore().then((DS) => {
          if (DS) {
            DS.forEach(element => {
                self.addVariable(getExternalName(element.name), element.value, getDeviceId(element.name), true);
            });
          }
        })

    }

    //add a variable if not already existing
    this.addVariable = function(name, value, deviceId, persisted) {
      let internalVariableName = toInternalName(name, deviceId);
      persisted = persisted || false;
      if (self.variables.findIndex((elt) => {return elt.name == internalVariableName})<0) {//the variable is new
        self.variables.push({'name':internalVariableName, 'value':value, 'observers': [], 'persisted':persisted});
      }
    }

    this.addPersistedVariable = function(name, value, deviceId) {
      return new Promise(function (resolve, reject) {
        try {
          self.retrieveValueFromDataStore(name, deviceId).then((dsValue) => {
            if (dsValue != undefined) {
              self.addVariable(name, dsValue, deviceId, true);
              resolve();
            }
            else {
              self.persistInDataStore(name, deviceId, value).then (()=>{
                self.addVariable(name, value, deviceId, true);
                resolve();
              })
            }
          })
        }
        catch (err) {
          console.log('Error in persisting the variables')
          console.log(err)
        }
      })
    }

    this.addObserver = function(name, theFunction, deviceId) { // who listen to variable changes.
      try {
        let internalVariableName = toInternalName(name, deviceId);
        if (name != undefined && name != '' && theFunction != undefined && theFunction) {
          let observersList = self.variables.find(elt => {return elt.name == internalVariableName}).observers; 
          if (observersList.findIndex(func => {return func == theFunction}) < 0) {//to avoid adding multiple times an oberver
            observersList.push(theFunction);
           }
        }
      }
      catch (err) {
        console.log("It seems that you haven\'t created the variable yet, you can't observe it.");
        console.log(err)
      }
    }

    this.getValue = function(name, deviceId) {
      let internalVariableName = toInternalName(name, deviceId);
      let indexRes = self.variables.findIndex(elt => {return elt.name == internalVariableName});
      if (indexRes<0) {
        return undefined
      } 
      else {
        return self.variables[indexRes].value;
      }
    }

    this.writeVariable = function(name, value, deviceId) {//deviceId necessary as push to components.
      let internalVariableName = toInternalName(name, deviceId);
      let foundVar = self.variables.find(elt => {return elt.name == internalVariableName});
      if (!foundVar) {console.log("The variable you are requesting doesn\'t seems to be properly declared.")}
      if (foundVar) {
        if (foundVar.persisted) {//if the variable is persisted, we need to save it in the datastore
          self.persistInDataStore(name, deviceId, value);
        }
        if (foundVar.value != value) {// If the value changed.
          foundVar.value = value; //Write value here
          foundVar.observers.forEach(element => { //invoke all observers
            element(deviceId, foundVar.value);
          });
        }
      }
      else {console.log("Variable " + name + " with device " + deviceId + " not found. Can't assign value.")}
    }

    this.readVariables = function(inputChain, deviceId) { //replace in the input chain, all the variables found of the same deviceId
      let preparedResult = inputChain;
      if (typeof(preparedResult) == 'object') {
        preparedResult = JSON.stringify(preparedResult);
      }
      if (typeof(preparedResult) == 'string')
        self.variables.forEach(variable => {
          if (variable.name.startsWith(deviceId+getBuiltNameSeparator())) {//we get the full name including the deviceId
            let token = variablePattern.pre + getExternalName(variable.name);//get only the name variable
            while (preparedResult != preparedResult.replace(token, variable.value)) {
              preparedResult = preparedResult.replace(token, variable.value);
            }
          }
      })
      return preparedResult;
    }

    this.retrieveValueFromDataStore = function (name, deviceId) {
      return new Promise(function (resolve, reject) {
        let internalVariableName = toInternalName(name, deviceId);
        self.getDataFromDataStore().then((store) => {
          if (store) {
            let valueIndex = store.findIndex((key) => {return key.name == internalVariableName});
            if (valueIndex>=0) {
              resolve(store[store.findIndex((key) => {return key.name == internalVariableName})].value);
            }
            else {resolve(undefined)}
          } 
          else {resolve(undefined)}
        })
      })
    } 

    this.getDataFromDataStore = function () {
      return new Promise(function (resolve, reject) {
        try {
          if (self.dataStore) {
            fs.readFile(self.dataStore, (err, data) => {
              if (data) {
                try {
                  resolve(JSON.parse(data));
                }
                catch (err) {
                  console.log('Your Datastore ' + self.dataStore + ' doesn\'t seems to have a good JSON format')
                  console.log(err);
                }
              }
              else {resolve(undefined);}
              if (err) {
                console.log('Error accessing the datastore file.')
                console.log(err)
              }
            })
          }
        }
        catch (err) {
          console.log("Could not access the datastore.")
          console.log(err)
        }
      })
    }

    this.persistInDataStore = function(name, deviceId, value) {
      return new Promise(function (resolve, reject) {
        let internalVariableName = toInternalName(name, deviceId);
        let dataStoreEntry = {'name':internalVariableName,'value':value};
        self.getDataFromDataStore (self.dataStore).then((result) => {
          if (result) {//There is a datastore.
            let keyIndex = result.findIndex((key) => {return key.name == internalVariableName});
            if (keyIndex>=0) {//the entry already exists
              result[keyIndex].value = value;
            }
            else {// New entry to be created
              result.push(dataStoreEntry)
            }
          }
          else {//new datastore to be created
              result = [];
              result.push(dataStoreEntry)
          }
          //now we need to save the datastore
          
          fs.unlink(self.dataStore,function(err){
            console.log('datastore' + JSON.stringify(result))
            fs.writeFile(self.dataStore, JSON.stringify(result), err => {
              if (err) {
                  console.log('Error writing in the datastore');
                  console.log(err);
              } else {
                  console.log('New value ' + value + ' saved in the datastore entry ' + name);
              }
              resolve(dataStoreEntry);
            })
          });  
   
        })
      })
    }
  }  
}
exports.variablesVault = variablesVault;