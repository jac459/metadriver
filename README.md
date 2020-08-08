# metadriver
Programmable driver for Neeo to command any http device or command-line activated device. If you don't own a Neeo remote you are probably not interrest.

Version 0.7 => Alpha Version openned for limited users.

## Features
- Control any device with http-rest api. (Full Support).
- Control any device with cli calls. (Partial Support).
- Control any device with XML api (SOAP). (Partial Support).
- Control any device with WebSocket api. (Partial Support).
- Control any device with Socket.IO api. (Partial Support).
- Create Buttons. (Full Support).
- Create sliders. (Full Support).
- Create Switches. (Full Support).
- Create Labels. (Full Support).
- Create Images. (Full Support).
- Create URL. (Full Support).
- Create Music Widget. (In-Progress).
- Create lists (directories). (Full Support).
- link buttons with sliders. (Full Support).
- Chained commands (one button have different behaviour each time pressed, example, mute toggle will mute on or off when pressed). (Full Support).
- Added Variable Management for complexe integrations => a button or a choice in a list, can write in a variable, this variable can be reused by other components. (Full Support).
- Attach Variables to listeners (example, your remote volume slider will move automatically while your are changing the volume directly on your device). (In-Progress).

##Install

This application is written in Node.js. You thus need to install a proper Node.js environment in your computer to run it. In particular you need Node.js and NPM.
Node.js can be installed from there: https://nodejs.org/en/download/
When you install node.js, you automatically install npm.

In order to install this software you need to download the files in this repository into a repository in your target computer.

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


## To do

- Wake On Lan command
- other protocoles (Websockets, TCP, MQTT, ...)
