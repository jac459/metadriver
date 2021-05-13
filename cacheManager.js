
var DiscoveryCache = {};
const CacheEntryNotFound=''; 
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
  
  function EraseCacheCompletely(){
    
    DiscoveryCache = {}
        metaLog({ type:LOG_TYPE.ALWAYS, content:"Delete cache result:"});
    metaLog({ type:LOG_TYPE.ALWAYS, content:DiscoveryCache});

    
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
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content: "Deleting oldest cache-entry"+  targetDeviceId});
    delete DiscoveryCache[Oldest];
  
  }
  function DisplayCache() {
    var targetDeviceId = "init";
  try {
    DiscoveryCacheKeys = Object.keys(DiscoveryCache);
    metaLog({type:LOG_TYPE.DEBUG, content:"Cache-contents, dept =" + DiscoveryCacheKeys.length});

    metaLog({type:LOG_TYPE.DEBUG, content:"dept:" + DiscoveryCacheKeys.length});
    for (var i =0;i<DiscoveryCacheKeys.length;i++) {
      targetDeviceId = DiscoveryCacheKeys[i];
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"==========" + i});      
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:DiscoveryCache[DiscoveryCacheKeys[i]].timestamp});
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:DiscoveryCache[DiscoveryCacheKeys[i]].outputTable});
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:DiscoveryCache[DiscoveryCacheKeys[i]].state});
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"==========" +i});      
      }
  }
catch (err) {metaLog({type:LOG_TYPE.ERROR, content:"Error in DisplayCache "+ err});}
}

  function AddDiscoveryCache(targetDeviceId,NewoutputTable,status){
    try { 
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"Adding "+status+" cache-entry for: " +  targetDeviceId});

    if (Object.keys(DiscoveryCache).length >50&& DiscoveryCache[targetDeviceId] != undefined)
        DeleteOldestCacheEntry();
    DiscoveryCache[targetDeviceId] = {"timestamp":GetATimeStamp(),"outputTable":NewoutputTable,"state":status}
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:DiscoveryCache});
    if (DiscoveryCache[targetDeviceId].state == "COMPLETED") 
      metaLog({deviceId: targetDeviceId, type:LOG_TYPE.INFO, content:DiscoveryCache[targetDeviceId]});
      
      
  return DiscoveryCache[targetDeviceId] 
    }
    catch (err) {console.log("error in adddiscovery",err);}
  }
  
  function ValidateDiscoveryCache(targetDeviceId){
  try{
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"Cache entry checking" });
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:DiscoveryCache});
    if (DiscoveryCache[targetDeviceId]) {
        metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"Cache entry found"});
        return DiscoveryCache[targetDeviceId];  
        }
        
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.DEBUG, content:"Cache entry not found"});
    
    return CacheEntryNotFound;
  }
  catch (err) {
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ERROR, content:"Error in ValidateDiscoveryCache: " + err});

    }
  }

  exports.ValidateDiscoveryCache = ValidateDiscoveryCache;
  exports.AddDiscoveryCache = AddDiscoveryCache;
  exports.DeleteCacheEntry = DeleteCacheEntry;
  exports.EraseCacheCompletely = EraseCacheCompletely;
  exports.DisplayCache = DisplayCache;