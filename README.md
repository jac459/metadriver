As I am working quite a lot on this driver nowadays, don't hesitate to supporte me to buy coffee. More coffees help me getting awake longer time and being more productive :-). 

https://www.paypal.me/jac459

# metadriver
Programmable driver for NEEO to control any device and generate complex integration.
Examples of integration:
#### https://youtu.be/ybQrpgSK1yM
#### https://www.youtube.com/watch?v=-XNF1mSqwuo
#### https://www.youtube.com/watch?v=uwL7UPG0shI
#### https://www.youtube.com/watch?v=6-sFs4sADLE
#### https://youtu.be/7j605CJoSGE
#### https://www.youtube.com/watch?v=XpKpmx7qhjY
#### https://www.youtube.com/watch?v=MDp45PwwUho
#### https://youtu.be/9Z_wd0l7iyM
#### https://www.youtube.com/watch?v=LN6M7-U_0Bk&t=12s

This readme applies to metadriver Version 0.8-Alpha (build 0.8.15) release for advanced users.

#### Latest update

Full Discovery feature working on both yamaha and hue/hueGroups drivers.
No need to enter any IP address, the meta scans the network and find the devices. 
Bug (nasty) corrected on hue bulbs state listener. 

##### New Features
- Enhanced support for HTTP-REST (incl. PUT) 
- Extended jsonpath support (new framework and multithreaded execution) 
- Fully working registration support for security code. 
- Sample registration devices: snapcast, Philips hue with color pick, yamaha network receiver with model detection. 
- Refined polling activation for device listening.
- Refined resource management for discovered devices. 
##### known bugs and limitations
- Depending on the way the driver is installed and overrides a previous version you can end up with a "component not found" bug preventing update of components in the remote (labels, sliders). 
==> this bug is currently my public enemy number one. If it happens to you please note exactly what you did before it happens and write to me through github issues ideally or the telegram group (link in the drivers in brain repo).
- Power off doesn't exit the recipe for lights hue (you need to press home). 
- Further resource management improvement can be done to the dynamically discovered resources. 

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
- Technical protocol: JSON over TCP

## Features
### Neeo UI Support
#### Neeo Components
95% of NEEO Interface is fully supported so far:
- Create Buttons
- Create sliders 
- Create Brightness sliders
- Create switches 
- Create Images 
- Create lists (directories) with paging and complex navigation (items and tiles)
==> to be supported: buttons inside directories (don't have a use for this yet), Sonos style player (bug on the cover display).
#### Neeo Interactions
- Buttons, sliders, switches, directories triggers any action you want.
- Link buttons with sliders (volume increase will move the volume slider for example).
- Have your switches, sliders, labels display the value of your variables.
- Chained commands (one button has different behaviour each time pressed. Example: mute toggle will mute on or off when pressed)
- Variables Management for complex integrations => a button or a choice in a list, can write in a variable, this variable can be reused by other components.
- Listen to devices through Socket or HTTP pooling ==> Neeo Remotes components change following devices change (for example if you increase manually the volume of your receiver, the volume will change accordingly). Or when you play a song, the slider will show the progress of the song.
### Devices communication Support
- Control any device with HTTP-GET, POST, PUT and JSON API (REST).
- Control any device with Socket.IO/WebSocket and JSON API. 
- Control any device with HTTP-GET and XML API.
- Control any device with Json over TCP.
- Control any device with CLI.
- Control any device with MQTT.
- Wake On Lan
### Neeo Special features:
- Device Discovery (examples for Philips Hue bulbs and groups, Snapcast driver)
- Basic registration with security code. (example for Philips Hue and Yamaha Network Receiver)

#### Release Plan

![alt text](https://raw.githubusercontent.com/jac459/metadriver/master/pictures/releaseplan.jpg)

## Install

This driver is based on Node.js technology, therefore you need to install node.js first on your computer: https://nodejs.org/en/download/. At time of writing this article (Q3 - 2020) this driver support the latest version of node.js. 
Note: this driver can be directly installed on the Neeo brain provided that you root it first. Please consult the following repository to get more information: https://github.com/jac459/NeeoDriversInBrain.
Note that installing the driver in the brain is more complex overall and it is recommended to start by using a computer or a raspberry ideally.

##### Option 1
In order to install, look at the right of your screen to see the release section and click on TAG. Then choose the latest release (currently alpha 1).
Download the zip of the repository and unzip/unrar in your target computer (or brain).
Go to the created folder and type:
```npm install```
This command will install the driver and all the dependencies. You need to have an internet access in order to download the dependencies.

##### Option 2
Alternatively you can also type: 
```npm install jac459/metadriver```
This will install the latest version of the driver in a folder named node_modules/@jac459/metadriver.

#### What am I installing? 
The main dependency you are installing is obviously the ÑEEO libraries. They are automatically installed so you don't need to go to NEEO's github. 
Other than that you install a hand full of connection libraries in order to connect to the various potential devices you own and speaking all slightly different languages. 

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

The target for this driver is to create a "device files database" in order to continue to support many new devices when the Neeo cloud will close.

In terms of architecture, this driver is based on 4 main parts:
##### Meta.js: 
Constitutes the glue with NEEO API to create the graphical side (kind of MVC). 
##### Metacontroller.js: 
The main engine including a basic syntax engine interpreting the device.json file in order to create the desired behaviors. 
##### Processingmanager.js: 
The glue to the outside world. Depending of the device maker's choice, it will trigger different techniques in order to interact with the actual device to be controlled. It contains both the communication protocols and the data retrieval strategy (xpath, jsonpath, regex). It is a kind of strategy pattern. 
##### Variables Vault.js: 
This vault contains all the data manipulated by the devices created, as well as the callback to be called when a value is changed (kind of observer pattern). It also contains the persistency logic. 

## How to use

When you start the driver, the driver will scan your "activated" folder and try to load any device placed there.
 
IMPORTANT: On the first run, the driver will detect your Neeo Brain and create a 'config.js' file in order to store its IP and Port. If you have problems connecting, make sure to delete the "config.js" file and run again. If you  still can't connect and the port is taken, you can manually edit the config.js file and change the port number (any arbitrary number). 

If the driver is correctly loaded, you can go to your Neeo App and search for the name of the driver you created.

To use the driver without creating your own device files, you just need to know that and put the device files you are interested in to the "activated" folder and restart the driver. You will now be able to run them on the remote.

## User Corner

As of today, the majority of devices created are based on AV Receiver type of device as it is the most versatile. This device doesn't appear by default in the remote interface and you need to go to the recipe part in the app/GUI in order to make it visible. 
Also, you will probably need to add your own shortcuts in order to compose the interface you like the way you want. 
When running the device through the remote it will bring you to the shortcut slide. You can generally remove other slides as not useful. 

Some devices store data. For example, if you have a device needing a registration code, the meta will save the code in -datastore.json file in order to avoid the need to type it again. If somehow the installation of your device doesn't work and the device doesn't behave the way you want, you may prefere to dete the -datastore file and restart the meta in order to have a fresh install of your driver.

TODO: add how-to for the different devices created

## Maker Corner

Hey, if you plan to create your own device for the metadriver, you are very much welcome and encouraged to do so. You can go to the folling link in order to find plenty of information on it.

https://github.com/jac459/metadriver/blob/master/TUTORIALS.md

You can also use the more up-to-date explanation of the yamaha driver:
https://github.com/jac459/metadriver/blob/master/YAMAHARECEIVER-EXPLAINED.md
More full explanation for other devices will be created in the future.
