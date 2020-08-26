As I am working quite a lot on this driver nowadays, don't hesitate to supporte me to buy coffee. More coffees help me getting awake longer time and being more productive :-). 

https://www.paypal.me/jac459

# metadriver
Programmable driver for Neeo to command any device and generate complex integration.
Example of integration:
#### https://youtu.be/ybQrpgSK1yM

#### https://www.youtube.com/watch?v=-XNF1mSqwuo

#### https://www.youtube.com/watch?v=LN6M7-U_0Bk&t=12s

This readme apply to metadriver Version 0.8.1 => Alpha release for advanced users.

#### Latest update
Version 0.8.1 brings some bug fixes as well as:
- Architecture refactoring with creation of a Variable Vault (centralized)
- Creation of a datastore to persist value on the device drive (step 1)
- MQTT support
- Devices Discovery fully spported
- Devices registration (step 1, only code)
- Enhance polling activation for device listening.

Version 0.7.3 brings some minor bug fixes as well as:
- By default Brain Navigator device
- minor bug correction
- Devices discovery (for Hub devices like Philips Hue or Snapcast)
- Refined device listening with better Brain resource management.
- Improved Volumio sample device
- Snapcast support (in progress)
- Technical protocols: JSON over TCP

## Features
#### Full Support
(tested on many devices)

- Control any device with HTTP-GET and JSON API (REST).
- Control any device with HTTP-POST and JSON API.
- Control any device with Socket.IO and JSON API.
- Create Buttons
- Create sliders 
- Create Brightness sliders
- Create switches 
- Create Images 
- Create lists (directories) with paging and complex navigation (items and tiles)
- Link buttons with sliders
- Chained commands (one button has different behaviour each time pressed. Example: mute toggle will mute on or off when pressed)
- Variables Management for complex integrations => a button or a choice in a list, can write in a variable, this variable can be reused by other components.
- Listen to devices through Socket or HTTP pooling.

#### Partial Support
(tested with one device)

- Device Discovery (one implementation ==> Snapcast driver)
- Control any device with HTTP-GET and XML API.
- Control any device with WebSocket and JSON API.
- Control any device with Json over TCP.
- Control any device with CLI.
- Wake On Lan


#### In Progress
(being developed)
- Device activation detection (in order to stop pooling when the device is not activated.
- Player widget.
- Full rest protocole (PUT, DELETE,...). 
- Basic registration with security code. 

#### To Do
(not started but planned)
- Registration capability improvement in order to register to external systems (Hue, Spotify, ...)
- Variable saving (dictionary store),
- Support of headers on HTTP calls.
- Buttons in list
- Additional transport and format (MQTT, TCP, ...).
- More sample devices (including IR blaster examples).
- Persist Variables on drive. 

#### Known Bugs
- [should be fixed] Variables are not working for discovered items

#### Release Plan

![alt text](https://raw.githubusercontent.com/jac459/metadriver/master/pictures/releaseplan.jpg)

## Install

This driver is based on Node.js technology, you thus need to install node.js first in your computer: https://nodejs.org/en/download/. At time of writing this article (Q3 - 2020) this driver support the latest version of node.js. 
Note: this driver can be directly installed on the Neeo brain provided that you root it first. Please consult the following repository to get more information: https://github.com/jac459/NeeoDriversInBrain.
Note that installing the driver in the brain is more complex overall and it is recommended to start by using a computer or a raspberry ideally.

In order to install, download the zip of the repository (by clicking the green "code" button) and download in your target computer (or brain).
unzip it and run:
```npm install```
This command will install the driver and all the dependencies. You need to have an internet access in order to download the dependencies.
#### What am I installing? 
The main dependency you are installing is obviously the neeo libraries. Itbis automatically installed so you don't need to go to neeo's github. 
Other than that you install an hand full of connections libraries in order to connect to the various potential devices you own and speaking all slightly different languages. 

To run the driver, you can either type:
```npm start```
or
```node meta```

## How this driver work ?
This driver is a Meta driver. That means that in fact it is not really a driver but an engine in order to create dynamically drivers. 
It dynamically uses JSON setting files (device files) in order to create various drivers loaded in the Neeo brain.
A few examples of drivers are provided in 'activated' and 'deactivated' folders.
Any file put in the 'activated' folder will be interpreted in order to generate a new driver.
One advantage of this approach is that resources are well centralized and are supposed to have lesser impact on the brain.
Also, if you run from a Raspberry, the max number I have been able to load is 8 devices. Using this driver you can load as many drivers as you need.
Another advantage is that there is only one code base running all the drivers so it will be theoretically easier to track bugs.
Simple drivers will have very simple device files but expect a bit more complexity for advanced interactions.

The target for this driver is to create a set of "device files" in order to continue to support many new devices when the Neeo cloud will close.

In terms of architecture, this driver is based on 4 main parts:
Meta.js:constitutes the glue with neeo api to create the graphical side (kind of MVC). 
Metacontroller.js: It is the main engine including a basic syntaxique engine interpreting the device.json file in order to create the desired behaviors 
Processingmanager.js: This is the glue to the outside world. Depending of the device maker choice it will trigger different techniques in order to interact with the actual device to be controlled. It contains both the communication protocole and the data retrieval strategy (xpath, jsonpath, regex). It is a kind of strategy pattern. 
Variables Vault.js: this vault contains all the data manipulated by the devuces created as well as the callback to be called when a value is changed (kind of observer pattern). It also contains the persistency logic. 

## How to use

When you start the driver, the driver will scan your "activated" folder and try to load any device placed there.
 
IMPORTANT: On the first run, the driver will detect your Neeo Brain and create a 'config.js' file in order to store its IP and Port. If you have problems connecting, make sure to delete the "config.js" file and run again. If you  still can't connect and the port is taken, you can manually edit the config.js file and change the port number (any arbitrary number). 

If the driver is correctly loaded, you can go to your Neeo App and search for the name of the driver you created.

To use the driver without creating your own device files, you just need to know that and put the device files you are interested in to the "activated" folder and restart the driver. You will now be able to run them on the remote.

## User Corner

 TODO: add how-to for the different devices created

## Maker Corner

Hey, if you plan to create your own device for the metadriver, you are very much welcome and encouraged to do so. You can go to the folling link in order to find plenty of information on it.

https://github.com/jac459/metadriver/blob/master/TUTORIALS.md
