# metadriver
Programmable driver for Neeo to command any device and generate complex integration.
Example of integration:
https://www.youtube.com/watch?v=LN6M7-U_0Bk&t=12s

This readme apply to metadriver Version 0.7.0 => Alpha release for advanced users.

## Features
#### Full Support
(tested on many devices)

- Control any device with http-get and JSON API.
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

### Tutorial Step 1 - Simple button device

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


