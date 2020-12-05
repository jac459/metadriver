var settings = 
{
  'mqtt' : 'localhost',
  'mqtt_topic' : 'meta/',
  'drivers':
  [
    {
      'name':'.meta', 
      'manufacturer':'JAC',
      'version':12,
      'type':'AVRECEIVER',
      'alwayson':'',
      'filename':'meta-core.json',
      'variables':{
          'MyStatus':'',
          'RoomKey':'',
          'DeviceKey':'',
          'ActivatedName':'',
          'LibraryName':'',
          'UserLibrary':'deactivated',
          'CoreLibrary':'Library',
          'TriggerKey':''
      },
      'labels':{
          'CurrentStatus' : {'label':'status', 'listen':'MyStatus'}
      },

      'directories':{
        "Settings": {"label":"Settings", 
        "feeders": {
          "Settings":{"label":"Settings", 
            "commandset": [{"type":"static", "command":"{}", "itemtype":"tile", "itemaction":"","itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/meta.jpg"},
              {"type":"static", "command":"[{\"name\":\"Active\", \"label\":\"Active Drivers\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/play.jpg\",\"navigation\":\"Active\"}, {\"name\":\"Library\", \"label\":\"Drivers Library\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/book.jpg\",\"navigation\":\"Library\"}, {\"name\":\"Recipes\", \"label\":\"Neeo Recipes\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/recipe.jpg\",\"navigation\":\"Recipes\"}, {\"name\":\"Restart\", \"label\":\"Restart the .meta\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/warning.jpg\",\"navigation\":\"Restart\"}]", 
                "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK JSON.parse(\"$Result\").label", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
                "evalnext":[
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Active\")", "then":"Active", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Library\")", "then":"Library", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Recipes\")", "then":"Rooms", "or":""},
                  {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Restart\")", "then":"Restart", "or":""}
                ]
              }]
          },

          'Active':{'label':'Drivers list', 'commandset': [
            {'type':'cli', 'command':'find ./activated -maxdepth 1 -name \'*.json\' -not -name \'*-DataStore.json\'', 'queryresult':'/^.\/activated\/.*/gm', 'itemname':'DYNAMIK "$Result".split("activated/")[1]', 'itemtype': 'listitem', 'itemlabel':'Activated Driver', "itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/\" + \"$Result\".split(\"activated/\")[1].split(\".json\")[0] + \".jpg\"", 'evalnext':[{'test':true, 'then':'ActiveChoice', 'or':''}], 'evalwrite':[{'variable':'ActivatedName','value':'$Result'}]
          }]},
          "ActiveChoice":{"label":"$ActivatedName", 
            "commandset": [
              {"type":"static", "command":"{}", "itemtype":"tile", "itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/\" + \"$ActivatedName\".split(\"activated/\")[1].split(\".json\")[0] + \".jpg\""},
              {"type":"static", "command":"[{\"name\":\"Refresh\", \"label\":\"Refresh Driver\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/refresh.jpg\",\"navigation\":\"RefreshAction\"}, {\"name\":\"Delete\", \"label\":\"Delete Driver\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/delete.jpg\",\"navigation\":\"DeleteAction\"}]", 
                "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"DYNAMIK \"$ActivatedName\".split(\"activated/\")[1].split(\".json\")[0]", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
                "itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation",
              }]
          },
          'RefreshAction':{'label':'Refresh Driver Data', 'commandset': [{'type':'cli', 'command':"DYNAMIK \"rm \" + \"$ActivatedName\".replace(\".json\", \"-DataStore.json\")", "itemUI" : "goBack"}]},
          'DeleteAction':{'label':'Deactivate the Driver', 'commandset': [{'type':'cli', 'command':"rm $ActivatedName", "itemUI" : "goBack", "itemimage":""}]},
          
          'Library':{'label':'Drivers list', 'commandset': [
            {'type':'cli', 'command':'find ./$CoreLibrary -maxdepth 1 -name \'*.json\' -not -name \'*-DataStore.json\'', 'queryresult':'/^.\/$CoreLibrary\/.*/gm', 'itemname':'DYNAMIK "$Result".split("$CoreLibrary/")[1]', 'itemtype': 'listitem', "itemlabel":"Core Driver","itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/\" + \"$Result\".split(\"$CoreLibrary/\")[1].split(\".json\")[0] + \".jpg\"", 'evalnext':[{'test':true, 'then':'LibraryChoice', 'or':''}], 'evalwrite':[{'variable':'LibraryName','value':'$Result'}]},
            {'type':'cli', 'command':'find ./$UserLibrary -maxdepth 1 -name \'*.json\' -not -name \'*-DataStore.json\'', 'queryresult':'/^.\/$UserLibrary\/.*/gm', 'itemname':'DYNAMIK "$Result".split("$UserLibrary/")[1]', 'itemtype': 'listitem', "itemlabel":"User Driver", "itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/\" + \"$Result\".split(\"$UserLibrary/\")[1].split(\".json\")[0] + \".jpg\"", 'evalnext':[{'test':true, 'then':'LibraryChoice', 'or':''}], 'evalwrite':[{'variable':'LibraryName','value':'$Result'}]}
          ]},
          "LibraryChoice":{"label":"$LibraryName", 
            "commandset": [
              {"type":"static", "command":"{}", "itemtype":"tile", "itemimage":"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/Drivers/\" + \"$LibraryName\".split(\"/\")[\"$LibraryName\".split(\"/\").length-1].split(\".json\")[0] + \".jpg\""},
              {"type":"static", "command":"[{\"name\":\"Activate\", \"label\":\"Activate Driver\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/play.jpg\",\"navigation\":\"ActivateAction\"}]", 
                "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").label", "itemlabel":"DYNAMIK \"$LibraryName\".split(\"/\")[\"$LibraryName\".split(\"/\").length-1].split(\".json\")[0]", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
                "itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation",
              }]
          },
          'ActivateAction':{'label':'', 'commandset': [{'type':'cli', 'command':"DYNAMIK \"cp \" + \"$LibraryName \" + \"./activated/\" + \"$LibraryName\".split(\"/\")[\"$LibraryName\".split(\"/\").length-1]", "itemUI" : "goBack"}]},

          "Restart":{"label":"Restart the Meta", 
            "commandset": [
              {"type":"static", "command":"{}", "itemtype":"tile", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/warning.jpg"},
              {"type":"static", "command":"[{\"name\":\"Restart\", \"label\":\"Restart Meta\", \"imageurl\":\"https://raw.githubusercontent.com/jac459/metadriver/master/pictures/button.jpg\",\"navigation\":\"RestartMeta\"}]", 
                "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").label", "itemlabel":"UI will be unresponsive for 1 min. This wil apply your change", "itemimage":"DYNAMIK JSON.parse(\"$Result\").imageurl",
                "itemaction":"DYNAMIK JSON.parse(\"$Result\").navigation",
              }]
          },
          'RestartMeta':{'label':'', 'commandset': [{'type':'cli', 'command':"pm2 restart meta", "itemUI" : "goBack"}]},

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