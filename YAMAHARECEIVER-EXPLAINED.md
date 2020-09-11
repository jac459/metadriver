# Yamaha Network Receiver Code explained

In this tutorial we will explain how the Yamaha receiver driver was created and have a close look at the code written.

This explanations will give you more info on the register function as well as discovery function. Along with the lists, these are the most complex things in NEEO when using the meta. But then, it is useful. In the case of the Yamaha receiver, it allows the user to enter its own IP address, then the meta-drive will setup the driver in order to control the device.

```
{ "name":"Smart Receiver",
  "manufacturer":"Yamaha",
  "type":"AVRECEIVER",
  "version":6,
```
It starts very simply with a name given to the device as well as the receiver. These names only help to find the device. Then the type is AVRECEIVER which is very good; first because we are creating a receiver, second because this device type allows multiple things.
Note if you don't provide buttons starting with INPUT to this device, you will have a warning message when running the meta (that you can just ignore).

After this brief appetizer, we go directly to the complex stuff, the Register function.
## Register Function
```
  "register":{
    "registertype": "SECURITY_CODE",
    "registerheadertext": "Yamaha Network Received",
    "registerdescription": "Please enter the IP address of your device.",
    "registrationcommand":{"type":"http-get", "command":"http://$RegistrationCode/YamahaExtendedControl/v1/system/getDeviceInfo", "queryresult":"$.response_code", "evalwrite":[{"variable":"YamahaIp","value":"$RegistrationCode"}, {"variable":"IsRegistered","value":"DYNAMIK ($Result == 0) ? true : false"}]}
  },
  "persistedvariables":{
    "YamahaIp":"",
    "IsRegistered":""
  },
 ```
  When adding that to your device, the NEEO app will display a dialog box when you will add the device to the setup for the first time.
  This dialog box will have as header text, the value contained in ```registerheadertext``` and the description contained in... ```registerdescription```.
  Then, this registration accepts 2 types: Security code or name/password; you thus have to add this line to choose security code: ```"registertype": "SECURITY_CODE",```.
  So basically, what happens is that when the dialog box will appear, the NEEO app will ask you a ... secrurity code. 
  Normally it is used to pair a device, but in our example, it is used to enter the IP address of our receiver. It is actually possible to detect this address automatically and will be done at a letter stage. But IP address is a very good and easy example of security code to use.
  In the ```registrationcommand``` you can a typical command as per "meta" standard except that we use 2 special variables.
  So as you see, we are performing a command of type ```http-get``` and then querying an address. This address contains a variable $RegistrationCode. Guess what? This value contains the input of your user.
  In the case of the Yamaha, if the request is correct, the answer will be in JSON ('meta' loves JSON), and we will refine the result to find the response_code (using ```queryresult```).
  Then we write in a few variables using ```evalwrite```. The first one is ```YamahaIP```. It is declared as a ```persistedvariables``` as you can see below which is a good news. The meta will save it in a datastore and your user won't have to type it again if the registration is successful.
  Then we write in 
  #### ```IsRegistered```
  This variable is important because first it is persisted, second, this is the variable that will be used by the meta to know if it can pass the registration process.
  As long as you don't have in the persisted variable ```IsRegistered``` with value ```true```, your registration will loop. 
  In our case, we make sure that the IP given is correct before assigning true.
  Remember that we got from the Yamaha receiver answer the response_code. If the Yamaha is there, we should have as response_code of 0. That what we test and if yes, we put true.
  ```"DYNAMIK ($Result == 0) ? true : false"```. 
  As you may now ```DYNAMIK``` means that the value following will be evaluated as javascript code, then we have a test: we take the result of the command filtered by the queryresult, it should return ). If it is equalt to 0 (we test that using ==) then we apply true else we apply false.
  
  
 Now the bad news: if you have a registration command, you HAVE to have a discovery command, no choice. And on top of that, the discovery is even more complex than the registration so hang-on.
 
 ## Discover Function

The discover function is super useful when you have devices with a HUB like the philips hue. The NEEO will detect all the bulbs and groups in order to create as many light drivers you need.
But in the case of the Yamaha Reciever, we will go to something simpler, we will just dynamically detect the model of the receiver to display it.

