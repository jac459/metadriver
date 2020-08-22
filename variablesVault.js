const builtNameSeparator = '_@_';
const variablePattern = {'pre':'$','post':''};

function toInternalName(name, deviceId) {
  return (deviceId + builtNameSeparator + name);
}
function getDeviceIdFromBuiltName(name) {
    return name.split(builtNameSeparator)[0];
}
function getNameFromBuiltName(name) {
    return name.split(builtNameSeparator)[1];
}
function getBuiltNameSeparator(name) {
  return builtNameSeparator;
}

class variablesVault {
  constructor() {
    this.variables = [];
    var self = this;

    //add a variable if not already existing
    this.addVariable = function(name, value, deviceId) {
      let internalVariableName = toInternalName(name, deviceId);
      if (self.variables.findIndex((elt) => {elt.name == internalVariableName})<0) {//the variable is new
        self.variables.push({'name':toInternalName(name, deviceId), 'value':value, 'observers': []});
      }
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
            let token = variablePattern.pre + getNameFromBuiltName(variable.name);//get only the name variable
            while (preparedResult != preparedResult.replace(token, variable.value)) {
              preparedResult = preparedResult.replace(token, variable.value);
            }
          }
      })
      return preparedResult;
    }
  }  
}
exports.variablesVault = variablesVault;