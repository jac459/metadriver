var settings = 
{
  'mqtt' : 'localhost',
  'mqtt_topic' : 'meta/',
  'LogSeverity' : "INFO",
  'drivers':
  [
    {
      'name':'.meta', 
      'manufacturer':'JAC&Ton',
      'version':1,
      'type':'AVRECEIVER',
      'alwayson':'',
      'filename':'meta-core.json',
      'variables':{
          'MyStatus':'',
          'RoomKey':'',
          'DeviceKey':'',
          'ActivatedName':'',
          'ActivatedLib':'/steady/neeo-custom/Activated',
          'LibraryName':'',
          'UserLibrary':'/steady/neeo-custom/UserLibrary',
          'CoreLibrary':'Library',
          'TriggerKey':'',
          'Manifest':'https://raw.githubusercontent.com/jac459/metadriver/master/CustomDrivers.manifest',
          'DriverName': '',
          'DriverLocation':'',
          'DriverIcon':'',
          'DriverOrigin':'',
          'NewLogLevel':''
        },
      'labels':{
          'CurrentStatus' : {'label':'status', 'listen':'MyStatus'}
      },
      'directories':{
        "Settings": {"label":"Settings", 
        "feeders": {
          "Settings":{"label":"Settings", 
            "commandset": [{"type":"static", "command":"{}", "itemtype":"tile", "itemaction":"","itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/meta.jpg"},
              {"type":"static", "command":"[{\"name\":\"Active\", \"label\":\"Active Drivers\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/play.jpg\",\"navigation\":\"Active\"}, {\"name\":\"Library\", \"label\":\"Drivers Library\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/book.jpg\",\"navigation\":\"Library\"}, {\"name\":\"Recipes\", \"label\":\"Neeo Recipes\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/recipe.jpg\",\"navigation\":\"Recipes\"}, {\"name\":\"Tweak Zone\", \"label\":\"Tweak the .meta\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/tweak.jpg\",\"navigation\":\"Tweak\"},{\"name\":\"Danger Zone\", \"label\":\"Manage the .meta\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/warning.jpg\",\"navigation\":\"Manage\"}]", 
                "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").label", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
                "evalnext":[
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Active\")", "then":"Active", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Library\")", "then":"Library", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Recipes\")", "then":"Rooms", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Tweak\")", "then":"Tweak", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Manage\")", "then":"Manage", "or":""}
                ]
              }]
          },

          "Active":{"label":"Driver list", "commandset": [{"type":"cli", "command":"ls -1 $ActivatedLib\/*.json | xargs -n 1 basename| sed -e 's/\\.json$\/\/'", "queryresult":"/(.*)./gm", "itemname":"DYNAMIK \"$Result\"","itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/$Result.jpg\"", "itemtype": "listitem", "itemlabel":"Activated Driver", "evalnext":[{"test":true, "then":"ActiveChoice", "or":""}], "evalwrite":[{"variable":"ActivatedName","value":"$Result"}]
          }]},
          "ActiveChoice":{"label":"$ActivatedName", 
            "commandset": [
              {"type":"static", "command":"{}", "itemtype":"tile", "itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/$ActivatedName.jpg\""},
              {"type":"static", "command":"[{\"name\":\"Refresh\", \"label\":\"Refresh Driver\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/refresh.jpg\",\"navigation\":\"RefreshAction\"}, {\"name\":\"Delete\", \"label\":\"Delete Driver\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/delete.jpg\",\"navigation\":\"DeleteAction\"}]", 
                "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemUI" : "goBack", "itemlabel":"DYNAMIK \"$ActivatedName\"", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
                "itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation",
              }]
          },
          'RefreshAction':{'label':'Refresh Driver Data', 'commandset': [{'type':'cli', 'command':"DYNAMIK \"rm '$ActivatedLib/$ActivatedName-DataStore.json'\""}]},
          'DeleteAction':{'label':'Deactivate the Driver', 'commandset': [{'type':'cli', 'command':"DYNAMIK \"rm '$ActivatedLib/$ActivatedName.json'\"", "itemimage":""}]},
          
          'Library':{'label':'Drivers list', 'commandset': [
            {'type':'http-get', 'command':'$Manifest','queryresult': '$.driver.*','itemname':'DYNAMIK JSON.parse(\"$Result\").name','itemtype': 'listitem', 'itemimage': 'DYNAMIK JSON.parse(\"$Result\").IconLocation', "itemlabel":"External Driver", 'evalnext':[{'test':true, 'then':'LibraryChoice', 'or':''}], 'evalwrite':[{'variable':'DriverOrigin','value':'Extern'}, {'variable':'DriverName','value': 'DYNAMIK JSON.parse(\"$Result\").name'},  {'variable':'LibraryName','value':'DYNAMIK JSON.parse(\"$Result\").name'},{'variable':'DriverLocation','value':'DYNAMIK JSON.parse(\"$Result\").DriverLocation'},{'variable':'DriverIcon','value':'DYNAMIK JSON.parse(\"$Result\").IconLocation'}]},
            {'type':'cli', 'command':'ls -1 $CoreLibrary\/*.json | xargs -n 1 basename| grep -v "DataStore.json" |sed -e \'s/\\.json\/\/\'', 'queryresult':'/(.*)./gm', 'itemname':'DYNAMIK "$Result"', 'itemtype': 'listitem', "itemlabel":"Core Driver","itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/$Result.jpg\"", 'evalnext':[{'test':true, 'then':'LibraryChoice', 'or':''}], 'evalwrite':[{'variable':'DriverOrigin','value':'CoreLibrary'},{'variable':'DriverName','value': 'DYNAMIK \"$Result\"'},{'variable':'LibraryName','value':'$CoreLibrary'}]},
            {'type':'cli', 'command':'ls -1 $UserLibrary\/*.json | xargs -n 1 basename| grep -v "DataStore.json" |sed -e \'s/\\.json\/\/\'', 'queryresult':'/(.*)./gm', 'itemname':'DYNAMIK "$Result"', 'itemtype': 'listitem', "itemlabel":"User Driver", "itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/$Result.jpg\"", 'evalnext':[{'test':true, 'then':'LibraryChoice', 'or':''}], 'evalwrite':[{'variable':'DriverOrigin','value':'UserLibrary'},{'variable':'DriverName','value': 'DYNAMIK \"$Result\"'},{'variable':'LibraryName','value':'$UserLibrary'}]}          ]},

            "LibraryChoice":{"label":"$LibraryName", 
            "commandset": [
              {"type":"static", "command":"{}", "itemtype":"tile", "itemimage":"DYNAMIK  (\"$DriverOrigin\"== \"Extern\")?\"$DriverIcon\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/$DriverName.jpg\""},
              {"type":"static", "command":"{}","itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/play.jpg", 
                "itemname":"Activate Driver", "itemlabel":"DYNAMIK \"$DriverName\"", 
                "itemaction":"DYNAMIK  (\"$DriverOrigin\" == \"Extern\")?\"ActivateActionExternal\":\"ActivateAction\"","itemUI" : "goBack"
              }]
          },
          'ActivateAction':{'label':'', 'commandset': [{'type':'cli', 'command':"DYNAMIK \"cp  '$LibraryName/$DriverName.json' '$ActivatedLib'\"", "itemUI" : "goBack"}]},

          'ActivateActionExternal':{'label':'', 'commandset': [{'type':'cli', 'command':"DYNAMIK \"curl \" + \"$DriverLocation \" + \" -o \" + \" $ActivatedLib\" + \"/\" + \"$DriverName\"+ \".json\""}]},

          "Manage":{"label":"Manage the Meta", 
            "commandset": [
              {"type":"static", "command":"{}", "itemtype":"tile", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/warning.jpg"},

              {"type":"static", "command":"[{\"name\":\"Update\", \"label\":\"Update Meta\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/refresh.jpg\",\"navigation\":\"UpdateMeta\"}]", 
              "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").label", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
              "itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation","itemUI" : "goBack" 
              },
              {"type":"static", "command":"[{\"name\":\"Restart\", \"label\":\"Restart Meta\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/button.jpg\",\"navigation\":\"RestartMeta\"}]", 
              "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").label", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
              "itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation","itemUI" : "goBack" 
              }             
            ]
          },

          "Tweak":{"label":"Tweak the Meta", 
          "commandset": [
            {"type":"static", "command":"{}", "itemtype":"tile", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/tweak.jpg"},
            {"type":"static", "command":"[{\"name\":\"Reload drivers\", \"label\":\"Drivers only\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/reload.png\",\"navigation\":\"ReloadMeta\"}]", 
            "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").label", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
            "evalnext":[{"test":true, "then":"ReloadMeta", "or":""}]
            },
            {"type":"static", "command":"[{\"name\":\"Clear cache\", \"label\":\"Will change dynamically\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/cache.jpg\",\"navigation\":\"ClearCache\"}]", 
            "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").name", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
            "evalnext":[{"test":true, "then":"ClearCache", "or":""}]
          },
            {"type":"static", "command":"[{\"name\":\"Set Loglevel\", \"label\":\"Will change dynamically\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/log-level.png\",\"navigation\":\"LOGLEVEL\"}]", 
            "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").name", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
            "evalnext":[{"test":true, "then":"LOGLEVEL", "or":""}]
          },
            {"type":"static", "command":"[{\"name\":\"List versions\", \"label\":\"List versions\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/questionmarks.jpg\",\"navigation\":\"ListVersions\"}]", 
              "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").label", "itemlabel":"Using installmeta.sh", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
              "evalnext":[{"test":true, "then":"ListVersion", "or":""}]
            },
            {"type":"static", "command":"[{\"name\":\"Scan Local Network\", \"label\":\"Find me friends\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Input/ThemeStandard/input_net_radio.jpg\",\"navigation\":\"ScanNetwork\"}]", 
              "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").label", "itemlabel":"Devices found on boot.", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
              "evalnext":[{"test":true, "then":"Scan", "or":""}]
            }              
          ]
        },
          "LOGLEVEL":{"label":"", 
          "commandset": [
            {"type":"static", "command":"[{\"name\":\"QUIET\", \"label\":\"Set log to QUIET\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/log-quiet.png\",\"itemlabel\":\"Will be changed on the fly.\",\"navigation\":\"SETLOGLEVEL\"}]", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").itemlabel", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl","itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation","evalwrite":[{'variable':'NewLogLevel','value':'QUIET'}],"evalnext":[{"test":true, "then":"SETLOGLEVEL", "or":""}]},
            {"type":"static", "command":"[{\"name\":\"INFO\", \"label\":\"Set log to INFO\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/log-info.jpg\",\"itemlabel\":\"Will be changed on the fly.\",\"navigation\":\"SETLOGLEVEL\"}]", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").itemlabel", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl","itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation","evalwrite":[{'variable':'NewLogLevel','value':'INFO'}],"evalnext":[{"test":true, "then":"SETLOGLEVEL", "or":""}]},
            {"type":"static", "command":"[{\"name\":\"WARNING\", \"label\":\"Set log to WARNING\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/log-warning.jpg\",\"itemlabel\":\"Will be changed on the fly.\",\"navigation\":\"SETLOGLEVEL\"}]", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").itemlabel", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl","itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation","evalwrite":[{'variable':'NewLogLevel','value':'WARNING'}], "evalnext":[{"test":true, "then":"SETLOGLEVEL", "or":""}]},
            {"type":"static", "command":"[{\"name\":\"VERBOSE\", \"label\":\"Set log to VERBOSE\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/log-verbose.jpg\",\"itemlabel\":\"Will be changed on the fly.\",\"navigation\":\"SETLOGLEVEL\"}]", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").itemlabel", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl","itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation","evalwrite":[{'variable':'NewLogLevel','value':'VERBOSE'}], "evalnext":[{"test":true, "then":"SETLOGLEVEL", "or":""}]},
            {"type":"static", "command":"[{\"name\":\"DEBUG\", \"label\":\"Set log to DEBUG\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/log-debug.jpg\",\"itemlabel\":\"Will be changed on the fly.\",\"navigation\":\"SETLOGLEVEL\"}]", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").itemlabel", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl","itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation","evalwrite":[{'variable':'NewLogLevel','value':'DEBUG'}], "evalnext":[{"test":true, "then":"SETLOGLEVEL", "or":""}]},
          ]
        },
          'RestartMeta':{'label':'', 'commandset': [{'type':'cli', 'command':"pm2 restart meta", "itemUI" : "goBack"}]},
          'ReloadMeta':{'label':'', 'commandset': [{'type':'mqtt', "command":"{\"topic\":\"meta/.meta/Reload\",\"message\":\"meta\"}", "itemUI" : "reload"}],"itemaction":"Manage"},
          'ClearCache':{'label':'', 'commandset': [{'type':'mqtt', "command":"{\"topic\":\"meta/.meta/Clear\",\"message\":\"Cache\"}", "itemUI" : "Cache"}],"itemaction":"Manage"},
          'UpdateMeta':{'label':'', 'commandset': [{'type':'cli', 'command':"sh ~/installmeta.sh --meta-only", "itemUI" : "goBack"}]},
          'ListVersion':{'label':'', 'commandset':[{'type':'cli', 'command':'sh ~/installmeta.sh --get-versions','queryresult':'/(?<=Last version:).*/gm', 'itemname':'Installed/available', 'itemlabel':'DYNAMIK "$Result"', "itemimage":"https://raw.githubusercontent.com/jac459/meta-kodi/main/Icons/questionmarks.jpg",'itemUI' : 'goBack'}]},
          'SETLOGLEVEL':{'label':'', 'commandset': [{'type':'mqtt', "command":"{\"topic\":\"meta/.meta/LOGLEVEL\",\"message\":\"$NewLogLevel\"}", "itemUI" : "goBack"}]},
          'Scan':{'label':'', 'commandset':[{'type':'static', 'command':'$LocalDevices', 'queryresult':'$.*', 'itemname':'DYNAMIK JSON.parse("$Result").name', 'itemlabel':'DYNAMIK JSON.parse("$Result").addresses[0]'}]},

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
