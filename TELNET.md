## Telnet 

The Telnet-solution in .meta is based on the excellent work in package node-telnet-client of mkozjak, all credits for this need to go to him.

Obviously, you can now use this method to talk to devices that are only controllable over Telnet-protocol.
# How do you use it?
The usage is mostly following the original designer's solution. It has been changed only in one area, which I'll explain later.
The normal use is basically like this:
- Connect/signon to Telnet, passing along the required paramaters to connect and signon.
- send commands and receive response (synchronous)
- timeouts are defined to prevent stalled connections

Thats it. 
The paramaters that can/need to be passed from within the/your custom driver are explained good on the original autors github: https://github.com/mkozjak/node-telnet-client

Some parameters are required, but most of them are optional and need to be used for specific devices.
Before going into all the parameters, let me first show where you need to deviate from the original description: 
	 
A) Where: 
	- loginPrompt
	- passwordPrompt
	- shellPrompt
B) Deviation: 
	- you NEED to use strings to define regular expressions here. These strings may not end with flag, but need to end with "/". 
	- During processing, an "i" (case-sensitivity OFF)	
	
The reason for this deviation is that Custom Drivers in meta use JSON-parsing and JSON-parsing doesn't allow native regexp. 
We therefore have to wrap them as strings and unwrap them before processing. That unwrapping also introduces the need to remove any flag, for convenience the /i flag was added.  

## Example of use within custom driver
Within a custom driver, you can use the following example to use the telnet-protocol yourself. They are just normal buttons that you can use. This example just logs into my router, then sends the "help" command, by putting it in the message field (you can also add the message variable directly to the signon)
   "SIGNON": {
    "label": "",
    "type": "telnet",
    "command": {"TelnetParms": {"host":"$TelnetURI","port":"$TelnetPort","shellPrompt":"/(?:\/ )?#/",
             "loginPrompt":"/login[: ]*$/", "username":"admin","echoLines":0,
             "passwordPrompt":"/Password[: ]/","password":"theone",
             "timeout":36000000,"execTimeout":36000000,"sendTimeout":36000000}},
     "queryresult": "",
     "evalwrite": [
       {
       "variable": "Response",
       "value": "$Result"
       }
     ],
     "evaldo":[{"test":true,"then":"__INITIALISE", "or":""}]
  },

Once the signon is comleted, you can issue commands through other buttons, this is the help-command:
  "help ": {
    "label": "",
    "type": "telnet",
    "command": {"TelnetParms": {"host":"$TelnetURI","port":"$TelnetPort"},
      "message": "help"                                                                                        
      },
    "queryresult": "",
    "evalwrite": [
      {
        "variable": "Response",
        "value": "$Result"
      }
    ]
}
Or use normal linux-commnds like ls -al or sudo reboot, or whatever you need:
  "ls -al ": {
    "label": "",
    "type": "telnet",
    "command": {"TelnetParms": {"host":"$TelnetURI","port":"$TelnetPort"},
      "message": "ls -al"                                                                                        
      },
    "queryresult": "",
    "evalwrite": [
      {
        "variable": "Response",
        "value": "$Result"
      }
    ]
}
## Required parameters
- Host

If the default values suit you, just use these and only add the parameters that you need; no need to specify all of them, only then one you need.

## Below is an overview of all paramaters, copied directly from the original authors githuib:

connection.connect(options) -> Promise

Creates a new TCP connection to the specified host, where 'options' is an object which can include following properties:

    host: Host the client should connect to. Defaults to '127.0.0.1'.
    port: Port the client should connect to. Defaults to '23'.
    localAddress: Local interface to bind for network connections. Defaults to an empty string. More information can be found here.
    socketConnectOptions: Allows to pass an object, which can contain every property from Node's SocketConnectOpts. Defaults to an empty object. Properties defined inside this object will overwrite any of the three above properties. More information can be found here.
    timeout: Sets the socket to timeout after the specified number of milliseconds. of inactivity on the socket.
    shellPrompt: Shell prompt that the host is using. Can be a string or an instance of RegExp. Defaults to regex '/(?:/ )?#\s/'. Use negotiationMandatory: false if you don't need this.
    loginPrompt: Username/login prompt that the host is using. Can be a string or an instance of RegExp. Defaults to regex '/login[: ]*$/i'.
    passwordPrompt: Password/login prompt that the host is using. Can be a string or an instance of RegExp. Defaults to regex '/Password: /i'.
    failedLoginMatch: String or regex to match if your host provides login failure messages. Defaults to undefined.
    initialCTRLC: Flag used to determine if an initial 0x03 (CTRL+C) should be sent when connected to server.
    initialLFCR: Flag used to determine if an initial '\r\n' (CR+LF) should be sent when connected to server.
    username: Username used to login. Defaults to 'root'.
    password: Password used to login. Defaults to 'guest'.
    sock: Duplex stream which can be used for connection hopping/reusing.
    irs: Input record separator. A separator used to distinguish between lines of the response. Defaults to '\r\n'.
    ors: Output record separator. A separator used to execute commands (break lines on input). Defaults to '\n'.
    echoLines: The number of lines used to cut off the response. Defaults to 1.
    stripShellPrompt: Whether shell prompt should be excluded from the results. Defaults to true.
    pageSeparator: The pattern used (and removed from final output) for breaking the number of lines on output. Defaults to '---- More'.
    negotiationMandatory: Disable telnet negotiations if needed. Can be used with 'send' when telnet specification is not needed. Telnet client will then basically act like a simple TCP client. Defaults to true.
    execTimeout: A timeout used to wait for a server reply when the 'exec' method is used. Defaults to 2000 (ms).
    sendTimeout: A timeout used to wait for a server reply when the 'send' method is used. Defaults to 2000 (ms).
    maxBufferLength: Maximum buffer length in bytes which can be filled with response data. Defaults to 1M.
    debug: Enable/disable debug logs on console. Defaults to false.
 