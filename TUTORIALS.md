
## Tutorial: Creating your own devices

Note: you should have a basic understanding of JSON. JSON is an extremly simple file format, with an "Attribute" : "Value" concept. This tutorial will not explain JSON as such but you shouldn't be affraid of it, JSON really is very simple.

### Tutorial Step 1 - Simple button device

In order to create your single button device you can use the following sample file:
```
{"name":"Tuto Step1", 
    "manufacturer":"Your Name",
    "version":1,
    "type":"AVRECEIVER", 
    "buttons":{
      "CURSOR LEFT": {"label":"", "type":"HTTP-GET", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=left"},
      "CURSOR RIGHT": {"label":"", "type":"HTTP-GET", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=right"},
      "CURSOR UP": {"label":"", "type":"HTTP-GET", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=up"},
      "CURSOR DOWN": {"label":"", "type":"HTTP-GET", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=down"}
    }
}
```
Let's have a look at the file and understand each field:
- name: this is the name your device will have, you will be able to find it by this name in the remote.
- manufacturer: put the brand of the device you will control here.
- version: IMPORTANT /!\ /!\ Once a device is first created, its structure is set. If you add new buttons and you want the remote to notice, you will need to delete the device and recreate it (not convenient) OR just increment the version number. In the future, if you add an item and get frustrated because the remote doesn't seem to care, remember this version field. NOTE: you can not EDIT or DELETE a button by incrementing the version, you will need to delete and reload the device-driver.
- type: IMPORTANT /!\ /!\ This field is also important, it will drive the way your remote will interpret your device. The problem is that not all features are supported for all devices. For example, if you want to use the channel button, you can't use the device type "LIGHT", you will need a AVRECEIVER or TV type for example. As a simple way to create, I like to use the AVRECEIVER. You have to make it appear in the remote by activating it in the recipes part (choose SHOW) but it is quite flexible and supports most of the interactions. If you see warning lines when you run the device, it is because in this example you didn't declare INPUT buttons, where the AVRECEIVER-type expects some INPUT buttons. It doesn't matter but it shows you how Neeo reacts. You can dive into the Neeo SDK in order to better understand the limitations of each device (note that the documentation is incomplete).
The types you can choose from are: ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH, LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR.
- buttons: Here you have the list of buttons. The name can be any name and you can change the display name in the "label" attribute. Some buttons are recognised by the remote control. It is specially handy if you want to map a feature to a hardware button like the cursor. In this example, you can use the cursor arrows of the remote directly.
The list of Neeo-recognised buttons can be found here: https://github.com/NEEOInc/neeo-sdk#neeo-macro-names. Please note that this list is incomplete and you can discover other buttons by browsing planet-neeo forum or the widgets description; however, it's a good starting point.
- type (in buttons): This field is very important as it will drive the protocol used for your device. In this example, it is just an HTTP request (GET). The supported types are: HTTP-GET, HTTP-POST, WebSocket (works with socket.io), static, CLI and HTTP-GET-SOAP. Examples on each type will be provided. More types will be added in the future.
- command: Here you put the url you want to call. This is a very simple and efficient way to control a device, much faster and reliable than with Infra Red control. A lot of devices are exposing an API directly, you just have to copy paste their URL in the command field (between  quotes). For example, here you can find an easy way to control your Xiaomi TV: https://github.com/spocky/mireco#gitv-http-api-featuresdocumentation or here , your yamaha receiver: http://habitech.s3.amazonaws.com/PDFs/YAM/MusicCast/Yamaha%20MusicCast%20HTTP%20simplified%20API%20for%20ControlSystems.pdf. You are often just a Google search away. 
Note: for more complexe devices, you can download an intermediary driver, exposing a REST API. So this meta driver will use this driver to remote control. I use such a driver in Python to control my Xbox One X. The resulting performance is excellent (instant reaction).

### Tutorial Step 2 - Label device

