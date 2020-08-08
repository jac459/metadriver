# metadriver
Programmable driver for Neeo to command any device and generate complex integration.

Version 0.7.0 => Alpha release for advanced users.

## Features
### Full Support
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

### Partial Support
(tested with on device)

- Control any device with http-post and JSON API.
- Control any device with http-get and XML API.
- Control any device with WebSocket and JSON API.
- Control any device with Socket.IO and JSON API.
- Control any device with CLI.
- Listen to devices through WebSocket or http pooling.

### In Progress
(being developped)
- Device activation detection (in order to stop pooling when the device is not activated.
- Player widget.

### To Do
(not started but planned)
- Support of headers on http calls.
- Create lists (directories) with paging and complexe navigation (buttons)

##Install

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
