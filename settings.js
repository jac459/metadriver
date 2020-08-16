var settings = 
{"drivers":
  [
    {"name":"Brain Navigator", 
    "manufacturer":"JAC",
    "version":10,
    "type":"AVRECEIVER",
    "variables":{
        "MyStatus":"",
        "RoomKey":"",
        "DeviceKey":"",
        "TriggerKey":""
  
    },
    "labels":{
        "CurrentStatus" : {"label":"status", "listen":"MyStatus"}
    },

    "directories":{
        "recipes": {"label":"", "feeders": {
            "Rooms":{"label":"Rooms list", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemtype": "listitem", "itemlabel":"Recipe name", "itembrowse":"DYNAMIK JSON.parse(\"$Result\").key", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg", "evalnext":[{"test":true, "then":"Devices", "or":"Rooms"}], "evalwrite":[{"variable":"RoomKey","value":"DYNAMIK JSON.parse(\"$Result\").key"}]}  
                                                     ]},
            "Devices":{"label":"Devices list", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"Recipe name", "itembrowse":"DYNAMIK JSON.parse(\"$Result\").key", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/devices.jpg", "evalnext":[{"test":true, "then":"Macros", "or":"Devices"}], "evalwrite":[{"variable":"DeviceKey","value":"DYNAMIK JSON.parse(\"$Result\").key"}]}
                                                      ]},
            "Macros":{"label":"Macros list", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"Recipe name", "itemaction":"ACTION_ActivateMacro", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Neeo_logo.jpg", "evalwrite":[{"variable":"TriggerKey","value":"DYNAMIK JSON.parse(\"$Result\").key"}]}]},
            "ACTION_ActivateMacro":{"label":"", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros/$TriggerKey/trigger", "queryresult":"$.*", "itemname":"", "itemlabel":"Recipe name", "itemaction":""}
                                                      ]}
            }
        }
    }
  }]
}
  
module.exports = settings;