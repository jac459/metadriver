As I am working quite a lot on this driver nowadays, don't hesitate to supporte me to buy coffee. More coffees help me getting awake longer time and being more productive :-). 

https://www.paypal.me/jac459

# metadriver
Programmable driver for Neeo to command any device and generate complex integration.
Example of integration:
https://youtu.be/ybQrpgSK1yM
https://www.youtube.com/watch?v=LN6M7-U_0Bk&t=12s

This readme apply to metadriver Version 0.7.0 => Alpha release for advanced users.

## Features
#### Full Support
(tested on many devices)

- Control any device with http-get and JSON API (REST).
- Create Buttons
- Create sliders 
- Create switches 
- Create Images 
- Create lists (directories) with paging and complexe navigation (Items and tiles)
- link buttons with sliders
- Chained commands (one button have different behaviour each time pressed, example, mute toggle will mute on or off when pressed)
- Variables Management for complexe integrations => a button or a choice in a list, can write in a variable, this variable can be reused by other components.

#### Partial Support
(tested with on device)

- Control any device with http-post and JSON API.
- Control any device with http-get and XML API.
- Control any device with WebSocket and JSON API.
- Control any device with Socket.IO and JSON API.
- Control any device with CLI.
- Listen to devices through WebSocket or http pooling.
- Wake On Lan

