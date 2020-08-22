const INTERNALNAMESEPARATOR = '_@_';
const variablePattern = {'pre':'$','post':''};

function toInternalName(name, deviceId) {
  return (deviceId + INTERNALNAMESEPARATOR + name);
}
function getExternalName(name) {
    return name.split(INTERNALNAMESEPARATOR)[1];
}
function getBuiltNameSeparator(name) {
  return INTERNALNAMESEPARATOR;
}

class variablesVault {
  constructor() {
    this.variables = [];
    this.dataStore;
    var self = this;

    //add a variable if not already existing
    this.addVariable = function(name, value, deviceId) {
      let internalVariableName = toInternalName(name, deviceId);
      if (self.variables.findIndex((elt) => {elt.name == internalVariableName})<0) {//the variable is new
        self.variables.push({'name':toInternalName(name, deviceId), 'value':value, 'observers': []});
      }
    }

    this.addPersistedVariable = function(name, value, dataStore, deviceId) {
      return new Promise(function (resolve, reject) {
        self.dataStore = dataStore;
        try {
          self.retrieveValueFromDataStore(name, deviceId, dataStore).then((dsValue) => {
            if (dsValue != undefined) {
              self.addVariable(name, dsValue, true);
              resolve();
            }
            else {
              self.persistInDataStore(name, deviceId, value, dataStore).then (()=>{
                self.addVariable(name, value, true, deviceId);
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
          if (observersList.findIndex(func => {func == theFunction}) < 0) {//to avoid adding multiple times an oberver
            observersList.push(theFunction);
           }
        }
      }
      catch (err) {
        console.log("It seems that you haven\'t created the variable yet, you can't observe it.");
        console.log(err)
      }
    }

    this.writeVariable = function(name, value, deviceId) {//deviceId necessary as push to components.
      let internalVariableName = toInternalName(name, deviceId);
      let foundVar = self.variables.find(elt => {return elt.name == internalVariableName});
      if (foundVar.value != value) {// If the value changed.
        foundVar.value = value; //Write value here
        foundVar.observers.forEach(element => { //invoke all observers
          element(deviceId, foundVar.value);
        });
      }
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

    this.retrieveValueFromDataStore = function (name, deviceId, dataStore) {
      return new Promise(function (resolve, reject) {
        let internalVariableName = toInternalName(name, deviceId);
        self.getDataFromDataStore(dataStore).then((store) => {
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

    this.getDataFromDataStore = function (dataStore) {
      return new Promise(function (resolve, reject) {
        try {
          fs.readFile(dataStore, (err, data) => {
            if (data) {
              try {
                resolve(JSON.parse(data));
              }
              catch (err) {
                console.log('Your Datastore ' + dataStore + ' doesn\'t seems to have a good JSON format')
                console.log(err);
              }
            }
            else {resolve(undefined);}
          })
        }
        catch (err) {
          console.log("Could not access the datastore.")
          console.log(err)
        }
      })
    }

    this.persistInDataStore = function(name, deviceId, value, dataStore) {
      return new Promise(function (resolve, reject) {
        let internalVariableName = toInternalName(name, deviceId);
        let dataStoreEntry = {'name':internalVariableName,'value':value};
        self.getDataFromDataStore (dataStore).then((result) => {
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
          
          fs.unlink(dataStore,function(err){
            fs.writeFile(dataStore, JSON.stringify(result), err => {
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