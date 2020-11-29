var settings = 
{'drivers':
  [
    {
      name:'LG Gary', 
      manufacturer:'LG',
      type:'AVRECEIVER', //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
      //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
      //icon:"sonos",
      version:1,
      buttons:{
        'BUTTON 1': {label:'', type:'http-get', command:'http://192.168.1.24/YamahaExtendedControl/v1/main/setMute?enable=false', queryresult:''},
        'BUTTON 2': {label:'', type:'http-get', command:'http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=on', queryresult:''},
      }
    },
   /* {
      "name":"LG TV", 
      "manufacturer":"LG",
      "version":4,
      "buttons":{
        "POWER ON": {"label":"", "type":"wol", "command":"10:08:C1:33:FA:4E", "queryresult":"", "expectedresult":"", "fallbackbutton":""},
        "POWER OFF": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/off", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},

        "CURSOR LEFT": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/left", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR RIGHT": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/right", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR UP": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/top", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR DOWN": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/bottom", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "CURSOR ENTER": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/ok", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "VOLUME UP": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/sound-plus", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "VOLUME DOWN": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/sound-minus", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "MENU": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/home", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
        "BACK": {"label":"", "type":"http-post", "command":{"call":"http://localhost:1234/command/back", "message":""}, "queryresult":"", "expectedresult":"OK", "fallbackbutton":""},
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
  name:'Plex Remote', 
  manufacturer:'Plex',
  version:8,
  type:'AVRECEIVER', //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
  //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
  variables:{
    Token:'Ea6Q4hnybqknyhwXEnS4',
    PlexIP:'192.168.1.10',
    MyStatus:'Ready',
    MyPicture:'',
    SectionKey:'Ready',
  },
  images:{
    'MyCover' : {label:'', size : 'small', listen:'MyPicture'},
    'MyCover2' : {label:'', size : 'large', listen:'MyPicture'}
  },
  labels:{
    'CurrentStatus' : {label:'status', listen:'MyStatus'},
  },  
  buttons:{
  },
  directories:{
    Library: {label:'', feeders: {
          'Collection':{label:'Gallery', commandset: [{type:'http-get-soap', command:'http://192.168.1.28:32400/library/sections?X-Plex-Token=$Token', queryresult:'/MediaContainer/Directory', itemtype: 'listitem', itemname:'DYNAMIK JSON.parse("$Result").Directory.title', itemlabel:'DYNAMIK "Type - " + JSON.parse("$Result").Directory.type', itembrowse:'DYNAMIK JSON.parse("$Result").Directory.title', itemimage:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Directory.thumb + "?X-Plex-Token=$Token"', 
            evalnext:[{test:'DYNAMIK JSON.parse("$Result").Directory.type == "photo"', then:'Gallery', or:''},{test:'DYNAMIK JSON.parse("$Result").Directory.type == "movie"', then:'Movies', or:''},{test:'DYNAMIK JSON.parse("$Result").Directory.type == "artist"', then:'Music', or:''},
          ], evalwrite:[{variable:'SectionKey',value:'DYNAMIK JSON.parse("$Result").Directory.Location.id'}, {variable:'MyPicture',value:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Photo.thumb + "?X-Plex-Token=$Token"'}]},
          ]},
          'Gallery':{label:'Gallery', commandset: [{type:'http-get-soap', command:'http://192.168.1.28:32400/library/sections/$SectionKey/all?X-Plex-Token=$Token', itemtype: 'tile', queryresult:'/MediaContainer/Photo', itemname:'DYNAMIK JSON.parse("$Result").Photo.title', itemlabel:'', itembrowse:'', itemimage:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Photo.thumb + "?X-Plex-Token=$Token"', evalnext:[{test:true, then:'Devices', or:'Rooms'}], evalwrite:[{variable:'MyPicture',value:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Photo.thumb + "?X-Plex-Token=$Token"'}]}]},
          'Music':{label:'My music', commandset: [{type:'http-get-soap', command:'http://192.168.1.28:32400/library/sections/$SectionKey/all?X-Plex-Token=$Token', itemtype: 'tile', queryresult:'/MediaContainer/artist', itemname:'DYNAMIK JSON.parse("$Result").Photo.title', itemlabel:'', itembrowse:'', itemimage:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Photo.thumb + "?X-Plex-Token=$Token"', evalnext:[{test:true, then:'Devices', or:'Rooms'}], evalwrite:[{variable:'MyPicture',value:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Photo.thumb + "?X-Plex-Token=$Token"'}]}]},
          'Movies':{label:'My movies', commandset: [{type:'http-get-soap', command:'http://192.168.1.28:32400/library/sections/$SectionKey/all?X-Plex-Token=$Token', itemtype: 'listitem', queryresult:'/MediaContainer/Video', itemname:'DYNAMIK JSON.parse("$Result").Video.title', itemlabel:'DYNAMIK JSON.parse("$Result").Video.tagline', itembrowse:'', itemimage:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Video.thumb + "?X-Plex-Token=$Token"', evalwrite:[{variable:'MyPicture',value:'DYNAMIK "http://192.168.1.28:32400" + JSON.parse("$Result").Photo.thumb + "?X-Plex-Token=$Token"'}]},
          ]},
                                }
              }
  }

},
{name:'Brain Navigator', 
    manufacturer:'JAC',
    type:'AVRECEIVER', //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
    //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
//    icon:"sonos",//neeo-brain
    version:29,
    variables:{
      MyStatus:'',
      RoomKey:'',
      DeviceKey:'',
      TriggerKey:'',
      MyPicture:'https://scontent.fsin5-1.fna.fbcdn.net/v/t1.0-9/s960x960/83258087_10156692837451196_8122948557457063936_o.jpg?_nc_cat=109&_nc_sid=8024bb&_nc_ohc=pW8b6Dvy070AX9XJIND&_nc_ht=scontent.fsin5-1.fna&_nc_tp=7&oh=d5f9ac574e9e31977f23791c1848e501&oe=5F4490D2'
    },
    sensors:{
      MySensor : {label:'', type:'string', listen:'MyStatus'}
    },
    images:{
      'MyCover' : {label:'', size : 'small', listen:'MyPicture'},
      'MyCover2' : {label:'', size : 'large', listen:'MyPicture'}
    },
    labels:{
      'CurrentStatus' : {label:'status', listen:'MyStatus'},
    },
    buttons:{
      'CURSOR LEFT': {label:'', type:'static', command:'{name:""}', queryresult:'', evalwrite:[{variable:'MyPicture',value:'DYNAMIK (true)?"https://scontent.fsin5-1.fna.fbcdn.net/v/t1.0-9/s960x960/83258087_10156692837451196_8122948557457063936_o.jpg?_nc_cat=109&_nc_sid=8024bb&_nc_ohc=pW8b6Dvy070AX9XJIND&_nc_ht=scontent.fsin5-1.fna&_nc_tp=7&oh=d5f9ac574e9e31977f23791c1848e501&oe=5F4490D2":"Command Failed"'}]},
      'CURSOR ENTER': {label:'', type:'static', command:'{name:""}', queryresult:'', evalwrite:[{variable:'MyPicture',value:'DYNAMIK (true)?"https://upload.wikimedia.org/wikipedia/commons/5/58/The_Chemical_Brothers_performing_in_Barcelona%2C_Spain_%282007%29.jpg":"Command Failed"'}]},
      'CURSOR RIGHT': {label:'', type:'static', command:'{name:""}', queryresult:'', evalwrite:[{variable:'MyPicture',value:'DYNAMIK (true)?"https://dancingastronaut.com/wp-content/uploads/2015/05/chemical-brothers.jpg":"Command Failed"'}]},
      
     },
    directories:{
      'recipes': {label:'', feeders: {
            'Rooms':{label:'Rooms list', commandset: [{type:'http-get', command:'http://192.168.1.151:3000/v1/projects/home/rooms/', queryresult:'$.*', itemname:'DYNAMIK JSON.parse("$Result").name', itemtype: 'listitem', itemlabel:'Recipe name', itembrowse:'DYNAMIK JSON.parse("$Result").key', itemimage:'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg', evalnext:[{test:true, then:'Devices', or:'Rooms'}], evalwrite:[{variable:'RoomKey',value:'DYNAMIK JSON.parse("$Result").key'}]},
                                                      {type:'http-get', command:'http://192.168.1.151:3000/v1/projects/home/rooms/', queryresult:'$.*', itemname:'DYNAMIK JSON.parse("$Result").name', itemtype: 'tile', itemlabel:'Recipe name', itembrowse:'DYNAMIK JSON.parse("$Result").key', itemimage:'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg', evalnext:[{test:true, then:'Devices', or:'Rooms'}], evalwrite:[{variable:'RoomKey',value:'DYNAMIK JSON.parse("$Result").key'}]},  
                                                     ]},
            'Devices':{label:'Devices list', commandset: [{type:'http-get', command:'http://192.168.1.151:3000/v1/projects/home/rooms/$RoomKey/devices', queryresult:'$.*', itemname:'DYNAMIK JSON.parse("$Result").name', itemlabel:'Recipe name', itembrowse:'DYNAMIK JSON.parse("$Result").key', itemimage:'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/devices.jpg', evalnext:[{test:true, then:'Macros', or:'Devices'}], evalwrite:[{variable:'DeviceKey',value:'DYNAMIK JSON.parse("$Result").key'}]},
                                                      ]},
            'Macros':{label:'Macros list', commandset: [{type:'http-get', command:'http://192.168.1.151:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros', queryresult:'$.*', itemname:'DYNAMIK JSON.parse("$Result").name', itemlabel:'Recipe name', itemaction:'ACTION_ActivateMacro', itemimage:'https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Neeo_logo.jpg', evalwrite:[{variable:'TriggerKey',value:'DYNAMIK JSON.parse("$Result").key'}]}]},
            'ACTION_ActivateMacro':{label:'', commandset: [{type:'http-get', command:'http://192.168.1.151:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros/$TriggerKey/trigger', queryresult:'$.*', itemname:'', itemlabel:'Recipe name', itemaction:''},
                                                      ]},
          },
        },
      },
    },
/*  {name:"My Volumio 2", 
    manufacturer:"Volumio",
    version:28,
    type:"MUSICPLAYER", //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
    //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
    variables:{
      MyStatus:"",
      MyArtist:"",
      MyAlbum:"",
      AlbumArtURI:"",
      PlayPayLoad:"",
      AlbumCoverURI:"",
      ArtistThumbURI:"",
      DirectPlay:false,
    },
    sensors:{
      COVER_ART_SENSOR : {label:"", type:"string", listen:"AlbumArtURI"},
      TITLE_SENSOR : {label:"", type:"string", listen:"MyArtist"},
      DESCRIPTION_SENSOR : {label:"", type:"string", listen:"MyAlbum"}
    },  
    images:{
 //     AlbumCover : {label:"", size : "large", listen:"AlbumArtURI"},
 //     ArtistThumb : {label:"", size : "large", listen:"AlbumArtURI"}
      },
    labels:{  
      CurrentStatus : {label:"status", listen:"MyStatus"},
    },
    players:{  
      mainplayer : {rootdirectory:"Collection", queuedirectory:"Queue", volume:"VOLUME", cover:"COVER_ART_SENSOR", title:"TITLE_SENSOR", 
        description:"DESCRIPTION_SENSOR", playing:"PLAYING", mute:"MUTE", shuffle:"SHUFFLE", repeat:"REPEAT"},
    },
    switches:{
      PlayMode : {label:"", listen:"DirectPlay"},
      PLAYING : {label:"", listen:"DirectPlay"},
      MUTE : {label:"", listen:"DirectPlay"},
      SHUFFLE : {label:"", listen:"DirectPlay"},
      REPEAT : {label:"", listen:"DirectPlay"},
    },
    sliders:{
      VOLUME: {label:"", min : 0, max : 100, unit : "db", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=volume&volume=", statuscommand:"http://volumio.local/api/v1/getState", queryresult:"$.volume"},
    },
    buttons:{
      "VOLUME UP": {label:"", "type":"slidercontrol", "slidername":"Volume", "step":"5"},
      "VOLUME DOWN": {label:"", "type":"slidercontrol", "slidername":"Volume", "step":"-5"},
      "STOP": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=stop", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"stop Success\" ? \"Music Stopped\" : \"Music Stopped\""}]},
      "PLAY": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=play", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"play Success\" ? \"Music Started\" : \"Command Failed\""}]},
      "PLAY TOGGLE": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=toggle", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"toggle Success\" ? \"Pause\" : \"Command Failed\""}]},
      "PREVIOUS": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=prev", queryresult:"$.response", evalwrite:[{variable:"MyStatus",value:"DYNAMIK \"$Result\"==\"stop Success\" ? \"Music stopped\" : \"Command Failed\""}]},
      "NEXT TRACK": {label:"", type:"http-get", command:"http://volumio.local/api/v1/commands/?cmd=next", queryresult:"$.response", evalwrite:[{variable:"AlbumArtURI",value:"https://scontent.fsin5-1.fna.fbcdn.net/v/t1.0-9/s960x960/83258087_10156692837451196_8122948557457063936_o.jpg?_nc_cat=109&_nc_sid=8024bb&_nc_ohc=pW8b6Dvy070AX9XJIND&_nc_ht=scontent.fsin5-1.fna&_nc_tp=7&oh=d5f9ac574e9e31977f23791c1848e501&oe=5F4490D2"}]},
    },
    directories:{
      "Collection": {label:"My music", feeders: {
        "Artists":{label:"Artists list", commandset: [{type:"http-get", command:"http://volumio.local/api/v1/browse?uri=artists://", queryresult:"$.navigation.lists[0].items[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"Artist Collection", itembrowse:"DYNAMIK JSON.parse(\"$Result\").title", itemimage:"DYNAMIK \"http://volumio.local\" + JSON.parse(\"$Result\").albumart", evalnext:[{test:true, then:"Albums", or:""}], evalwrite:[{variable:"MyArtist",value:"DYNAMIK JSON.parse(\"$Result\").title"},{variable:"ArtistThumbURI",value:"DYNAMIK JSON.parse(\"$Result\").albumart"}]}]},
        "Albums":{label:"Albums list", commandset: [{type:"http-get", command:"http://volumio.local/api/v1/browse?uri=artists://$MyArtist", queryresult:"$.navigation.lists[0].items[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"$MyArtist", itembrowse:"DYNAMIK JSON.parse(\"$Result\").title", itemimage:"DYNAMIK \"http://volumio.local\" + JSON.parse(\"$Result\").albumart", evalnext:[{test:true, then:"Songs", or:""}], evalwrite:[{variable:"MyAlbum",value:"DYNAMIK JSON.parse(\"$Result\").title"}, {variable:"AlbumArtURI",value:"DYNAMIK \"http://volumio.local\" + JSON.parse(\"$Result\").albumart"}]}]},
        "Songs":{label:"Songs list", commandset: [{type:"http-get", command:"http://volumio.local/api/v1/browse?uri=artists://$MyArtist/$MyAlbum", queryresult:"$.navigation.lists[0].items[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"Recipe name", itemaction:"ACTION_ReplaceAndPlay", itemimage:"$AlbumArtURI", evalwrite:[{variable:"PlayPayLoad",value:"$Result"}], }]},
        "ACTION_ReplaceAndPlay":{label:"", commandset: [{type:"http-post", command:"DYNAMIK JSON.stringify({call:\"http://volumio.local/api/v1/\" + ( $DirectPlay ? \"replaceAndPlay\": \"addToQueue\"), message:\"$PlayPayLoad\"})", queryresult:"", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"Recipe name", itemaction:"Evaldo", itemimage:"$AlbumArtURI"}]},
        },
      },
      "Queue": {label:"My playing queue", feeders: {
        "Queue":{label:"Queue", commandset: [{type:"http-get", command:"http://volumio.local/api/v1/getQueue", queryresult:"$.queue[*]", itemname:"DYNAMIK JSON.parse(\"$Result\").name", itemlabel:"DYNAMIK JSON.parse(\"$Result\").artist", itembrowse:"DYNAMIK JSON.parse(\"$Result\").title", itemimage:"DYNAMIK \"http://volumio.local\" + JSON.parse(\"$Result\").albumart"}]},
        "ACTION_ReplaceAndPlay":{label:"", commandset: [{type:"http-post", command:"DYNAMIK JSON.stringify({call:\"http://volumio.local/api/v1/\" + ( $DirectPlay ? \"replaceAndPlay\": \"addToQueue\"), message:\"$PlayPayLoad\"})", queryresult:"", itemname:"DYNAMIK JSON.parse(\"$Result\").title", itemlabel:"Recipe name", itemaction:"Evaldo", itemimage:"$AlbumArtURI"}]},
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
    {name:'Volumio', 
    manufacturer:'Volumio',
    version:4,
    type:'AVRECEIVER', //ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH
    //LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR,
    socket:'http://volumio.local',
    listeners : {
      VolumioStatus : {type:'webSocket', command:'pushState', queryresult : '', 
        evalwrite : [ 
          {variable : 'Playing',value : 'DYNAMIK JSON.parse("$Result").title'}, 
          {variable : 'VolumePlayed',value : 'DYNAMIK JSON.parse("$Result").volume'}, 
          {variable : 'AlbumCoverURI',value : 'DYNAMIK "http://volumio.local" + JSON.parse("$Result").albumart'}]}
    },
    variables:{
      Playing:'',
      MyArtist:'',
      MyAlbum:'',
      AlbumArtURI:'',
      PlayPayLoad:'',
      AlbumCoverURI:'',
      ArtistThumbURI:'',
      DirectPlay:false,
      VolumePlayed:''
    },

    images:{
      AlbumCover : {label:'', size : 'large', listen:'AlbumCoverURI'},
      AlbumCoverSmall : {label:'', size : 'small', listen:'AlbumCoverURI'},
    },
    labels:{  
      CurrentStatus : {label:'status', listen:'Playing'},
    },
    switches:{
      PlayMode : {label:'', listen:'DirectPlay'},
      PLAYING : {label:'', listen:'DirectPlay'},
      MUTE : {label:'', listen:'DirectPlay'},
      SHUFFLE : {label:'', listen:'DirectPlay'},
      REPEAT : {label:'', listen:'DirectPlay'},
    },
    sliders:{
      VOLUME: {label:'', min : 0, max : 100, unit : 'db', type:'http-get', command:'http://volumio.local/api/v1/commands/?cmd=volume&volume=', queryresult:'$.volume', listen:'VolumePlayed'},
    },
    buttons:{
      'VOLUME UP': {label:'', 'type':'slidercontrol', 'slidername':'Volume', 'step':'5'},
      'VOLUME DOWN': {label:'', 'type':'slidercontrol', 'slidername':'Volume', 'step':'-5'},
      'STOP': {label:'', type:'http-get', command:'http://volumio.local/api/v1/commands/?cmd=stop', queryresult:'$.response', evalwrite:[{variable:'Playing',value:'DYNAMIK "$Result"=="stop Success" ? "Music Stopped" : "Music Stopped"'}]},
      'PLAY': {label:'', type:'http-get', command:'http://volumio.local/api/v1/commands/?cmd=play', queryresult:'$.response', evalwrite:[{variable:'Playing',value:'DYNAMIK "$Result"=="play Success" ? "Music Started" : "Command Failed"'}]},
      'PLAY TOGGLE': {label:'', type:'http-get', command:'http://volumio.local/api/v1/commands/?cmd=toggle', queryresult:'$.response', evalwrite:[{variable:'Playing',value:'DYNAMIK "$Result"=="toggle Success" ? "Pause" : "Command Failed"'}]},
      'PREVIOUS': {label:'', type:'http-get', command:'http://volumio.local/api/v1/commands/?cmd=prev', queryresult:'$.response', evalwrite:[{variable:'Playing',value:'DYNAMIK "$Result"=="stop Success" ? "Previous Track" : "Command Failed"'}]},
      'NEXT': {label:'', type:'http-get', command:'http://volumio.local/api/v1/commands/?cmd=next', queryresult:'$.response', evalwrite:[{variable:'Playing',value:'DYNAMIK "$Result"=="stop Success" ? "Next Track" : "Command Failed"'}]},
    },
    directories:{
      'Collection': {label:'My music', feeders: {
        'Artists':{label:'Artists list', commandset: [{type:'http-get', command:'http://volumio.local/api/v1/browse?uri=artists://', queryresult:'$.navigation.lists[0].items[*]', itemname:'DYNAMIK JSON.parse("$Result").title', itemlabel:'Artist Collection', itembrowse:'DYNAMIK JSON.parse("$Result").title', itemimage:'DYNAMIK "http://volumio.local" + JSON.parse("$Result").albumart', evalnext:[{test:true, then:'Albums', or:''}], evalwrite:[{variable:'MyArtist',value:'DYNAMIK JSON.parse("$Result").title'},{variable:'ArtistThumbURI',value:'DYNAMIK JSON.parse("$Result").albumart'}]}]},
        'Albums':{label:'Albums list', commandset: [{type:'http-get', command:'http://volumio.local/api/v1/browse?uri=artists://$MyArtist', queryresult:'$.navigation.lists[0].items[*]', itemname:'DYNAMIK JSON.parse("$Result").title', itemlabel:'$MyArtist', itembrowse:'DYNAMIK JSON.parse("$Result").title', itemimage:'DYNAMIK "http://volumio.local" + JSON.parse("$Result").albumart', evalnext:[{test:true, then:'Songs', or:''}], evalwrite:[{variable:'MyAlbum',value:'DYNAMIK JSON.parse("$Result").title'}, {variable:'AlbumArtURI',value:'DYNAMIK "http://volumio.local" + JSON.parse("$Result").albumart'}]}]},
        'Songs':{label:'Songs list', commandset: [{type:'http-get', command:'http://volumio.local/api/v1/browse?uri=artists://$MyArtist/$MyAlbum', queryresult:'$.navigation.lists[0].items[*]', itemname:'DYNAMIK JSON.parse("$Result").title', itemlabel:'Recipe name', itemaction:'ACTION_ReplaceAndPlay', itemimage:'$AlbumArtURI', evalwrite:[{variable:'PlayPayLoad',value:'$Result'}], }]},
        'ACTION_ReplaceAndPlay':{label:'', commandset: [{type:'http-post', command:'DYNAMIK JSON.stringify({post:"http://volumio.local/api/v1/" + ( $DirectPlay ? "replaceAndPlay": "addToQueue"), message:"$PlayPayLoad"})', queryresult:'', itemname:'DYNAMIK JSON.parse("$Result").title', itemlabel:'Recipe name', itemaction:'Evaldo', itemimage:'$AlbumArtURI'}]},
        },
      },
      'Queue': {label:'My playing queue', feeders: {
        'Queue':{label:'Queue', commandset: [{type:'http-get', command:'http://volumio.local/api/v1/getQueue', queryresult:'$.queue[*]', itemname:'DYNAMIK JSON.parse("$Result").name', itemlabel:'DYNAMIK JSON.parse("$Result").artist', itembrowse:'DYNAMIK JSON.parse("$Result").title', itemimage:'DYNAMIK "http://volumio.local" + JSON.parse("$Result").albumart'}]},
        'ACTION_ReplaceAndPlay':{label:'', commandset: [{type:'http-post', command:'DYNAMIK JSON.stringify({post:"http://volumio.local/api/v1/" + ( $DirectPlay ? "replaceAndPlay": "addToQueue"), message:"$PlayPayLoad"})', queryresult:'', itemname:'DYNAMIK JSON.parse("$Result").title', itemlabel:'Recipe name', itemaction:'Evaldo', itemimage:'$AlbumArtURI'}]},
    },
  },
},
  },
  ]
}
  
module.exports = settings;