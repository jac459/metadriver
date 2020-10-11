var settings = 
{'drivers':
  [
    {
      'name':'Brain Navigator', 
      'manufacturer':'JAC',
      'version':10,
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
          'recipes': {'label':'', 'feeders': {
              'Rooms':{'label':'Rooms list', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/', 'queryresult':'$.*', 'itemname':'DYNAMIK JSON.parse("$Result").name', 'itemtype': 'listitem', 'itemlabel':'Recipe name', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg', 'evalnext':[{'test':true, 'then':'Devices', 'or':'Rooms'}], 'evalwrite':[{'variable':'RoomKey','value':'DYNAMIK JSON.parse("$Result").key'}]}  
                                                      ]},
              'Devices':{'label':'Devices list', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices', 'queryresult':'$.*', 'itemname':'DYNAMIK JSON.parse("$Result").name', 'itemlabel':'Recipe name', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/devices.jpg', 'evalnext':[{'test':true, 'then':'Macros', 'or':'Devices'}], 'evalwrite':[{'variable':'DeviceKey','value':'DYNAMIK JSON.parse("$Result").key'}]}
                                                        ]},
              'Macros':{'label':'Macros list', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros', 'queryresult':'$.*', 'itemname':'DYNAMIK JSON.parse("$Result").name', 'itemlabel':'Recipe name', 'itemaction':'ACTION_ActivateMacro', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Neeo_logo.jpg', 'evalwrite':[{'variable':'TriggerKey','value':'DYNAMIK JSON.parse("$Result").key'}]}]},
              'ACTION_ActivateMacro':{'label':'', 'commandset': [{'type':'http-get', 'command':'http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros/$TriggerKey/trigger', 'queryresult':'$.*', 'itemname':'', 'itemlabel':'Recipe name', 'itemaction':''}
                                                        ]}
              }
          }
      }
    },
    {
      'name':'Clock', 
      'manufacturer':'JAC',
      'version':1,
      'type':'AVRECEIVER',
      'filename':'meta-core.json',
      'variables':{
          'MyZone':'Africa/Abidjan',
          'MyTime':''
      },
      'labels':{
        'Time' : {'label':'Current Time', 'listen':'MyTime'},
        'Zone' : {'label':'My timezone', 'listen':'MyZone'}
      },
      "listeners" : {
        "Time" : {"type":"http-get", "command":"http://worldtimeapi.org/api/timezone/$MyZone", "pooltime":"1000", "poolduration":"", "queryresult" : "$.", 
          "evalwrite" : [ 
               {"variable" : "MyTime", "value" : "DYNAMIK \"Date : \" + JSON.parse(\"$Result\")[0].datetime.split(\"T\")[0] + \" - Time : \" + JSON.parse(\"$Result\")[0].datetime.split(\"T\")[1].split(\".\")[0]"}
            ]
        }
      },
      'directories':{
          'TimeZone': {'label':'', 'feeders': {
              'TimeZone':{'label':'TimeZone list', 'commandset': [{'type':'http-get', 'command':'http://worldtimeapi.org/api/timezone', 'queryresult':'$.*', 'itemname':'$Result', 'itemtype': 'listitem', 'itemaction':'TimeZoneSet', 'itemlabel':'Zone', 'itemimage':'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg', "evalwrite":[{"variable":"MyZone","value":"$Result"}]}]},
              "TimeZoneSet":{"label":"", "commandset": [{"type":"static", "command":""}]}
            }
          }
        }
    }
  ]
}
  
module.exports = settings;