#### In Progress
(being developped)
- Device activation detection (in order to stop pooling when the device is not activated.
- Player widget.

#### To Do
(not started but planned)
- Support of headers on http calls.
- Create lists (directories) with paging and complexe navigation (buttons)
- additional transport and format (MQTT, TCP, ...).
- more sample devices (including IR blaster examples).

## Install

This driver is based on Node.js technology, you thus need to install node.js first in your computer: https://nodejs.org/en/download/
Note: this driver can be directly installed on the Neeo brain provided that you root it first. PLease consult the following repository to get more information: https://github.com/jac459/NeeoDriversInBrain.
Note that installing the driver in the brain is more complex overall and it is recommanded to start by using a computer or a raspberry ideally.

In order to install, download the zip of the repository (by clicking the green "code" button) and download in your target computer (or brain).
unzip it and run:
```npm install```
This command will install the driver and all the dependancies. You need to have an internet access in order to download the dependancies.

To run the driver you can either type:
```npm start```
or
```node meta```

## How this driver work ?

This driver is dynamically using JSON setting files (device files) in order to create various drivers loaded in the neeo brain.
A few examples of drivers are provided in 'activated' and 'disactivated' folders.
Any file put in the 'activated' folder will be interpreted in order to generate a new driver.
One advantage of this approach is that resources are well centralised and are supposed to have lesser impact on the brain.
Also, if you run from a Raspberry, the max number I have been able to load is 8 devices. Using this driver you can load as many drivers as you need.
Another advantage is that there is only one code base running all the drivers so it will be theoretically easier to track bugs.
Simple drivers will have very simple device files but explect a bit more complexity for advanced interactions.

The target with this driver is to create a set of "device files" in order to continue to support many new devices when the neeo cloud will close.

## How to use

When you run of the driver, the driver will scan your "activated" folder and try to load any device placed here.
 
IMPORTANT: On the first run, the driver will detact your Neeo Brain and create a 'config.js' file in order to store its IP and Port. If you have problem connecting, make sure to delete the "config.js" file and run again. If you have still can't and the port is taken, you can manually edit the config.js file and change the port number (any arbitrary number). 

If the driver is correctly loaded, you can go to your Neeo App and search for the name of the driver you created.

To use the driver without creating your own device files, you just need to know that and put the device files you are interrested on the "activated" folder and restart the driver. You will now be able to run them on the remote.

## Tutorial : Creating your own devices

Note: you should have a basic understanding of JSON. JSON is an extremly simple file format, with an "Attribute" : "Value" concept. This tutorial will not explain JSON as such but you shouldn't be affraid of it, it really is very simple.

### Tutorial Step 1 - Simple buttons device

In order to create your single button device you can use the following sample file:
```
{"name":"Tuto Step1", 
    "manufacturer":"Your Name",
    "version":1,
    "type":"AVRECEIVER", 
    "buttons":{
      "CURSOR LEFT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=left"},
      "CURSOR RIGHT": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=right"},
      "CURSOR UP": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=up"},
      "CURSOR DOWN": {"label":"", "type":"http-get", "command":"http://192.168.1.33:6095/controller?action=keyevent&keycode=down"}
    }
}
```
Let's have a look on the file and understand each fieds:
- name : this is the name your device will have, you will be able to find it by this name in the remote.
- manufacturer : put the brand of the device you will control here.
- version : IMPORTANT /!\ /!\ Once a device is first created, its structure is set. If you add new buttons and you want the remote to notice, you will need to delete the device and recreate the device (not convenient) OR just increment the version number. In the future, if you add an item and get frustrated because the remote doens't seems to care, remember this version field. NOTE: you cna not edit or delete a button by incrementing the version, you will need to delete and reload the device.
- type : IMPORTANT /!\ /!\ This field is also important, it will drive the way your remote will interpret your device. The problem is that not all features are supported for all devices. For example, if you want to use the channel button, you can't use a light device type, you will need a AVRECEIVER or TV type for example. As a simple way to create, I like to use the AVRECEIVER, you have to make it appears in the remote by activating it in the recipes part (choose SHOW) but it is quite flexible and support most of the interactions.If you see warning lines when you run the device, it is because in this example you didn't declare INPUT buttons while your device is an AVRECEIVER. It doesn't matter but it shows you how neeo reacts. You can dive into the neeo SDK in order to better understand the limitation of each device (note that the documentation is incomplete).
The type you can choose from are: ACCESSORY, AUDIO, AVRECEIVER, DVB (aka. satellite receiver), DVD (aka. disc player), GAMECONSOLE, HDMISWITCH, LIGHT, MEDIAPLAYER, MUSICPLAYER, PROJECTOR, TUNER, TV, VOD (aka. Video-On-Demand box like Apple TV, Fire TV...), SOUNDBAR.
- buttons : You have here the list of the buttons. The name can be any name and you can change the display name in the "label" attribute. Some buttons are recognised by the remote control. It is specially handy if you want to map a feature to an hardware button like the cursor. In this example, you can use the cursor arows of the remote directly.
The list of the recognise buttons is presented here : https://github.com/NEEOInc/neeo-sdk#neeo-macro-names. Please note that this list is incomplete and you can discover other buttons by browsing planet-neeo forum or the widgets description. It is anyway a good start.
- type (in buttons) : This field is very important as it will drive the protocole used for your device. In this example, it is just an http request (GET). The supported types are: http-get, http-post, webSocket (works with socket.io), static, cli and http-get-soap. Examples on each types will be provided. More types will be added in the future.
- command: Here you put the url you want to call. This is a very simpe and efficient to control a device, much faster and reliable than with Infra Red control. A lot of devices are exposing directly an API and you just have to copy paste your URL in the command field (inside the quotes). For example, here you can find an easy way to control your Xiaomi TV: https://github.com/spocky/mireco#gitv-http-api-featuresdocumentation or here , your yamaha receiver: http://habitech.s3.amazonaws.com/PDFs/YAM/MusicCast/Yamaha%20MusicCast%20HTTP%20simplified%20API%20for%20ControlSystems.pdf. You are often just a google search away. 
Note: for more complexe devices, you can download an intermediary driver, exposing a REST API. So this meta driver will use this driver to remote control. I use such a driver in Python to control my Xbox One X. The resulting performance is excellent (instant reaction).

### Tutorial Step 2 - Label device

This first step was easy but very boring. Let's have a bit more fun. Now we will have 2 buttons controlling what a label display.
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
In this example we introduce a major concept which is the variables.
The variable is very important but itself, it is of no use. 
"LabelStatus":"Default value" => the LabelStatus is an arbitrary name that you choose (in one word please) . The 'default value' is a ... default value that you choose. Can be empty.
#### label
Then in the label part. You see an arbitrary name (CurrentStatus, one word), a label name, if you want to change the label, and then the most important:
- listen: in this important field, you put the name of a variable. After, each time you assign a value to this variable, the label will have this value.
#### evalwrite
This is a new feature we can attach to a button (or any actionnable component). 
- evalwrite: evalwrite allows you to write a value in a variable. There is a lot of complex way to do it, but in this simple example, we will use a very special variable:
- $Result: $Result is a specific variable being assigned the result of the command. In this example, it is very easy because the command is of type "static". With an http-get you would get the result of the call, but with a type static, it just copies the value inserted in command. 
- evalwrite (2) : Comming back to evalwrite, this function just copy in the "variable", the "value" part. 
  /!\ IMPORTANTE NOTE: You can have multiple evalwrite triggered. The code would look like that: "evalwrite":[{"variable":"LabelStatus","value":"$Result"}, {"variable":"anotherVariable","value":"AnotherValue"}]. Each evalwrite is between [...], indicating an array, and then as normally: {...}. So basically to have an array with 2 evalwrite, it will look like that: [{...}, [{...}].

### Tutorial Step 3 - Let's go to something more complex...
Let's extend the previous example. Now we will have a button up and down. These buttons, changes the value of a switch and the switch changes the value of 2 pictures
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
- label: the picture label, name if not provided.
- size: can be small or large.
- listen: the listen is attached to a variable, like the label, but it has to be an URL pointing on a jpg if you want something to be displayed. Recommanded size of the pic is 480x480px for a big image and 100x100px for a small.
#### The switch element.
The switch element is a bit more complex. You can assign it some commands and you can control it like a label with a "listen" attribute. The accepted value will be either false or true. /!\ In JSON, false and true are NOT between double quote ". So you directly have true or false (cf the example). With the switch, we introduce a new element which is evaldo. evaldo can be also present in a button. Meaning a button can have bothe evaldo and evalwrite. On the contrary, a switch can only have evaldo. When evalwrite is here to write into variables, evaldo is there to perform an action (triggering a button).
#### evaldo
In evaldo, you have:
- test: this test can be true or false (more on it later).
- do: the name of the button to be triggered if the result is true. If you don't want a button to be visible but you want to be able to call it, just prefix it by "__" like int the example.
- or:the name of the button to be triggered if the result is false. 
- DYNAMIK. In this example, you have seen a weird expression: DYNAMIK $Result. This is because the $Result in this driver can only be a string. So here the $Result will be "true" for example if the switch is on the right. In fact we don't need it to be "true" (like the string true) but true (like the boolean value). So we ask the driver to interpret the string value and transform it in a real boolean. In the next steps, we will see a lot of powerful and more complex usage of DYNAMIK keyword.
/!\ IMPORTANTE NOTE: This DYNAMIK feature is extremely powerful and is available on many fields. It truely allows to adapt to many real world situation in order to manage various different devices. The drawback is that it generates 'in theory' a security issue because it allows to inject code into the metadriver. For this reason, you should avoid running the driver as an administrator (and you don't have any reason to do that).
Note 2: In this example, you see how variables are used in a field. It is just $ before the name of the variable so the driver knows it is a variable ($MyVariable). 
IMPORTANT: Don't use 'nested' names for variables. For example if you have a variable MyVariable and MyVariable2, if you write in a field $MyVariable2, the driver will understand it as Myvariable and '2'. So for example if the value of $MyVariable is Hello, you will endup with Hello2.

