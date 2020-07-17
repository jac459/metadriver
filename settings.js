var settings = 
{"drivers":
  [
    {"name":"Yamaha Receiver", 
    "manufacturer":"Yamaha",
    "version":15,
    "buttons":{
      "POWER ON": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=on", "jpathresult":"$.response_code", "expectedresult":"0", "fallbackbutton":""},
      "POWER OFF": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/setPower?power=standby", "jpathresult":"$.response_code", "expectedresult":"0", "fallbackbutton":""},
      "VOLUME UP": {"label":"", "type":"slidercontrol", "slidername":"VOLUME", "step":"5"},
      "VOLUME DOWN": {"label":"", "type":"slidercontrol", "slidername":"VOLUME", "step":"-5"},
      "MUTE TOGGLE": {"label":"", "type":"http-get", "commands":["http://192.168.1.24/YamahaExtendedControl/v1/main/setMute?enable=true","http://192.168.1.24/YamahaExtendedControl/v1/main/setMute?enable=false"], "jpathresult":"", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
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
      "VOLUME": {"label":"", "min" : 0, "max" : 161, "unit" : "db", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v2/main/setVolume?volume=", "statuscommand":"http://192.168.1.24/YamahaExtendedControl/v2/main/getStatus", "jpathstatus":"$.volume"},
    },
    "directories":{
      "INPUT": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v2/system/getFeatures", "actioncommand":"http://192.168.1.24/YamahaExtendedControl/v1/main/setInput?input=", "jpathstatus":"$.system.input_list[*].id", "imageurl":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Input/ThemeStandard/input_", "imageurlpost":".jpg"},
      "DSP": {"label":"", "type":"http-get", "command":"http://192.168.1.24/YamahaExtendedControl/v1/main/getSoundProgramList", "actioncommand":"http://192.168.1.24/YamahaExtendedControl/v1/main/setSoundProgram?program=", "jpathstatus":"$.sound_program_list[*]", "imageurl":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/DSP/ThemeStandard/", "imageurlpost":"_sce.jpg"},
    },
  },
    {
    "name":"MiTV", 
    "manufacturer":"Xiaomi",
    "version":5,
    "buttons":{
      "CURSOR LEFT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=left", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "CURSOR RIGHT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=right", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "CURSOR UP": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=up", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "CURSOR DOWN": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=down", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "CURSOR ENTER": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=enter", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "POWER ON": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=power", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "POWER OFF": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=power", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "VOLUME UP": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumeup", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "VOLUME DOWN": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=volumedown", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "MENU": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=menu", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "BACK": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=back", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "EXIT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=exit", "jpathresult":"$.msg", "expectedresult":"success", "fallbackbutton":""},
      "INPUT HDMI 1": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=changesource&source=HDMI1", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
      "INPUT HDMI 2": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=changesource&source=HDMI2", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},
      "INPUT HDMI 3": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=changesource&source=HDMI3", "expectedresult":"{\"response_code\":0}", "fallbackbutton":""},

      "directories":{
        "Applications": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=getinstalledapp&count=999&changeIcon=1", "actioncommand":"http://192.168.1.33:6095/controller?action=startapp&type=packagename&packagename=", "jpathstatus":"$.data.AppInfo[*].PackageName", "imageurl":"", "imageurlpost":"", "jpathimage":"$.data.AppInfo[*].IconURL"},
       },
    }
  ]          
}
  
module.exports = settings;