var settings = 
{"drivers":
  [
    {
      name:"Yamaha Network Receiver", 
      manufacturer:"Yamaha",
      version:5,
      variables:{
        MyStatus:"",
        IsMuted:"true",
        InputName:"",
        InputLabel:"",
        InputImage:"",
      },
      labels:{
        "CurrentStatus" : {label:"status", listen:"MyStatus"},
      },
      buttons:{
        "POWER ON": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=on", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"Receiver On\":\"Command Failed\""}]},
        "POWER OFF": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=standby", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"Receiver On\":\"Command Failed\""}]},
        "VOLUME UP": {"label":"", "type":"slidercontrol", "slidername":"VOLUME", "step":"5"},
        "VOLUME DOWN": {"label":"", "type":"slidercontrol", "slidername":"VOLUME", "step":"-5"},
        "MUTE TOGGLE": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setMute?enable=$IsMuted", queryresult:"$.response_code",  evalwrite:[{variable:"MyStatus",value:"($Result==0)?(($IsMuted==true)?\"Receiver muted\":\"Receiver unmuted\"):\"Command failed\""},
                                                                                                                                                                                   {variable:"IsMuted",value:"($IsMuted==false)?true:false" }]},
        "INPUT HDMI 1": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"HDMI 1 set\":\"Command Failed\""}]},
        "INPUT HDMI 2": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"HDMI 2 set\":\"Command Failed\""}]},
        "INPUT HDMI 3": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"HDMI 3 set\":\"Command Failed\""}]},
        "INPUT HDMI 4": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"HDMI 4 set\":\"Command Failed\""}]},
        "INPUT HDMI 5": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"HDMI 5 set\":\"Command Failed\""}]},
        "INPUT HDMI 6": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"HDMI 6 set\":\"Command Failed\""}]},
        "INPUT AV1": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"AV 1 set\":\"Command Failed\""}]},
        "INPUT AV2": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av2", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"AV 2 set\":\"Command Failed\""}]},
        "INPUT AV3": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av3", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"($Result==0)?\"AV 3 set\":\"Command Failed\""}]},
      },
      sliders:{
        "VOLUME": {label:"", min : 0, max : 161, unit : "db", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v2/main/setVolume?volume=", statuscommand:"http://192.168.1.24/YamahaExtendedControl/v2/main/getStatus", queryresult:"$.volume"},
      },
      directories:{
        "INPUT": {label:"", feeders: {
                "Inputs":{label:"", querylabel:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v2/system/getFeatures", queryresult:"$.system.input_list[*]", itemname:"JSON.parse(\"$Result\").id", itemlabel:"\"Yamaha input\"", itemaction:"\"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=\" + JSON.parse(\"$Result\").id", itemimage:"\"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Input/ThemeStandard/input_\" + JSON.parse(\"$Result\").id + \".jpg\""},
                  },
         },
        "DSP": {label:"", feeders: {
          "DSP": {label:"", querylabel:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/getSoundProgramList", queryresult:"$.sound_program_list[*]", itemname:"\"$Result\"", itemlabel:"\"Yamaha DSP\"", itemaction:"\"http://192.168.1.24/YamahaExtendedControl/v1/main/setSoundProgram?program=\" + \"$Result\"", itemimage:"\"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/DSP/ThemeStandard/$Result_sce.jpg\""},
         }
        } 
      }
  },
  {
    name:"MiTV Box", 
    manufacturer:"Xiaomi",
    version:8,
    variables:{
      MyStatus:"",
    },
    labels:{
      "CurrentStatus" : {label:"status", listen:"MyStatus"},
    },
    buttons:{
      "CURSOR LEFT": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=left", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Left pressed\":\"Command Failed\""}]},
      "CURSOR RIGHT": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=right", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Right pressed\":\"Command Failed\""}]},
      "CURSOR UP": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=up", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Up pressed\":\"Command Failed\""}]},
      "CURSOR DOWN": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=down", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Down pressed\":\"Command Failed\""}]},
      "CURSOR CURSOR": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=enter", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Ok pressed\":\"Command Failed\""}]},
      "INPUT HDMI 1": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=changesource&source=HDMI1", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"HDMI 1 Source\":\"Command Failed\""}]},
      "INPUT HDMI 2": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=changesource&source=HDMI2", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"HDMI 2 Source\":\"Command Failed\""}]},
      "INPUT HDMI 3": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=changesource&source=HDMI3", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"HDMI 3 Source\":\"Command Failed\""}]},
      "MENU": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=menu", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Menu pressed\":\"Command Failed\""}]},
      "BACK": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=back", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Back pressed\":\"Command Failed\""}]},
      "EXIT": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=exit", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Exit pressed\":\"Command Failed\""}]},
      "VOLUME UP": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumeup", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Volume up\":\"Command Failed\""}]},
      "VOLUME DOWN": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumedown", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Volume down\":\"Command Failed\""}]},
      "POWER ON": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=getinstalledapp&count=999&changeIcon=1", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"TV is ON\":\"Trying to Switch on by IR\""}], evaldo:[{test:"\"$Result\"==\"success\"", then:"", or:"POWER ON-IR"}]},
      "POWER ON-IR": {label:"", type:"http-get", command:"http://192.168.1.26:3000/v1/projects/home/rooms/6394342251295670272/devices/6689940872680701952/macros/6689940872756199425/trigger", queryresult:"$.estimatedDuration", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"2000\")?\"IR called done\":\"Could not call the IR\""}]},
      "POWER OFF": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=power", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"OFF pressed\":\"Command Failed\""}]},
      
    },
    directories:{
      "Programs": {label:"", feeders: {
              "Programs":{label:"", querylabel:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=getinstalledapp&count=999&changeIcon=1", queryresult:"$.data.AppInfo[*]", itemname:"JSON.parse(\"$Result\").AppName", itemlabel:"\"Android TV App\"", itemaction:"\"http://192.168.1.33:6095/controller?action=startapp&type=packagename&packagename=\" + JSON.parse(\"$Result\").PackageName", itemimage:"JSON.parse(\"$Result\").IconURL"},
                },
       },
     }
},
   /* {
      "name":"LG TV", 
      "manufacturer":"LG",
      "version":4,
      "buttons":{
        "POWER ON": {"label":"", "type":"wol", "command":"10:08:C1:33:FA:4E", "queryresult":"", "expectedresult":"", "fallbackbutton":""},
        "POWER OFF": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/off", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},

        "CURSOR LEFT": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/left", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR RIGHT": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/right", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR UP": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/top", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR DOWN": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/bottom", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR ENTER": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/ok", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "VOLUME UP": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/sound-plus", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "VOLUME DOWN": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/sound-minus", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "MENU": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/home", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "BACK": {"label":"", "type":"http-post", "command":{"post":"http://localhost:1234/command/back", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
      },
      "directories":{
        "Applications": {"label":"", "feeders": {
            "Applications":{"label":"", "queryname":"$.data.AppInfo[*].PackageName", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=getinstalledapp&count=999&changeIcon=1", "actioncommand":"http://192.168.1.33:6095/controller?action=startapp&type=packagename&packagename=", "queryname":"$.data.AppInfo[*].AppName", "imageurl":"", "imageurlpost":"", "queryimage":"$.data.AppInfo[*].IconURL"},
            }
        }
      }
    },
 
 */ {"name":"Brain Navigator", 
    "manufacturer":"JAC",
    "version":10,
    variables:{
      MyStatus:"",
      RoomKey:"",
      DeviceKey:"",
    },
    labels:{
      "CurrentStatus" : {label:"status", listen:"MyStatus"},
    },
    buttons:{
      "CURSOR LEFT": {label:"", type:"static", command:"{\"\":\"Left\"}", queryresult:"$.*", evalwrite:[{variable:"MyStatus",value:"\"$Result\""}], evaldo:[{test:true, then:"CURSOR RIGHT", or:"CURSOR ENTER"}]},
      "CURSOR RIGHT": {label:"", type:"static", command:"{\"\":\"Right\"}", queryresult:"$.*", evalwrite:[{variable:"MyStatus",value:"\"$Result\""}]},
      "CURSOR ENTER": {label:"", type:"static", command:"{\"\":\"Enter\"}", queryresult:"$.*", evalwrite:[{variable:"MyStatus",value:"\"$Result\""}]},
     },
    directories:{
      "recipes": {label:"", feeders: {
            "Rooms":{label:"Rooms list", type:"http-get", command:"\"http://192.168.1.130:3000/v1/projects/home/rooms/\"", queryresult:"$.*", itemname:"JSON.parse(\"$Result\").name", itemlabel:"\"Recipe name\"", itembrowse:"JSON.parse(\"$Result\").key", itemimage:"\"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg\"", evalnext:[{test:true, then:"Devices", or:"Rooms"}], evalwrite:[{variable:"RoomKey",value:"\"$Result\""}]},
            "Devices":{label:"Devices list", type:"http-get", command:"\"http://192.168.1.130:3000/v1/projects/home/rooms/$RoomKey/devices\"", queryresult:"$.*", itemname:"JSON.parse(\"$Result\").name", itemlabel:"\"Recipe name\"", itembrowse:"JSON.parse(\"$Result\").key", itemimage:"\"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/devices.jpg\"", evalnext:[{test:true, then:"Macros", or:"Devices"}], evalwrite:[{variable:"DeviceKey",value:"\"$Result\""}]},
            "Macros":{label:"Macros list", type:"http-get", command:"\"http://192.168.1.130:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros\"", queryresult:"$.*", itemname:"JSON.parse(\"$Result\").name", itemlabel:"\"Recipe name\"", itemaction:"\"http://192.168.1.130:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros/\" + JSON.parse(\"$Result\").key + \"/trigger\"", itemimage:"\"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Neeo_logo.jpg\""},
          },
        },
      },
    },
    {"name":"Volumio 2", 
    "manufacturer":"Volumio",
    "version":1,
    variables:{
      MyStatus:"",
    },
    labels:{
      "CurrentStatus" : {label:"status", listen:"MyStatus"},
    },
    buttons:{
      "CURSOR LEFT": {label:"", type:"static", command:"{\"\":\"Left\"}", queryresult:"$.*", evalwrite:[{variable:"MyStatus",value:"\"$Result\""}], evaldo:[{test:true, then:"CURSOR RIGHT", or:"CURSOR ENTER"}]},
      "CURSOR RIGHT": {label:"", type:"static", command:"{\"\":\"Right\"}", queryresult:"$.*", evalwrite:[{variable:"MyStatus",value:"\"$Result\""}]},
      "CURSOR ENTER": {label:"", type:"static", command:"{\"\":\"Enter\"}", queryresult:"$.*", evalwrite:[{variable:"MyStatus",value:"\"$Result\""}]},
     },
    directories:{
      "Collection": {label:"My music", feeders: {
            "Artists":{label:"Artists list", type:"http-get", command:"\"http://volumio.local/api/v1/browse?uri=artists://\"", queryresult:"$.navigation.lists[0].items[*]", itemname:"JSON.parse(\"$Result\").title", itemlabel:"\"Artist Collection\"", itembrowse:"JSON.parse(\"$Result\").title", itemimage:"\"http://volumio.local\" + JSON.parse(\"$Result\").albumart", evalnext:[{test:true, then:"Albums", or:""}]},
            "Albums":{label:"Albums list", type:"http-get", command:"\"http://volumio.local/api/v1/browse?uri=artists://\" + \"$Result\"", queryresult:"$.*[name,key]", itemname:"\"$Result\"", itemlabel:"\"Recipe name\"", itembrowse:"\"$Result\"", itemimage:"\"\"", evalnext:[{test:true, then:"CURSOR RIGHT", or:"CURSOR ENTER"}]},
          },
        },
      },
    },
  /*   {name:"cli demonstrator", 
      manufacturer:"JAC",
      version:15,
      variables:{
        CurrentPath:"/home/pi",
        ResultPath:"",
      },
      labels:{
        "CurrentStatus" : {label:"", listen:"ResultPath"},
      },
      buttons:{
        "CURSOR OK": {label:"", type:"static", command:"{\"\":\"Final22Value\"}", "queryresult":"$.*", "evaldo":[{"test":"\"$Result\"==\"FinalValue\"","then":"","or":""}], "evalwrite":[{"variable":"ResultPath","value":"$CurrentPath$Result"}]},
      },
      directories:{
      //  "Files": {"label":"FileSystem", "type":"cli", "command":"cd @=>CurrentPath<=@ ; find \"$(pwd)\" -maxdepth 1", "actioncommand":"", "queryname":"\n", "imageurl":"", "imageurlpost":"", "queryimage":"", "variable2assign":"CurrentPath"},
      },
    },
/*   {"name":"Volumio2", 
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
    }*/
  ]
}
  
module.exports = settings;