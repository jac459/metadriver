class MyLogger {

    constructor(loglevel) {
        this.loglevel = loglevel;
        var self = this;
    
        this.log = function(level, message) {
            if (level == 1) {
                console.log('ERROR IN METADRIVER : ' + message);
            }
            if ((level == 2) && (level <= self.loglevel)) {
                console.log('WARNING IN METADRIVER : ' + message);
            }
            if ((level == 3) && (level <= self.loglevel)) {
                console.log('INFO IN METADRIVER : ' + message);
            }
        }
    }
}
exports.MyLogger = MyLogger;