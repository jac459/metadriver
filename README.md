# metadriver
Programmable driver for Neeo to command any device and generate complex integration.
Example of integration:
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

