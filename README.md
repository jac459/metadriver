# metadriver
Programmable driver for Neeo to command any http device or command-line activated device.

##Install
Just type 
```npm install jsonpath```
then type 
```node MetaDriver.js```

This driver is in Beta.

This read me is in alpha. 
TO install:
npm install jsonpath.

And then you can directly run with 
node MetaDriver.js

And please refere to this in order to produce your own jpath:
https://www.npmjs.com/package/jsonpath


You need to edit the settings.js
Adding your own interactions.

## Features
- Control any device with rest api.
- Control any device with cli calls.
- Create sliders 
- Create lists (directories) 
- link buttons with sliders
- Chained commands (one button have different behaviour each time pressed, example, mute toggle will mute on or off when pressed)
- Added Variable Management for complexe integrations => a button or a choice in a list, can write in a variable, this variable can be reused by other components.

## To do

- Wake On Lan command
- other protocoles (Websockets, TCP, MQTT, ...)

# Settings (target structure) spec:
```
var settings = 
{"drivers": "./metadrivers" //path where to put the drivers definitions files
}
  
module.exports = settings;
```

Then one driver definition:


var driver = :
{
   "NAME":"Yamaha Receiver", //DeviceName
   "MANUFACTURER":"Yamaha", //Manufaturer
   "VERSION":21, // UI version, change to reload the remote.
   "BUTTONS":{
        "POWER ON": {"LABEL":"", "TYPE:"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=on", "queryresult":"$.response_code",                          "write":{["VARIABLENAME", "<*@MyVariable@*><*@Result@*><*#Transfo1#<*@anothervariable"@*>#*>"],
                      ["VARIABLENAME", "<*@MyVariable@*><*@Result@*><*#Transfo1#<*@anothervariable"@*>#*>"],},
             "donext":{[<*&EQUAL() ]},
  "variables":{
    "CurrentPath":"",
  },    
  "operators":{
    "CurrentPath":"",
  },    
        
        "POWER OFF": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=standby", "queryresult":"$.response_code", "expectedresult":"0", "fallbackbutton":""},
        "VOLUME UP": {"label":"", "type":"slidercontrol", "slidername":"VOLUME", "step":"5"},
        "VOLUME DOWN": {"label":"", "type":"slidercontrol", "slidername":"VOLUME", "step":"-5"},
        "MUTE TOGGLE": {"label":"", "type":"http-get", "commands":["http://192.168.1.24/YamahaExtendedControl/v1/main/setMute?enable=true","http://192.168.1.24/YamahaExtendedControl/v1/main/setMute?enable=false"], "queryresult":"$.response_code", "expectedresult":"0", "fallbackbutton":""},
        "INPUT HDMI 1": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT HDMI 2": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi2", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT HDMI 3": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi3", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT HDMI 4": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi4", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT HDMI 5": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi5", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT HDMI 6": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi6", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT AV1": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av1", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT AV2": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av2", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
        "INPUT AV3": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av3", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
      },
      "sliders":{
        "VOLUME": {"label":"", "min" : 0, "max" : 161, "unit" : "db", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v2/main/setVolume?volume=", "statuscommand":"http://192.168.1.24/YamahaExtendedControl/v2/main/getStatus", "querystatus":"$.volume"},
      },
      "directories":{
        "INPUT": {"label":"", "feeders": {
            "Inputs":{"label":"", "querylabel":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v2/system/getFeatures", "actioncommand":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=", "queryname":"$.system.input_list[*].id", "imageurl":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Input/ThemeStandard/input_", "imageurlpost":".jpg", "queryimage":""},
          }
        },
        "DSP": {"label":"", "feeders": {
          "DSP": {"label":"", "querylabel":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/getSoundProgramList", "actioncommand":"http://192.168.1.24/YamahaExtendedControl/v1/main/setSoundProgram?program=", "queryname":"$.sound_program_list[*]", "imageurl":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/DSP/ThemeStandard/", "imageurlpost":"_sce.jpg", "queryimage":""},
        }
      }
    }

//      "directories":{
//        "INPUT": {"label":"", "querylabel":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v2/system/getFeatures", "actioncommand":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=", "queryname":"$.system.input_list[*].id", "imageurl":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Input/ThemeStandard/input_", "imageurlpost":".jpg", "queryimage":""},
//        "DSP": {"label":"", "querylabel":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/getSoundProgramList", "actioncommand":"http://192.168.1.24/YamahaExtendedControl/v1/main/setSoundProgram?program=", "queryname":"$.sound_program_list[*]", "imageurl":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/DSP/ThemeStandard/", "imageurlpost":"_sce.jpg", "queryimage":""},
//      },
    },
    {"name":"MiTV", 
      "manufacturer":"Xiaomi",
      "version":7,
      "buttons":{
        //"CURSOR ENTER": {"label":"", "type":"wol", "command":"50:A0:09:46:31:EA", "queryresult":"", "expectedresult":"", "fallbackbutton":""},
        //"POWER ON": {"label":"", "type":"wol", "command":"50:a0:09:46:31:ea", "queryresult":"", "expectedresult":"", "fallbackbutton":""},

        "CURSOR LEFT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=left", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "CURSOR RIGHT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=right", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "CURSOR UP": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=up", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "CURSOR DOWN": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=down", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "CURSOR ENTER": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=enter", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "POWER ON": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=getinstalledapp&count=999&changeIcon=1", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":"POWER ON-IR"},
        "POWER ON-IR": {"label":"", "type":"http-get", "command":"http://192.168.1.26:3000/v1/projects/home/rooms/6394342251295670272/devices/6689940872680701952/macros/6689940872756199425/trigger", "queryresult":"$.estimatedDuration", "expectedresult":"2000", "fallbackbutton":""},
        "POWER OFF": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=power", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "VOLUME UP": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumeup", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "VOLUME DOWN": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumedown", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "MENU": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=menu", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "BACK": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=back", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "EXIT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=exit", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "INPUT HDMI 1": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=changesource&source=HDMI1", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "INPUT HDMI 2": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=changesource&source=HDMI2", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
        "INPUT HDMI 3": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=changesource&source=HDMI3", "queryresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      },
      "directories":{
        "Applications": {"label":"", "feeders": {
            "Applications":{"label":"", "queryname":"$.data.AppInfo[*].PackageName", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=getinstalledapp&count=999&changeIcon=1", "actioncommand":"http://192.168.1.33:6095/controller?action=startapp&type=packagename&packagename=", "queryname":"$.data.AppInfo[*].AppName", "imageurl":"", "imageurlpost":"", "queryimage":"$.data.AppInfo[*].IconURL"},
            }
        }
      }
    },
/*    {"name":"Brain Navigator", 
    "manufacturer":"JAC",
    "version":4,
      "directories":{
        "recipes": {"label":"The recipes in my brain", "queryname":"$.*..devices.*.roomName", "type":"http-get", "command":"http://192.168.1.26:3000/v1/projects/home/rooms/", "actioncommand":"", "queryname":"$.*..devices.*.name", "imageurl":"", "imageurlpost":"", "queryimage":""},
      },
    },
    {"name":"cli demonstrator", 
      "manufacturer":"JAC",
      "version":7,
      "variables":{
        "CurrentPath":"",
      },
      "buttons":{
        "CURSOR OK": {"label":"", "type":"cli", "command":"cd @=>CurrentPath<=@ ; pwd", "queryresult":"\n", "expectedresult":"", "fallbackbutton":"", "variable2assign":"CurrentPath"},
        "CURSOR LEFT": {"label":"", "type":"cli", "command":"cd @=>CurrentPath<=@/.. ; pwd", "queryresult":"\n", "expectedresult":"", "fallbackbutton":"", "variable2assign":"CurrentPath"},
      },
//      "directories":{
//        "Files": {"label":"FileSystem", "queryname":"", "type":"cli", "command":"cd @=>CurrentPath<=@ ; find \"$(pwd)\" -maxdepth 1", "actioncommand":"", "queryname":"\n", "imageurl":"", "imageurlpost":"", "queryimage":"", "variable2assign":"CurrentPath"},
//      },
    },
*/    {"name":"Volumio2", 
      "manufacturer":"Volumio",
      "version":1,
      "variables":{
      },
      "buttons":{
        "CURSOR OK": {"label":"", "type":"cli", "command":"cd @=>CurrentPath<=@ ; pwd", "queryresult":"\n", "expectedresult":"", "fallbackbutton":"", "variable2assign":"CurrentPath"},
      },
      "directories":{
        "Collection": {"label":"My Artists", "feeders": {
            "Artists":{"label":"", "querylabel":"", "type":"http-get", "command":"http://volumio.local/api/v1/browse?uri=artists://", "actioncommand":"", "queryname":"$.navigation.lists[0].items[*].title", "imageurl":"http://volumio.local", "imageurlpost":"", "queryimage":"$.navigation.lists[0].items[*].albumart", "variable2assign":"", "nextdatafeeder":"albums"},
            "Albums":{"label":"", "querylabel":"", "type":"http-get", "command":"http://volumio.local/api/v1/browse?uri=artists://", "actioncommand":"", "queryname":"$.navigation.lists[0].items[*].title", "imageurl":"http://volumio.local", "imageurlpost":"", "queryimage":"$.navigation.lists[0].items[*].albumart", "variable2assign":"", "nextdatafeeder":"albums"},
          }
        }
      }
    }
  ]
}
  
module.exports = settings;
