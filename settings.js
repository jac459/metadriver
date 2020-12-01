var settings = 
{
  'mqtt' : 'localhost',
  'mqtt_topic' : 'meta/',
  'drivers':
  [
    {
      'name':'.meta', 
      'manufacturer':'JAC',
      'version':11,
      'type':'AVRECEIVER',
      'filename':'meta-core.json',
      'variables':{
          'MyStatus':'',
          'RoomKey':'',
          'DeviceKey':'',
          'TriggerKey':''
      },
      'labels':{
          'CurrentStatus' : {'label':'status', 'listen':'MyStatus'}
      },

      'directories':{
        "Settings": {"label":"Settings", 
        "feeders": {
          "Settings":{"label":"Settings", 
            "commandset": [{"type":"static", "command":"", "itemtype":"tile", "itemaction":"","itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/meta.jpg"},
              {"type":"static", "command":"[{\"name\":\"Active\", \"label\":\"Active Drivers\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/guitar.jpg\",\"navigation\":\"Active\"}, {\"name\":\"Library\", \"label\":\"Drivers Library\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/record.jpg\",\"navigation\":\"Library\"}, {\"name\":\"Recipes\", \"label\":\"Neeo Recipes\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/record.jpg\",\"navigation\":\"Recipes\"}]", 
                "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").name", "itembrowse":"DYNAMIK JSON.parse(\"$Result\").title", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
                "evalnext":[
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Active\")", "then":"Active", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Library\")", "then":"Library", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Recipes\")", "then":"Rooms", "or":""}
                ]
              }]
            },
            'Active':{'label':'Drivers list', 'commandset': [{'type':'cli', 'command':'find ./activated -maxdepth 1 -name \'*.json\' -not -name \'*-DataStore.json\'', 'queryresult':'/^.\/activated\/.*/gm', 'itemname':'DYNAMIK "$Result".split("activated/")[1]', 'itemtype': 'listitem', 'itemlabel':'Recipe name', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg', 'evalnext':[{'test':true, 'then':'Devices', 'or':'Rooms'}], 'evalwrite':[]}]},
            'Rooms':{'label':'Rooms list', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/', 'queryresult':'$.*', 'itemname':'DYNAMIK JSON.parse("$Result").name', 'itemtype': 'listitem', 'itemlabel':'Recipe name', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg', 'evalnext':[{'test':true, 'then':'Devices', 'or':'Rooms'}], 'evalwrite':[{'variable':'RoomKey','value':'DYNAMIK JSON.parse("$Result").key'}]}]},
            'Devices':{'label':'Devices list', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices', 'queryresult':'$.*', 'itemname':'DYNAMIK JSON.parse("$Result").name', 'itemlabel':'Recipe name', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/devices.jpg', 'evalnext':[{'test':true, 'then':'Macros', 'or':'Devices'}], 'evalwrite':[{'variable':'DeviceKey','value':'DYNAMIK JSON.parse("$Result").key'}]}
                                                      ]},
            'Macros':{'label':'Macros list', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros', 'queryresult':'$.*', 'itemname':'DYNAMIK JSON.parse("$Result").name', 'itemlabel':'Recipe name', 'itemaction':'ACTION_ActivateMacro', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Neeo_logo.jpg', 'evalwrite':[{'variable':'TriggerKey','value':'DYNAMIK JSON.parse("$Result").key'}]}]},
            'ACTION_ActivateMacro':{'label':'', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros/$TriggerKey/trigger', 'queryresult':'$.*', 'itemname':'', 'itemlabel':'Recipe name', 'itemaction':''}
                                ]}
        }
      }
     }
    }
  ]
}
  
module.exports = settings;