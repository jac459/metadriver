var settings = 
{"drivers":
  [
    {
      name:"Yamaha Network Receiver", 
      manufacturer:"Yamaha",
      type:"AVRECEIVER", //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
      //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
      icon:"sonos",
      version:7,
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
        "POWER ON": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=on", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"Receiver On\":\"Command Failed\""}]},
        "POWER OFF": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=standby", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"Receiver On\":\"Command Failed\""}]},
        "VOLUME UP": {label:"", "type":"slidercontrol", "slidername":"VOLUME", "step":"5"},
        "VOLUME DOWN": {label:"", "type":"slidercontrol", "slidername":"VOLUME", "step":"-5"},
        "MUTE TOGGLE": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setMute?enable=$IsMuted", queryresult:"$.response_code",  evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?(($IsMuted==true)?\"Receiver muted\":\"Receiver unmuted\"):\"Command failed\""},
                                                                                                                                                                                   {variable:"IsMuted",value:"DYNAMIK ($IsMuted==false)?true:false" }]},
        "INPUT HDMI 1": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"HDMI 1 set\":\"Command Failed\""}]},
        "INPUT HDMI 2": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi2", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"HDMI 2 set\":\"Command Failed\""}]},
        "INPUT HDMI 3": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi3", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"HDMI 3 set\":\"Command Failed\""}]},
        "INPUT HDMI 4": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi4", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"HDMI 4 set\":\"Command Failed\""}]},
        "INPUT HDMI 5": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi5", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"HDMI 5 set\":\"Command Failed\""}]},
        "INPUT HDMI 6": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=hdmi6", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"HDMI 6 set\":\"Command Failed\""}]},
        "INPUT AV1": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av1", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"AV 1 set\":\"Command Failed\""}]},
        "INPUT AV2": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av2", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"AV 2 set\":\"Command Failed\""}]},
        "INPUT AV3": {label:"", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=av3", queryresult:"$.response_code", evalwrite:[{variable:"MyStatus",value:"DYNAMIK ($Result==0)?\"AV 3 set\":\"Command Failed\""}]},
      },
      sliders:{
        "VOLUME": {label:"", min : 0, max : 161, unit : "db", type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v2/main/setVolume?volume=", statuscommand:"http://192.168.1.24/YamahaExtendedControl/v2/main/getStatus", queryresult:"$.volume"},
      },
      directories:{
        "INPUT": {label:"", feeders: {
                "Inputs":{label:"", commandset: [{type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v2/system/getFeatures", queryresult:"$.system.input_list[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").id", itemlabel:"Yamaha input", itemaction:"DYNAMIK \"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=\" + JSON.parse(\"$Result\").id", itemimage:"DYNAMIK \"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Input/ThemeStandard/input_\" + JSON.parse(\"$Result\").id + \".jpg\""}]},
                  },
         },
        "DSP": {label:"", feeders: {
          "DSP": {label:"", commandset: [{type:"http-get", command:"http://192.168.1.24/YamahaExtendedControl/v1/main/getSoundProgramList", queryresult:"$.sound_program_list[*]", itemname:"$Result", itemlabel:"Yamaha DSP", itemaction:"http://192.168.1.24/YamahaExtendedControl/v1/main/setSoundProgram?program=$Result", itemimage:"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/DSP/ThemeStandard/$Result_sce.jpg"}]},
         }
        } 
      }
  },
  {
    name:"MiTV Box", 
    manufacturer:"Xiaomi",
    version:8,
    type:"AVRECEIVER", //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
    //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
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
      "CURSOR OK": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=enter", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Ok pressed\":\"Command Failed\""}]},
      "INPUT HDMI 1": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=changesource&source=HDMI1", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"HDMI 1 Source\":\"Command Failed\""}]},
      "INPUT HDMI 2": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=changesource&source=HDMI2", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"HDMI 2 Source\":\"Command Failed\""}]},
      "INPUT HDMI 3": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=changesource&source=HDMI3", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"HDMI 3 Source\":\"Command Failed\""}]},
      "MENU": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=menu", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Menu pressed\":\"Command Failed\""}]},
      "BACK": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=back", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Back pressed\":\"Command Failed\""}]},
      "EXIT": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=exit", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Exit pressed\":\"Command Failed\""}]},
      "VOLUME UP": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumeup", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Volume up\":\"Command Failed\""}]},
      "VOLUME DOWN": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumedown", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"Volume down\":\"Command Failed\""}]},
      "POWER ON": {label:"", type:"http-get", command:"http://192.168.1.33:6095/controller?action=getinstalledapp&count=999&changeIcon=1", queryresult:"$.msg", evalwrite:[{variable:"MyStatus",value:"(\"$Result\"==\"success\")?\"TV is ON\":\"Trying to Switch on by IR\""}], evaldo:[{test:"DYNAMIC \"$Result\"==\"success\"", then:"", or:"POWER ON-IR"}]},
      "POWER ON-IR": {label:"", type:"http-get", command:"http://192.168.1.26:3000/v1/projects/home/rooms/6394342251295670272/devices/6689940872680701952/macros/6689940872756199425/trigger", queryresult:"$.estimatedDuration", evalwrite:[{variable:"MyStatus",value:"DYNAMIC (\"$Result\"==\"2000\")?\"IR called done\":\"Could not call the IR\""}]},
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
 
 */ 
{
  name:"Plex Remote", 
  manufacturer:"Plex",
  version:7,
  type:"AVRECEIVER", //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
  //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
  variables:{
    Token:"Ea6Q4hnybqknyhwXEnS4",
    PlexIP:"192.168.1.10",
    MyStatus:"Ready",
    SectionKey:"Ready",
  },
  labels:{
    "CurrentStatus" : {label:"status", listen:"MyStatus"},
  },  
  buttons:{
  },
  directories:{
    Library: {label:"", feeders: {
          "Collection":{label:"Gallery", commandset: [{type:"http-get-soap", command:"http://192.168.1.138:32400/library/sections?X-Plex-Token=$Token", queryresult:"/MediaContainer/Directory", itemtype: "listitem", itemname:"DYNAMIK JSON.parse(\"$Result\").Directory.title", itemlabel:"DYNAMIK \"Type - \" + JSON.parse(\"$Result\").Directory.type", itembrowse:"DYNAMIK JSON.parse(\"$Result\").Directory.title", itemimage:"DYNAMIK \"http://192.168.1.138:32400\" + JSON.parse(\"$Result\").Directory.thumb + \"?X-Plex-Token=$Token\"", 
            evalnext:[{test:"DYNAMIK JSON.parse(\"$Result\").Directory.type == \"photo\"", then:"Gallery", or:""},{test:"DYNAMIK JSON.parse(\"$Result\").Directory.type == \"movie\"", then:"Movies", or:""},{test:"DYNAMIK JSON.parse(\"$Result\").Directory.type == \"artist\"", then:"Music", or:""},
          ], evalwrite:[{variable:"SectionKey",value:"DYNAMIK JSON.parse(\"$Result\").Directory.Location.id"}]},
          ]},
          "Gallery":{label:"Gallery", commandset: [{type:"http-get-soap", command:"http://192.168.1.138:32400/library/sections/$SectionKey/all?X-Plex-Token=$Token", itemtype: "tile", queryresult:"/MediaContainer/Photo", itemname:"DYNAMIK JSON.parse(\"$Result\").Photo.title", itemlabel:"", itembrowse:"", itemimage:"DYNAMIK \"http://192.168.1.138:32400\" + JSON.parse(\"$Result\").Photo.thumb + \"?X-Plex-Token=$Token\"", evalnext:[{test:true, then:"Devices", or:"Rooms"}], evalwrite:[{variable:"",value:""}]}]},
          "Music":{label:"My music", commandset: [{type:"http-get-soap", command:"http://192.168.1.138:32400/library/sections/$SectionKey/all?X-Plex-Token=$Token", itemtype: "tile", queryresult:"/MediaContainer/artist", itemname:"DYNAMIK JSON.parse(\"$Result\").Photo.title", itemlabel:"", itembrowse:"", itemimage:"DYNAMIK \"http://192.168.1.138:32400\" + JSON.parse(\"$Result\").Photo.thumb + \"?X-Plex-Token=$Token\"", evalnext:[{test:true, then:"Devices", or:"Rooms"}], evalwrite:[{variable:"",value:""}]}]},
          "Movies":{label:"My movies", commandset: [{type:"http-get-soap", command:"http://192.168.1.138:32400/library/sections/$SectionKey/all?X-Plex-Token=$Token", itemtype: "listitem", queryresult:"/MediaContainer/Video", itemname:"DYNAMIK JSON.parse(\"$Result\").Video.title", itemlabel:"DYNAMIK JSON.parse(\"$Result\").Video.tagline", itembrowse:"", itemimage:"DYNAMIK \"http://192.168.1.138:32400\" + JSON.parse(\"$Result\").Video.thumb + \"?X-Plex-Token=$Token\"", evalwrite:[{variable:"",value:""}]},
          ]},
                                }
              }
  }

},
{name:"Brain Navigator", 
    manufacturer:"JAC",
    type:"AVRECEIVER", //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
    //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
//    icon:"sonos",//neeo-brain
    version:29,
    variables:{
      MyStatus:"",
      RoomKey:"",
      DeviceKey:"",
      TriggerKey:"",
      MyPicture:"https://scontent.fsin5-1.fna.fbcdn.net/v/t1.0-9/s960x960/83258087_10156692837451196_8122948557457063936_o.jpg?_nc_cat=109&_nc_sid=8024bb&_nc_ohc=pW8b6Dvy070AX9XJIND&_nc_ht=scontent.fsin5-1.fna&_nc_tp=7&oh=d5f9ac574e9e31977f23791c1848e501&oe=5F4490D2"
    },
    sensors:{
      MySensor : {label:"", type:"string", listen:"MyStatus"}
    },
    images:{
      "MyCover" : {label:"", size : "small", listen:"MyPicture"},
      "MyCover2" : {label:"", size : "large", listen:"MyPicture"}
    },
    labels:{
      "CurrentStatus" : {label:"status", listen:"MyStatus"},
    },
    buttons:{
      "CURSOR LEFT": {label:"", type:"static", command:"{name:\"\"}", queryresult:"", evalwrite:[{variable:"MyPicture",value:"DYNAMIK (true)?\"https://scontent.fsin5-1.fna.fbcdn.net/v/t1.0-9/s960x960/83258087_10156692837451196_8122948557457063936_o.jpg?_nc_cat=109&_nc_sid=8024bb&_nc_ohc=pW8b6Dvy070AX9XJIND&_nc_ht=scontent.fsin5-1.fna&_nc_tp=7&oh=d5f9ac574e9e31977f23791c1848e501&oe=5F4490D2\":\"Command Failed\""}]},
      "CURSOR ENTER": {label:"", type:"static", command:"{name:\"\"}", queryresult:"", evalwrite:[{variable:"MyPicture",value:"DYNAMIK (true)?\"https://upload.wikimedia.org/wikipedia/commons/5/58/The_Chemical_Brothers_performing_in_Barcelona%2C_Spain_%282007%29.jpg\":\"Command Failed\""}]},
      "CURSOR RIGHT": {label:"", type:"static", command:"{name:\"\"}", queryresult:"", evalwrite:[{variable:"MyPicture",value:"DYNAMIK (true)?\"https://dancingastronaut.com/wp-content/uploads/2015/05/chemical-brothers.jpg\":\"Command Failed\""}]},
      
     },
    directories:{
      "recipes": {label:"", feeders: {
            "Rooms":{label:"Rooms list", commandset: [{type:"http-get", command:"http://192.168.1.151:3000/v1/projects/home/rooms/", queryresult:"$.*", itemname:"DYNAMIK JSON.parse(\"$Result\").name", itemtype: "listitem", itemlabel:"Recipe name", itembrowse:"DYNAMIK JSON.parse(\"$Result\").key", itemimage:"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg", evalnext:[{test:true, then:"Devices", or:"Rooms"}], evalwrite:[{variable:"RoomKey",value:"DYNAMIK JSON.parse(\"$Result\").key"}]},
                                                      {type:"http-get", command:"http://192.168.1.151:3000/v1/projects/home/rooms/", queryresult:"$.*", itemname:"DYNAMIK JSON.parse(\"$Result\").name", itemtype: "tile", itemlabel:"Recipe name", itembrowse:"DYNAMIK JSON.parse(\"$Result\").key", itemimage:"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg", evalnext:[{test:true, then:"Devices", or:"Rooms"}], evalwrite:[{variable:"RoomKey",value:"DYNAMIK JSON.parse(\"$Result\").key"}]},  
                                                     ]},
            "Devices":{label:"Devices list", commandset: [{type:"http-get", command:"http://192.168.1.151:3000/v1/projects/home/rooms/$RoomKey/devices", queryresult:"$.*", itemname:"DYNAMIK JSON.parse(\"$Result\").name", itemlabel:"Recipe name", itembrowse:"DYNAMIK JSON.parse(\"$Result\").key", itemimage:"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/devices.jpg", evalnext:[{test:true, then:"Macros", or:"Devices"}], evalwrite:[{variable:"DeviceKey",value:"DYNAMIK JSON.parse(\"$Result\").key"}]},
                                                      ]},
            "Macros":{label:"Macros list", commandset: [{type:"http-get", command:"http://192.168.1.151:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros", queryresult:"$.*", itemname:"DYNAMIK JSON.parse(\"$Result\").name", itemlabel:"Recipe name", itemaction:"ACTION_ActivateMacro", itemimage:"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Neeo_logo.jpg", evalwrite:[{variable:"TriggerKey",value:"DYNAMIK JSON.parse(\"$Result\").key"}]}]},
            "ACTION_ActivateMacro":{label:"", commandset: [{type:"http-get", command:"http://192.168.1.151:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros/$TriggerKey/trigger", queryresult:"$.*", itemname:"", itemlabel:"Recipe name", itemaction:""},
                                                      ]},
          },
        },
      },
    },
    {"name":"My Volumio 2", 
    "manufacturer":"Volumio",
    "version":18,
    variables:{
      MyStatus:"",
      MyArtist:"",
      MyAlbum:"",
      AlbumArtURI:"",
      PlayPayLoad:"",
      AlbumCoverURI:"",
      ArtistThumbURI:"",
     },  
     images:{
      "AlbumCover" : {label:"", size : "small", listen:"AlbumArtURI"},
      "ArtistThumb" : {label:"", size : "large", listen:"AlbumArtURI"}
      },
    labels:{
      "CurrentStatus" : {label:"status", listen:"MyStatus"},
    },
    sliders:{
      "VOLUME": {label:"", min : 0, max : 100, unit : "db", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=volume&volume=", statuscommand:"http://volumio.local/api/v1/getState", queryresult:"$.volume"},
    },
    buttons:{
      "VOLUME UP": {label:"", "type":"slidercontrol", "slidername":"VOLUME", "step":"5"},
      "VOLUME DOWN": {label:"", "type":"slidercontrol", "slidername":"VOLUME", "step":"-5"},
      "STOP": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=stop", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"stop Success\" ? \"Music stopped\" : \"Command Failed\""}]},
      "PLAY": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=play", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"play Success\" ? \"Music Started\" : \"Command Failed\""}]},
      "PAUSE": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=toggle", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"toggle Success\" ? \"Pause\" : \"Command Failed\""}]},
      "PREVIOUS": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=prev", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"stop Success\" ? \"Music stopped\" : \"Command Failed\""}]},
      "NEXT": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=next", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"stop Success\" ? \"Music stopped\" : \"Command Failed\""}]},
    },
    directories:{
      "Collection": {label:"My music", feeders: {
            "Artists":{label:"Artists list", commandset: [{type:"http-get", command:"http://volumio.local/api/v1/browse?uri=artists://", queryresult:"$.navigation.lists[0].items[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"Artist Collection", itembrowse:"DYNAMIK JSON.parse(\"$Result\").title", itemimage:"DYNAMIK \"http://volumio.local\" + JSON.parse(\"$Result\").albumart", evalnext:[{test:true, then:"Albums", or:""}], evalwrite:[{variable:"MyArtist",value:"DYNAMIK JSON.parse(\"$Result\").title"},{variable:"ArtistThumbURI",value:"DYNAMIK JSON.parse(\"$Result\").albumart"}]}]},
            "Albums":{label:"Albums list", commandset: [{type:"http-get", command:"http://volumio.local/api/v1/browse?uri=artists://$MyArtist", queryresult:"$.navigation.lists[0].items[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"$MyArtist", itembrowse:"DYNAMIK JSON.parse(\"$Result\").title", itemimage:"DYNAMIK \"http://volumio.local\" + JSON.parse(\"$Result\").albumart", evalnext:[{test:true, then:"Songs", or:""}], evalwrite:[{variable:"MyAlbum",value:"DYNAMIK JSON.parse(\"$Result\").title"}, {variable:"AlbumArtURI",value:"DYNAMIK \"http://volumio.local\" + JSON.parse(\"$Result\").albumart"}]}]},
            "Songs":{label:"Songs list", commandset: [{type:"http-get", command:"http://volumio.local/api/v1/browse?uri=artists://$MyArtist/$MyAlbum", queryresult:"$.navigation.lists[0].items[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"Recipe name", itemaction:"ACTION_ReplaceAndPlay", itemimage:"$AlbumArtURI", evalwrite:[{variable:"PlayPayLoad",value:"$Result"}], }]},
            "ACTION_ReplaceAndPlay":{label:"", commandset: [{type:"http-post", command:{post:"http://volumio.local/api/v1/replaceAndPlay", message:"$PlayPayLoad"}, queryresult:"", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"Recipe name", itemaction:"Evaldo", itemimage:"$AlbumArtURI"}]},
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