This first step was easy but very boring. Let's have a bit more fun. Now we will have 2 buttons controlling a label display.
Let's have a look at the code:
```
{"name":"Tuto Step2", 
    "manufacturer":"Your Name",
    "version":2,
    "type":"AVRECEIVER", 
    "variables":{
      "LabelStatus":"Default value"
    },
    "labels":{
      "CurrentStatus" : {"label":"status", "listen":"LabelStatus"}
    },  
   
    "buttons":{
      "CURSOR LEFT": {"label":"", "type":"static", "command":"It works on the left", "evalwrite":[{"variable":"LabelStatus","value":"$Result"}]},
      "CURSOR RIGHT": {"label":"", "type":"static", "command":"On the right too", "evalwrite":[{"variable":"LabelStatus","value":"$Result"}]}
    }
}
```
#### variables
In this example we introduce a major concept, which is variables.
The variable is very important, but on itself it is of no use. 
"LabelStatus":"Default value" => the LabelStatus is an arbitrary name that you choose (in one word please) . The 'default value' is a default value that you choose. Can be empty.
#### label
Then the label part. You see an arbitrary name (CurrentStatus, one word), a label name (if you want to change the label) and then the most important:
- listen: in this important field, you put the name of a variable. Each time you assign a value to this variable, the label will have this value.
#### evalwrite
This is a new feature that we can attach to a button (or any actionable component). 
- evalwrite: evalwrite allows you to write a value into a variable. There are a lot of complex ways to do this, but in this simple example, we will use a very special variable:
- $Result: $Result is a specific variable being assigned the result of the command. In this example, it is very easy because the command is of type "static". With an HTTP-GET you would get the result of the call, but with a type static it just copies the value inserted in command. 
- evalwrite (2): Coming back to evalwrite, this function just copies the "value" part into the "variable". 
  /!\ IMPORTANTE NOTE: You can have multiple evalwrites triggered; the code would look like that: "evalwrite":[{"variable":"LabelStatus","value":"$Result"}, {"variable":"anotherVariable","value":"AnotherValue"}]. Each evalwrite is between [...], indicating an array, and then as normally: {...}. So basically to have an array with 2 evalwrites, it will look like this: [{...}, [{...}].

### Tutorial Step 3 - Let's go to something more complex...
Let's extend the previous example. Now we will have "UP" and "DOWN"  buttons. These buttons change the value of a switch and the switch changes the value of 2 pictures:
```
{"name":"Tuto Step3", 
    "manufacturer":"Your Name",
    "version":3,
    "type":"AVRECEIVER", 
    "variables":{
      "LabelStatus":"Default value",
      "Power":false,
      "AlbumURI": "",
      "URI1": "https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/DSP/ThemeStandard/chamber_sce.jpg",
      "URI2": "https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/DSP/ThemeStandard/surr_decoder_sce.jpg"
    },
    "labels":{
      "CurrentStatus" : {"label":"status", "listen":"LabelStatus"}
    }, 
    "images":{
           "AlbumCover" : {"label":"", "size" : "large", "listen":"AlbumURI"},
           "AlbumThumb" : {"label":"", "size" : "small", "listen":"AlbumURI"}
           },
       
    "switches":{
      "PowerSwitch" : {"label":"", "listen":"Power", "evaldo":[{"test":"DYNAMIK $Result", "then":"__SHOWIMAGE1", "or":"__SHOWIMAGE2"}]}
    },
    "buttons":{
      "CURSOR LEFT": {"label":"", "type":"static", "command":"It works on the left", "evalwrite":[{"variable":"LabelStatus","value":"$Result"}]},
      "CURSOR RIGHT": {"label":"", "type":"static", "command":"On the right too", "evalwrite":[{"variable":"LabelStatus","value":"$Result"}]},
      "CURSOR UP": {"label":"", "type":"static", "command":true, "evalwrite":[{"variable":"Power","value":"$Result"}]},
      "CURSOR DOWN": {"label":"", "type":"static", "command":false, "evalwrite":[{"variable":"Power","value":"$Result"}]},
      "__SHOWIMAGE1": {"label":"", "type":"static", "command":"", "evalwrite":[{"variable":"AlbumURI","value":"$URI1"}]},
      "__SHOWIMAGE2": {"label":"", "type":"static", "command":"", "evalwrite":[{"variable":"AlbumURI","value":"$URI2"}]}
    }
}
```
#### The image element
The image element is quite straight forward, it displays a picture.
- label: the picture label, it's name if not provided.
- size: can be small or large.
- listen: the listen is attached to a variable, like the label, but it has to be an URL pointing to a jpg if you want something to be displayed. Recommanded size of the pic is 480x480px for a big image and 100x100px for a small one.
#### The switch element.
The switch element is a bit more complex. You can assign it some commands and you can control it like a label with a "listen" attribute. The accepted value will be either false or true. /!\ In JSON, false and true are NOT between double quotes ("), you specify directly true or false (cf the example). With the switch, we introduce a new element which is evaldo. Evaldo can also be present in a button. Meaning a button can have both evaldo and evalwrite. On the contrary, a switch can ONLY have evaldo. When evalwrite is here to write into variables, evaldo is there to perform an action (triggering a button).
#### evaldo
In evaldo, you have:
- test: this test can be true or false (more on it later).
- do: the name of the button to be triggered if the result is true. If you don't want a button to be visible but you want to be able to call it, just prefix it by "__" like in the example.
- or: the name of the button to be triggered if the result is false. 
- DYNAMIK. In this example, you have seen a weird expression: DYNAMIK $Result. This is because the $Result in this driver can only be a string. So here the $Result will be "true" for example if the switch is on the right. In fact we don't want it to be "true" (like the string true) but true (like the boolean value). So we ask the driver to interpret the string value and transform it into a real boolean. In the next steps, we will see a lot of powerful and more complex usage of DYNAMIK keyword.
/!\ IMPORTANTE NOTE: This DYNAMIK feature is extremely powerful and is available on many fields. It truly allows adapting to many real world situations in order to manage various different devices. The drawback is that it generates 'in theory' a security issue, because it allows to inject code into the metadriver. For this reason, you should avoid running the driver as an administrator (you don't have any reason to do that).
Note 2: In this example, you see how variables are used in a field. It is just $ before the name of the variable so the driver knows it is a variable ($MyVariable). 
IMPORTANT: Don't use 'nested' names for variables. For example if you have a variable MyVariable and MyVariable2, if you write in a field $MyVariable2, the driver will understand it as Myvariable and '2'. So for example if the value of $MyVariable is Hello, you will endup with Hello2.

### Tutorial Step 4 - Starting with real life example: controlling a MiTV (Xiaomi).

https://www.youtube.com/watch?v=-XNF1mSqwuo

In order to have more advanced interactions, let's see how the driver analyses MiTV' answers:

```
{"name":"MiTV", 
    "manufacturer":"Xiaomi",
    "version":3,
    "type":"TV", 
    "variables":{
        "MyStatus":"",
        "MyTVIP":"192.168.1.33",
        "PackageName":""
    },
    "labels":{
        "CurrentStatus" : {"label":"status", "listen":"MyStatus"}
    },
    "buttons":{
        "CURSOR LEFT": {"label":"", "type":"HTTP-GET", "command":"http://$MyTVIP:6095/controller?action=keyevent&keycode=left", "queryresult":"$.msg", "evalwrite":[{"variable":"MyStatus","value":"DYNAMIK (\"$Result\"==\"success\")?\"Left pressed\":\"Command Failed\""}]},
        "CURSOR RIGHT": {"label":"", "type":"HTTP-GET", "command":"http://$MyTVIP:6095/controller?action=keyevent&keycode=right", "queryresult":"$.msg", "evalwrite":[{"variable":"MyStatus","value":"DYNAMIK (\"$Result\"==\"success\")?\"Right pressed\":\"Command Failed\""}]},
 ```
 
The beginning of this driver is quite boring, but the first thing you might notice is how the variable MyTVIP is used in the command: http://$MyTVIP:6095/controller?action=keyevent&keycode=left
The value of the IP will be immediately modified and replaced. So if you change the IP you need to change it only in one place. You will see later that it enables quite complexe scenarios.
But now, let's focus of the most important part of this tutorial step :
#### queryresult
In order to understand query result, you need to understand the problem it solves. All the devices we are trying to control are diverse, they speak different language, and most of the time they don't answer the way we want. Fortunately, most of the time they answer using a syntax called JSON (the metadriver also supports XML, more on that later).
In order to understand an answer in JSON that can be extremely long (the Neeo Brain answers with 1000s of characters), you need to navigate through it. JPATH is our friend for that.
So to be clear, if you are using an 'HTTP-GET' type of command, the queryresult will be a jpath.
Let's see what it means.
Going back to my MiTV, when I request the TV, it is answering with a weird thing:
```
{
"status":0,
"msg":"success",
"data":{}
}
```
Remember this format? It is the same format used by our settings, the industry standard JSON. But it is too complex, we don't want to deal with that. We need only to know what is inside the msg part if it is a success, so that we know if our command has worked.
To simplify it, we will filter using JPATH (or JSONPATH). Please have a look at this: https://github.com/dchester/jsonpath, it explains how to filter using jpath.
In our case, the jpath is "$.msg". When applied to the JSON-string quoted before, it returns.... success, which is exactly what we want.
In order to create a jpath yourself (it can be complex, especially for example with a complex JSON-string like the Neeo Brain), I strongly advice you to use an online evaluator: https://jsonpath.com/ (for example, there are many).
You copy the JSON-string returned in your browser, and apply your path.

#### $Result 
So to complete what was said in the previous tuto, $Result is in fact the result of the command, filtered by the queryresult. In our MiTV, it gives something much simpler: success. We could directly apply this to the label, but let's make it a bit more complex.
#### evalwrite
Here, we use our friend evalwrite. We will assign to MyStatus, itself attached to the label.
What we will assign is: 
#### DYNAMIK (\"$Result\"==\"success\")?\"Left pressed\":\"Command Failed\"
This command looks a bit weird so let's have a closer look at it.
We first have DYNAMIK. DYNAMIK is our friend asking the driver to interpret the string as javascript.
Then lets have a look at the first part within braces:
We are comparing strings. Inside a DYNAMIK field, strings are always enclosed between '\"' (backward slash and double quote before and after the string). Why? Because we need to know the " is not a JSON one but part of the field, so we "exit" it as an external caracter. So as a conclusion, \"$Result\" means 'I want what is inside $Result and compare it as a string'. So we want to compare it to \"success\". The way to compare is '=='. It means, is it equal? As you remember the normal result of the command should be 'success' so in this case, if the command works well, it will indeed be equal.
Going back to the global field, you can see it globally looks likes this: atest ? something : somethingelse. As you remember, on the left side of the question mark is a condition, is success equal to success. Yes it is, so the result will be true. If it is true, the something will be chosen, if the result is false, the somethingelse would be chosen. The tests you can use in comparing are ==, <=, >=, <, >, != (not equal), and many others.
So basically as you start to understand, if the command returns 'success', we will diplay 'Left pressed', if not, 'Command failed'.

OK, we are all set for the second part of this tuto step.
```
"POWER ON": {"label":"", "type":"HTTP-GET", "command":"http://$MyTVIP:6095/controller?action=getinstalledapp&count=999&changeIcon=1", "queryresult":"$.msg", "evalwrite":[{"variable":"MyStatus","value":"DYNAMIK (\"$Result\"==\"success\")?\"Power is on\":\"Trying to Switch on by IR\""}], "evaldo":[{"test":"DYNAMIK \"$Result\"==\"success\"", "then":"", "or":"__POWER ON-IR"}]},
"__POWER ON-IR": {"label":"", "type":"HTTP-GET", "command":"http://192.168.1.26:3000/v1/projects/home/rooms/6394342251295670272/devices/6699143044186243072/macros/6699143044261740545/trigger", "queryresult":"$.msg", "evalwrite":[{"variable":"MyStatus","value":"DYNAMIK (\"$Result\"==\"success\")?\"Power Off\":\"Command Failed\""}]}
```
In this example, you can see something much more interesting than displaying 'Left pressed' in the remote.
My MiTV doesn't understand WOL (Wake On Lan). But it understands IR. Unfortunately, it is the very same command to power on or power off the TV. So basically when I power on the recipe, sometimes it is powering on the TV, sometimes it is switching off (making me very popular with my family :-).
So here is the trick: on the "power on" button, the first thing I do is sending a basic command to the TV. If the TV is on, it should always be a success. If it is not, the mentioned evalwrite assigns 'Trying to switch on by IR' to the varioable MyStatus. In the evaldo, I do the same test, and then I launch another command. For your information this command is a Neeo Brain command launching an IR call through my Broadlink driver (but could be any), then I throw an infra red call but being 100% sure that it never switches off the TV. 
NOTE: in order to get the exact text of any of your recipe, you could use the Neeo Brain explorer of my meta. It is currently a bit raw but I will refine it soon.

### Tutorial Step 4b - List component.

In this component we will start to learn the (by far) more complex component of the Neeo Remote. It is also (by far) the coolest.
Let's analyse these somewhat cryptic lines:
```
"directories":{
    "Programs": {"label":"", "feeders": {
        "Programs":{"label":"", "commandset": [{"type":"HTTP-GET", "command":"http://$MyTVIP:6095/controller?action=getinstalledapp&count=999&changeIcon=1", "queryresult":"$.data.AppInfo[*]", "itemname":"DYNAMIK JSON.parse(\"$Result\").AppName", "itemlabel":"\"Android TV App\"", 
            "itemaction":"ProgramSet", "itemimage":"DYNAMIK JSON.parse(\"$Result\").IconURL", "evalwrite":[{"variable":"PackageName","value":"DYNAMIK JSON.parse(\"$Result\").PackageName"}]}]},
        "ProgramSet":{"label":"", "commandset": [{"type":"HTTP-GET", "command":"http://$MyTVIP:6095/controller?action=startapp&type=packagename&packagename=$PackageName"}]}
       }
    }
}
```
A Directory is basically a button calling a list. In this case, we will have one buttton: "Programs".
Then we have Feeders. A Feeder basically feeds the list with data. In the Feeder we decide what to feed and how to display (listitem and title for example). Finally we also have a special Feeder for action to be done. Multiple feeders allow navigating among feeders, for example as you see in the volumio demo (it's frankly quite a nightmare to code but hey!, in the meta it is done for you :-).  
In this example we have 2 Feeders, one to display the program, another to perform an action.
The first Feeder (called 'programs' also) triggers a command returning a gigantic JSON (cut here in order to save place)
```
{

"status":0,

"msg":"success",

"data":{"AppInfo":[{"PackageName":"com.archos.mediacenter.videofree","IconURL":"http:\/\/192.168.1.33:6095\/request?action=getResource&name=com.archos.mediacenter.videofree1.png","AppName":"Archos Video","Order":1},{"PackageName":"org.videolan.vlc","IconURL":"http:\/\/192.168.1.33:6095\/request?action=getResource&name=org.videolan.vlc1.png","AppName":"VLC","Order":2},{"PackageName":"com.mxtech.videoplayer.ad","IconURL":"http:\/\/192.168.1.33:6095\/request?action=getResource&name=com.mxtech.videoplayer.ad1.png","AppName":"MX Player","Order":3},{"PackageName":"com.cloudtv","IconURL":"http:\/\/192.168.1.33:6095\/request?action=getResource&name=com.cloudtv1.png","AppName":"OTT","Order":4},{"PackageName":"com.newtv.cboxtv","IconURL":"http:\/\/192.168.1.33:6095\/request?action=getResource&name=com.newtv.cboxtv1.png","AppName":"CCTV.新视听","Order":5},
```
What is interesting are the values in the lines:
```
{"PackageName":"org.videolan.vlc","IconURL":"http:\/\/192.168.1.33:6095\/request?action=getResource&name=org.videolan.vlc1.png","AppName":"VLC","Order":2}
```
In order to get that we do the jsonpath: $.data.AppInfo[*]. 

It returns:
```
[
 {
   "PackageName": "com.archos.mediacenter.videofree",
   "IconURL": "http://192.168.1.33:6095/request?action=getResource&name=com.archos.mediacenter.videofree1.png",
   "AppName": "Archos Video",
   "Order": 1
 },
 {
   "PackageName": "org.videolan.vlc",
   "IconURL": "http://192.168.1.33:6095/request?action=getResource&name=org.videolan.vlc1.png",
   "AppName": "VLC",
   "Order": 2
 },
 ...
 ```
This is what we want. the VERY IMPORTANT point to note is that the value returned is an array. As you remember, an array is between [...].
So basically, each lines of the list will be assigned one item of the table.
#### itemname
Itemname is the name of the item displayed. The value we will choose is the 'AppName' attribute. In order to get it, we need to do: "DYNAMIK JSON.parse(\"$Result\").AppName"
Again something new here, but immensely useful, JSON.parse (case sensitive). The JSON.parse will read a small JSON expression and make the attributes and their value available.
#### itemlabel
A fixed label here.
#### itemimage
Url for the thumbnail being displayed, we use the IconURL given by my TV.
#### itemaction
Here is the name of the next Feeder performing the action, in our case, ProgramSet.
#### evalwrite
Here is our old friend evalwrite. It will be activated when we click on the line. Here it will help to persist the packagename. Because the packagename is used as an argument for the action we want to trigger.
#### action feeder
Action Feeder is not really a Feeder but the action triggered when we click on an item on the list.
In our case you see the following command.
http://$MyTVIP:6095/controller?action=startapp&type=packagename&packagename=$PackageName
You can recognise the $PackageName we have used. It will basically start the application in my TV we have choosen.

### Tutorial Step 5 - Advanced List component.

This tutorial-step is essentially focusing on the list component. In order to do that, we will use a device you can actually really use yourself: the Neeo Brain.
So basically the code we will look at is just a Brain explorer able to trigger a recipe directly.

https://www.youtube.com/watch?v=76BTjlOiIHk

```
"variables":{
        "MyStatus":"",
        "RoomKey":"",
        "DeviceKey":"",
        "TriggerKey":""
  
},
"directories":{
    "recipes": {"label":"", "feeders": {
        "Rooms":{"label":"Rooms list", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemtype": "listitem", "itemlabel":"Recipe name", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/rooms.jpg", "evalnext":[{"test":true, "then":"Devices", "or":"Rooms"}], "evalwrite":[{"variable":"RoomKey","value":"DYNAMIK JSON.parse(\"$Result\").key"}]}  
                                                 ]},
        "Devices":{"label":"Devices list", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"Recipe name", "itembrowse":"DYNAMIK JSON.parse(\"$Result\").key", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/devices.jpg", "evalnext":[{"test":true, "then":"Macros", "or":"Devices"}], "evalwrite":[{"variable":"DeviceKey","value":"DYNAMIK JSON.parse(\"$Result\").key"}]}
                                                  ]},
        "Macros":{"label":"Macros list", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros", "queryresult":"$.*", "itemname":"DYNAMIK JSON.parse(\"$Result\").name", "itemlabel":"Recipe name", "itemaction":"ACTION_ActivateMacro", "itemimage":"https://raw.githubusercontent.com/jac459/metadriver/master/AVReceiver/Neeo_logo.jpg", "evalwrite":[{"variable":"TriggerKey","value":"DYNAMIK JSON.parse(\"$Result\").key"}]}]},
        "ACTION_ActivateMacro":{"label":"", "commandset": [{"type":"http-get", "command":"http://$NeeoBrainIP:3000/v1/projects/home/rooms/$RoomKey/devices/$DeviceKey/macros/$TriggerKey/trigger", "queryresult":"$.*", "itemname":"", "itemlabel":"Recipe name", "itemaction":""}
                                                  ]}
        }
    }
}
```

Before going through the list, let's look at 2 preliminary points:
#### $NeeoBrainIP
This variable is a special variable. It is used but not part of the variables declared. It is because it is a 'system variable'. You can use it any time and it contains... (drumrolls) your discovered Neeo Brain IP address. 
#### settings
If you look in the activated devices, you won't find any file about the Brain navigator. It is because this device is considered as a 'core device' and as such is placed directly into the setting.js file. That doesn't change anything, it just ensures that even if you have an empty 'activated' folder, you have at least the Brain explorer. In the future, this 'core device' feature will be enriched for example to allow direct installation of devices through an 'installer' device.

OK, going back to the list management. If you remember the previous tuto (and I hope you do remember :-)), we just learned to display a list and perform one action with it. In this tuto, we will learn how to navigate in a list.

So going back to our example, the directory we are looking at in this tuto is 'recipes'. This directory has multiple Feeders but let's look at the first one, Rooms.
It basically displays the list of rooms.
#### itembrowse [DEPRECATED]
If you look directly at the settings or my previous devices, you may find an itembrowse element. Please don't use it, it has been deprecated, advantageously replaced by the variable concept.
/!\ MY APOLOGIES ON THIS ONE: on the version 0.7.3 of the driver, while itembrowse was deprecated, the item needs to be there for the list to work even if the value was not used. Sorry if you struggled because of that, it is fixed now.
#### evalnext
Evalnext is conceptually very close to evaldo, it basically helps to decide the next step. The difference is that evaldo was for Buttons and Triggers when evalnext is for the next step of navigation. So it starts with a test (that we leave to true in this example) and after that, the usual 'then' and 'or' clauses. In this example, we will always go to the next step which is the next Feeder, 'Devices'.
At this point in time, you may think "in this case, I can only navigate to do directories, isn't it a problem?". Fear not, it is not. 
In the volumio for example, in the first page of one of the list you have 4 choices, this is how it is done:
```
      "evalnext":[
                {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Artists\")", "then":"Artists", "or":""},
                {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"AllAlbums\")", "then":"AllAlbums", "or":""},
                {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Playlist\")", "then":"Playlist", "or":""},
                {"test":"DYNAMIK (JSON.parse(\"$Result\").navigation == \"Spotify\")", "then":"Spotify", "or":""}
                ]
```
Yes, evalnext is a table and all conditions will be evaluated, so you can have as many choices as you want.

### Tutorial Step 6 - Listeners.

Ok, in this tutorial we continue to push the complexity (and the fun) . We'll watch the nice behavior you can see on the Volumio driver when the remote actually reacts to the control we are making to the Volumio and not to the remote itself.

##### A little bit of theory...

###### Observation patterns:
OK, here I need to explain a bit the way it is working. When you are monitoring something (in life like in computer science), you basically have 2 choices: Event based or polling. 
Event based is what a parent likes to do with his kids when they go out: 'You tell me if you got a problem'. 
Polling is what as parent does if the trust is limited; calling every 5 minutes: "Do you have a problem?".
In IT like in real life, we need to use absolutely as much as possible Event based. Polling is a fallback method.

###### Implementation in meta and neeo:
Apart from trying to use events as much as possible, the 2nd thing that the metadriver tries to do is keep the work on the "brain/computer running the driver" side. We don't care if the brain works a little bit, even a few request per second is very little load for such a device. On the other hand, on the remote part, we don't want to use battery so we don't want to keep it to work too much. For this reason, the remote is called only if a value is actually changed and it is only called through the Neeo optimized API (which is very slow). That's why if you use your phone app with the Volumio driver, the app will react instantly but the remote will take a few seconds. It is not a problem, remember that it is a remote, not a phone and it needs to save battery.

So with that it mind, let's go to the Volumio implementation:

```
    "webSocket":"http://volumio.local", 
    "listeners" : {
      "VolumioStatus" : {"type":"webSocket", "command":"pushState", "queryresult" : "", 
        "evalwrite" : [ 
            {"variable" : "Playing", "value" : "DYNAMIK JSON.parse(\"$Result\").title + \" - \" + JSON.parse(\"$Result\").album + \" - \" + JSON.parse(\"$Result\").artist + \" @ \" + JSON.parse(\"$Result\").trackType+ ((JSON.parse(\"$Result\").bitdepth && JSON.parse(\"$Result\").samplerate) ? (\"/\"+JSON.parse(\"$Result\").bitdepth.replace(/ /g, \"\")+\"/\"+JSON.parse(\"$Result\").samplerate.replace(/ /g, \"\")) : \"\")"}, 
            {"variable" : "VolumePlayed", "value" : "DYNAMIK JSON.parse(\"$Result\").volume"}, 
            {"variable" : "VolumePlayedDisplay", "value" : "DYNAMIK '||'.repeat(JSON.parse(\"$Result\").volume) + '--'.repeat(Math.round((100-JSON.parse(\"$Result\").volume)/3))"}, 
            {"variable" : "AlbumCoverURI", "value" : "DYNAMIK (!JSON.parse(\"$Result\").albumart.startsWith(\"http\") ? (\"http://volumio.local\" + JSON.parse(\"$Result\").albumart) : JSON.parse(\"$Result\").albumart)"}
          ]
        },
      "VolumioProgress" : {"type":"http-get", "command":"http://volumio.local/api/v1/getState", "pooltime":"3000", "poolduration":"", "queryresult" : "$.data", 
        "evalwrite" : [ 
             {"variable" : "Progress", "value" : "DYNAMIK Math.round(0.1*Number(JSON.parse(\"$Result\").seek)/Number(JSON.parse(\"$Result\").duration))"},
             {"variable" : "CurrentDuration", "value" : "DYNAMIK JSON.parse(\"$Result\").duration"}
          ]
        }
    },
```
The first thing we see is Websocket. Websocket is part of the new connections provided by v0.7.3 of the metadriver. This connection is very interesting because it allows event based monitoring. And it is compatible with Volumio (through socket.IO) so why not use it?
Then you have the listeners, 2 actually: VolumioStatus and VolumioProgress.
Let's go for VolumioProgress first as it is less sophisticated (polling).
So this listener looks like a usual command with 2 differences:

#### pooltime (I should change the name as it is polling and not pooling (English is not my first language as you have surely already noticed).
The default value if not provided is 1000 (=1000ms = 1 second). In general, I would advice 3000 (3 seconds). It is the best compromise between speed and battery. Anyway if you go for a fast polling, the remote will loose count and starts to be even slower. So as you understood, if your polling is 3000, that means that every 3 seconds, the device hosting the driver (brain, raspberry, NUC, whatever) will send a request to the observed device and ask him the status of what it is observing. In the case of the Volumio, it asks for the current progress of the music. Unfortunately the Volumio doens't answer with a percentage but a time, so the complexe calculation you see is just to go back to a number between 0 and 100 as it is the way the slider wants it.
#### poolduration
It is the time you are authorised to swim.
Just kidding, it is the duration for which the device will poll the observed device (Volumio for example). This is not much used since I have implemented a way to stop the polling more elegantly. Yet it can be useful so I kept it. 
Why do I use polling when Volumio provides event based monitoring? It is just because this specific value is not provided (as the value changes all the time, that doesn't make sense).

#### socket
Now we can move to the socket.
It is a new type of command, based on the event. Generally sockets deal with 2 actions: "emit" and "on". "Emit" is to send a message, "On" is to wake-up when a specific event is triggered. Guess what, in this case I am just saying to the Volumio "I want to be warned if a state changes" so i register on("pushState"). "pushState" is the particular event triggered by Volumio if its state changes. This is very handy because Volumio sends back its global state. So as you can see in the different Evalwrites, I use it to refresh the album art, the labels, the volume...  
Then in the DYNAMIK part, you can see that I added some fancy javascript stuff in order to have a better display. I let you google or ping me on the telegram should you have any interest on it. 

#### actionListen
```
    "labels":{  
      "CurrentStatus" : {"label":" ", "listen":"Playing", "actionlisten":"VolumePlayedDisplay"}
    },
```
One fancy thing that is done with the Volumio and is easy to do, is a label displaying something for a shortwhile before returning back to its default value.
This is achieved by the actionListen. In listen you will put a variable showing the state of the label, on actionLIsten you will show the value of a variable, only when it changes and only for a short while.

