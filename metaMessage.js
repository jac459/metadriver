const path = require('path');
const settings = require(path.join(__dirname,'settings'));

const LOG_TYPE = {'ALWAYS':'', 'INFO':'', 'VERBOSE':'', 'WARNING':'', 'ERROR':'', 'FATAL':'', 'HUH':''}
const LOG_LEVEL = {'QUIET':[LOG_TYPE.ALWAYS], 
                    'WARNING':[LOG_TYPE.ALWAYS, LOG_TYPE.HUH, LOG_TYPE.FATAL, LOG_TYPE.ERROR, LOG_TYPE.WARNING],
                    'INFO': [LOG_TYPE.ALWAYS, LOG_TYPE.HUH, LOG_TYPE.FATAL, LOG_TYPE.ERROR, LOG_TYPE.WARNING, LOG_TYPE.INFO],
                    'VERBOSE': [LOG_TYPE.ALWAYS, LOG_TYPE.HUH, LOG_TYPE.FATAL, LOG_TYPE.ERROR, LOG_TYPE.WARNING, LOG_TYPE.INFO, LOG_TYPE.VERBOSE]}
//QUIET shows ALWAYS
//WARNING shows QUIET + HUH?, FATAL, ERROR, WARNING
//INFO shows WARNING + INFO
//VERBOSE shows INFO + VERBOSE

//Initialise Severity Level;
var mySeverity = LOG_LEVEL.QUIET;
if (settings.LogSeverity) { mySeverity = settings.LogSeverity; } // Did the user override this setting during runtime?
if (process.env.LogSeverity) { mySeverity = process.env.LogSeverity; } // get the log-severitylevel frrom settings.json  

function metaMessage(message) {
    if (mySeverity.includes(message.type)) {// Do we need to log this?
        if (Array.isArray(message.content)) { 
            message.content.forEach(subContent => {
                let newMessage = message;
                newMessage.content = subContent;
                metaMessage(newMessage);
            }); 
        };
        console.log((new Date()).toLocaleString() + " - " + message.component + (message.deviceid ? " " + message.deviceid : "") + ": " + message.type + " - " + message.content);
        if (typeof message.content == 'object') { console.log(message.content) };
        
    }
}
exports.metaMessage = metaMessage;
exports.LOG_TYPE = LOG_TYPE;
