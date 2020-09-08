# Yamaha Network Receiver Code explained

In this tutorial we will explain how the yamaha reciever driver was done and have a close look at the code written.

This explanations will give you more info on the register function as well as discovery function. Along with the lists, this is the most complex things in neeo and when using the meta. But then, it is useful. In the case of the yamaha receiver, it allows the user to enter its own IP address and then the meta setting up the driver in order to command the device.

```
{ "name":"Smart Receiver",
  "manufacturer":"Yamaha",
  "type":"AVRECEIVER",
  "version":6,
```
It start very simply with a name given to the device as well as the receiver. These names only helps to find the device. Then the type is AVRECEIVER which is very good first because we are creating a receiver, second because this device type allows multiple things.
But if you don't provide buttons starting with INPUT to this device, you will have a warning message when running the meta (that you can fully ignore).

After this brief appetizer, we go directly to a complex stuff, the Register function.
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
  When adding that to your device, the neeo app will display a dialog box when you will add the device to the setup for the first time.
  This dialog box will have as header text, the value containd in ```registerheadertext``` and the description containd in... ```registerdescription```.
  Then, this registration accept 2 types. Security code or name/password, you thus have to add this line to choose security code: ```"registertype": "SECURITY_CODE",```.
  So basically, what happens is that when the dialog box will appear, the neeo app will ask you a ... secrurity code. 
  Normally it is used to pair a device, but in our example, it is used to enter the IP address of our receiver. It is actually possible to detect this address automatically and will be done at a letter stage. But IP address is a very good and easy example of security code to use.
  In the ```registrationcommand``` you can a typical command as per "meta" standard except that we use 2 special variables.
  So as you see, we are performing a command of type ```http-get``` and then querying an address. This address contains a variable $RegistrationCode. Guess what? This value contains the input of your user.
  In the case of the yamaha, if the request is correct, the answer will be in JSON ('meta' loves JSON), and we will refine the result to find the response_code (using ```queryresult```).
  Then we write in a few variables using ```evalwrite```. The first one is ```YamahaIP```. It is declared as a ```persistedvariables``` as you can see below which is a good news. The meta will save it in a datastore and your user won't have to type it again if the registration is successful.
  Then we write in 
  #### ```IsRegistered```
  This variable is important because first it is persisted, second, this is the variable that will be used by the meta to know if it can pass the registration process.
  As long as you don't have in the persisted variable ```IsRegistered``` with value ```true```, your registration will loop. 
  In our case, we make sure that the IP given is correct before assigning true.
  Remember that we got from the Yamaha receiver answer the response_code. If the yamaha is there, we should have as response_code of 0. That what we test and if yes, we put true.
  ```"DYNAMIK ($Result == 0) ? true : false"```. 
  As you may now ```DYNAMIK``` means that the value following will be evaluated as javascript code, then we have a test: we take the result of the command filtered by the queryresult, it should return ). If it is equalt to 0 (we test that using ==) then we apply true else we apply false.
  
  
 Now the bad news: if you have a registration command, you HAVE to have a discovery command, no choice. And on top of that, the discovery is even more complex than the registration so hang-on.
 
 ## Discover Function

 
  
