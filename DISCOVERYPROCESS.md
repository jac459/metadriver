# This document describe how the discovery process works with Meta.

## Definition

The discovery process is the process used by the meta in order to automatically find the devices on the user's home.
This process is tightly coupled with the Neeo API 

## Discovery technologies

The meta uses 2 differents technology in order to have a chance to discover the devices. The principal one is:

### mDNS (multicast DNS)

This technology is the one used by Bonjour in apple world or Avahi in Linux. Meta uses the dnssd2 library.
At launch, the meta launchs a discovery process and will create a structure with all the devices found.
This structure is accessible as a variable under the name:
#### $LocalDevices
The structure looks like this:
```
[
 {
    name: 'NEEO Living Room',
    fullname: 'NEEO Living Room._neeo._tcp.local.',
    type: { name: 'neeo', protocol: 'tcp' },
    domain: 'local',
    host: 'NEEO-5072dc26.local.',
    port: 3000,
    addresses: [ '192.168.1.77' ]
  },
  {
    name: 'googlerpc-1',
    fullname: 'googlerpc-1._googlerpc._tcp.local.',
    type: { name: 'googlerpc', protocol: 'tcp' },
    domain: 'local',
    host: '5cd5dbe1-c9b8-626f-58e9-b5fcd5567728.local.',
    port: 8012,
    addresses: [ '192.168.1.10' ]
  },
  {
    name: 'Hometheater',
    fullname: 'Hometheater._http._tcp.local.',
    type: { name: 'http', protocol: 'tcp' },
    domain: 'local',
    host: 'Hometheater.local.',
    port: 80,
    addresses: [ '192.168.1.24' ]
  },
  {
    name: 'PI3b',
    fullname: 'PI3b._http._tcp.local.',
    type: { name: 'http', protocol: 'tcp' },
    domain: 'local',
    host: 'pi3b.local.',
    port: 80,
    addresses: [ '192.168.1.38' ]
  }
]
```
It is a json structure that you can use to navigate through jsonpath using the queryresult feature of meta.
For example, in order to list all the chromecast of your network, you could have:
```
"command": {
      "type": "static",
      "command": "$LocalDevices",
      "queryresult": [
        "$.*[?(@.name=='googlecast')]^"
      ]
    }
```
This will search on the second level (in this case, inside type) all the devices of type googlecast.

The second technology used is: 

### arp -a

This method scan your network by mac address.
Likewise a structure is made accessible through the meta looking like this:
```
[
  { name: '?', ip: '192.168.1.13', mac: 'dc:a6:32:4e:be:2e' },
  { name: '?', ip: '192.168.1.62', mac: '14:4f:8a:a6:d4:ca' },
  { name: '?', ip: '192.168.1.65', mac: 'dc:a6:32:68:9c:a9' }
]
```
This structure is available using the variable name:
#### $LocalByMacDevices

## Triggering the discovery in the meta

The discovery is triggered by the neeo brain. It is used when you are searching a device in the remote.
It is also used when the neeo brain find it useful.
The behavior is exactly described in this page:
https://neeoinc.github.io/neeo-sdk/#src-lib-models-devicebuilder.ts-enablediscovery

The meta uses enableDynamicDeviceBuilder as true.
And then provide a discoverFunction to Neeo.
Neeo will call this function when useful for the brain.

### Focus on meta discoverFunction

The meta tries to create only the needed device. Say if you have 28 Hue bulbs, the meta will try to create only the driver for the bulb you want to create.
For this reason, the discoverFunction has one parameter: targetDeviceId.
Generally, the neeo brain will not give any parameter at the beginning, when you are scanning all the devices. 
If the meta doesn't receive any parameter, it will create all the drivers.
When the neeo brain knows which device it needs. it will give the meta the targetDeviceId and the meta will create only this device.
This is to optimize resources and gain performance.

#### How the meta generates drivers

The very essence of the meta is to use JSON description (that you write as a driver creator) and uses this JSON description in order to makes the neeo brain generate a driver.
That what is called a meta device like volumio, kodi, hue, ...
In the case of a discovery, the meta will GENERATE its own meta device JSON description in order to GENERATE the device in the neeo brain.
It is a kind of 2 steps dynamism if you wish. The meta is dynamically generating something you have dynamically asked him to create.
That's the reason why you have templates in the JSON format of the meta. This templates are used by the meta to create the actual driver.



