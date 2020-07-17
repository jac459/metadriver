# metadriver
Programmable driver for Neeo to command any http device or command-line activated device.

##Install
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
- Create sliders 
- Create lists (directories)
- link buttons with sliders
- Chained commands (one button have different behaviour each time pressed, example, mute toggle will mute on or off when pressed)

## To do

- Wake On Lan command
- other protocoles (Websockets, TCP, MQTT, ...)
