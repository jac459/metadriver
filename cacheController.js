var DiscoveryCache = 
{
    "empty-entry":   {"timestamp": "0", "outputTable": "bar1"}
}
function GetATimeStamp() {
    let d = new Date();
    return  d.getMinutes()*60000+d.getSeconds()*1000+d.getMilliseconds()
  }  
  

  function DeleteCacheEntry(t){
    var Oldest=0,loopvalue;
    Oldest = Object.keys(DiscoveryCache)[0];
    for( loopvalue in DiscoveryCache) {
       if (DiscoveryCache[loopvalue].timestamp < DiscoveryCache[Oldest].timestamp)
          Oldest = loopvalue;
    };
    console.log("Deleting oldest", DiscoveryCache[Oldest]);
    delete DiscoveryCache[Oldest];
  
  }

  function DeleteOldestCacheEntry(){
    var Oldest=0,loopvalue;
    Oldest = Object.keys(DiscoveryCache)[0];
    for( loopvalue in DiscoveryCache) {
       if (DiscoveryCache[loopvalue].timestamp < DiscoveryCache[Oldest].timestamp)
          Oldest = loopvalue;
    };
    console.log("Deleting oldest", DiscoveryCache[Oldest]);
    delete DiscoveryCache[Oldest];
  
  }
  
  function AddDiscoveryCache(targetDeviceId,NewoutputTable){
    if (Object.keys(DiscoveryCache).length >10)
        DeleteOldestCacheEntry();
    DiscoveryCache[targetDeviceId] = {"timestamp":GetATimeStamp(),"outputTable":NewoutputTable}
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ALWAYS, content:"Cache entry created for: " +  targetDeviceId});
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ALWAYS, content:DiscoveryCache});
  
  }
  
  function ValidateDiscoveryCache(targetDeviceId){
    if (DiscoveryCache[targetDeviceId]) {
      if(GetATimeStamp() - DiscoveryCache[targetDeviceId].timestamp < 120000) { //Cache not expired?
        return DiscoveryCache[targetDeviceId].outputTable;  
      }
      else { 
        metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ALWAYS, content:"Disposing of cache entry, as it was too old"});
        delete DiscoveryCache[targetDeviceId];
        return 0
      }
    }
    metaLog({deviceId: targetDeviceId, type:LOG_TYPE.ALWAYS, content:"DeviceID "+targetDeviceId +" is not cached"});
    return 0
  }
  exports.ValidateDiscoveryCache = ValidateDiscoveryCache;
  exports.AddDiscoveryCache = AddDiscoveryCache;
