
var DiscoveryCache = 
{
    "empty-entry":   {"timestamp": "0", "outputTable": "bar1"}
}

//LOGGING SETUP AND WRAPPING
//Disable the NEEO library console warning.
const { metaMessage, LOG_TYPE } = require("./metaMessage");
console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
function metaLog(message) {
  let initMessage = { component:'cacheController', type:LOG_TYPE.INFO, content:'', deviceId: null };
  let myMessage = {...initMessage, ...message}
  return metaMessage (myMessage);
} 

function GetATimeStamp() {
    let d = process.hrtime();// new Date();
    return d; // d.getMinutes()*60000+d.getSeconds()*1000+d.getMilliseconds()
  }  
  

  function DeleteCacheEntry(targetDeviceId){
    
    try {
        delete DiscoveryCache[targetDeviceId];
    }
    catch (err) {
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"Deleting failed for cache entry : " +  targetDeviceId});
    }
  }

  function DeleteOldestCacheEntry(){
    var Oldest=0,loopvalue;
    Oldest = Object.keys(DiscoveryCache)[0];
    for( loopvalue in DiscoveryCache) {
       if (DiscoveryCache[loopvalue].timestamp < DiscoveryCache[Oldest].timestamp)
          Oldest = loopvalue;
    };
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content: "Deleting oldest"+  targetDeviceId});
    delete DiscoveryCache[Oldest];
  
  }
  
  function AddDiscoveryCache(targetDeviceId,NewoutputTable){
    if (Object.keys(DiscoveryCache).length >10)
        DeleteOldestCacheEntry();
    DiscoveryCache[targetDeviceId] = {"timestamp":GetATimeStamp(),"outputTable":NewoutputTable}
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"Cache entry created for: " +  targetDeviceId});
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:DiscoveryCache});
  
  }
  
  function ValidateDiscoveryCache(targetDeviceId){
    if (DiscoveryCache[targetDeviceId]) {
      if(GetATimeStamp() - DiscoveryCache[targetDeviceId].timestamp < 120) { //Cache not expired?
        return DiscoveryCache[targetDeviceId].outputTable;  
      }
      else { 
        metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"Disposing of cache entry, as it was too old"});
        delete DiscoveryCache[targetDeviceId];
        return 0
      }
    }
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"DeviceID "+targetDeviceId +" is not cached"});
    return 0
  }
  exports.ValidateDiscoveryCache = ValidateDiscoveryCache;
  exports.AddDiscoveryCache = AddDiscoveryCache;
  exports.DeleteCacheEntry = DeleteCacheEntry;