```  
"discover":{
    "welcomeheadertext":"Yamaha Network Receiver",
    "welcomedescription":"powered by meta\nby JAC459",
    "command":{"type":"http-get", "command":"http://$RegistrationCode/YamahaExtendedControl/v1/system/getDeviceInfo", "queryresult":"$."}
  },
"template" : {
    "name":"Smart Receiver", 
    "dynamicname":"DYNAMIK_INST_START DYNAMIK \"Yamaha Network Receiver \" + JSON.parse(\"$Result\").model_name DYNAMIK_INST_END",
    "dynamicid":"DYNAMIK_INST_START DYNAMIK JSON.parse(\"$Result\").device_id DYNAMIK_INST_END",
     "manufacturer":"Yamaha",
...
```
 So when you have the discover section (you can have the discover seciton without the register but can't have the register without the discover), a new dialog box will be created when setting up the driver in the NEEO app.
 The headertext will be the text displayed in ```welcomeheadertext``` and the description in ```welcomedescription```.
 Then we have the command generating the discovery.
 This command will drive what items will be discovered by the discovery dialog box.
 In our case, we just reuse the $RegistrationCode variable (as we passed the registration, we know it is the correct IP address) and then we ask to the Yamaha what is his specific name. As Yamaha devices are very well educated, it will give us multiple info about itself that we use later.
#### ```template```
Template is very important to understand.
Template is the actual driver that will be created. It may be instantiated multiple times during the discovery if more devices are discovered. This won't be the case for the Yamaha, but you need to have that in mind.
##### /!\ Containing device should not have other features than discovery and register. The actual buttons and all will be in the template.
Even more important:
### /!\ /!\ /!\ The name of the containing device and the name of the template, in this case ```Smart Receiver``` HAVE TO BE THE SAME. If they aren't, your driver will not respond and will not create any log. There is nothing I can do about it. 

OK, now that we know that, we can concentrate on the 2 lines that are different from a non-discover device:
```
    "dynamicname":"DYNAMIK_INST_START DYNAMIK \"Yamaha Network Receiver \" + JSON.parse(\"$Result\").model_name DYNAMIK_INST_END",
    "dynamicid":"DYNAMIK_INST_START DYNAMIK JSON.parse(\"$Result\").device_id DYNAMIK_INST_END",
```

These 2 lines are mandatory for discovered devices. This is the dynamically generated name (that will be used by your user) and even more important, this is the dynamically created ID that will be used by the meta and the NEEO brain.
```DYNAMIK_INST_START``` and ```DYNAMIK_INST_END``` may look confusing but they are in fact 2 markers used to express that what is inside should be changed during the CREATION of the dynamic device.
In our case, after the first marker, we use the keywork DYNAMIK to interpret the result and we read the result of the command we sent to the Yamaha. In this case it is a JSON envelop, so we need to parse it the way it is shown: ```JSON.parse(\"$Result\")```and we extract its property .model_name.
Like wise, for the id, we take the ```device_id``` returned by the http request to the Yamaha.

### More explanation on the query result and JSON.parse.
So if we summarise, the command in discover sends an http request returning a result; we put the result in the variable $Result (this is the default behavior of the meta, nothing specific to do for it).
As you can see, in the register command, we used the jsonpath expression in "queryresult": ```$.response_code```. The "$." gives us the full answer of the Yamaha, and response_code gets only the value response_code.
In the case of the discovery we do things differently because we need to get 2 values from the result. So we don't filter it, we just get the whole answer and filter it later.
The way to filter it later, as you may have understood is by doing ```JSON.parse```.

So now that we have the dynamicname and dynamicid set, we have a very normal driver except one strange line:
```"yamahaIp":"$yamahaIp",```
This variable is a non persistant varaible taking the value of a persistant variable. That's confusing!
In fact, what happens is that at the creation of the device (or remember that it can be many devices, like bulbs for HUE), all the devices will have their value initiated with the value of the parent driver (outside the template part).





  
