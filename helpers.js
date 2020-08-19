const builtNameSeparator = '_@_';


function builtHelperName(name, deviceId) {
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

exports.builtHelperName = builtHelperName;
exports.getDeviceIdFromBuiltName = getDeviceIdFromBuiltName;
exports.getNameFromBuiltName = getNameFromBuiltName;
exports.getBuiltNameSeparator = getBuiltNameSeparator;
