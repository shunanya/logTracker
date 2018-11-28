'use strict';

global.log_config;
global.namespace_name;

const http = require('http');
const log4js = require('log4js');
const util = require('util');
const hash = require('node_hash');
const _ = require('lodash');
const getNamespace = require('cls-hooked').getNamespace;
const createNamespace = require('cls-hooked').createNamespace;
if (!global.log_config) {
    global.log_config = './properties/log4js.json'; // default log configuration file
}
if (!global.namespace_name){
    global.namespace_name = 'defaultNamespace';
}
const namespace = createNamespace(global.namespace_name);
const loggersMap = {};

(function() {
    const path = require('path')
        , fs = require('fs');

    /**
     * Searching of specified file/dir beginning from 'start_dir' up to 'end_dir'.
     *
     * At the end of search the full path will returned on success.
     * The default path (def-file_path) can be specified. it will return on search failed.
     */
    function search_file(file_path, def_file_path) {
        const end_dir = '/';			//root folder as the end dir of searching
        const start_dir = __dirname;	//current folder as the start dir of searching
        let isDir = false;
        if (file_path.charAt(file_path.length - 1) === '/') {
            isDir = true
        }
        let file = undefined;
        let _file;
        let cur_path = start_dir; // current folder
        while (cur_path !== end_dir) {
            _file = path.normalize(path.resolve(cur_path, '..', file_path));
            if (fs.existsSync(_file) && fs.statSync(_file).isDirectory() === isDir) {
                file = _file;
			    // console.log("FOUND: "+file);
                break;
            } else {
			    // console.log("NOT found "+_file);
                cur_path = path.join(cur_path, '..');
            }
        }
        return file || def_file_path;
    }

    /**
     * Returns parent dirname if parameter represents a path to file.
     * Otherwise returns the same path.
     */
    function _dirname(value) {
        if (typeof(value) === 'string') {//parameter is string
            if (value.charAt(value.length - 1) !== '/') {//path to file
                return value.replace(path.basename(value), '');
            }
            return value;
        }
    }

    /**
     * rewrite log4js configuration by replacing relative paths to absolute (if necessary)
     *
     * @param log {String|Object}
     *            can be defined as absolute or relative path to the log config file
     *            or as log configuration object
     * @return {Object} corrected logger configuration
     */
    function correcting(log) {
        const json = JSON.parse(log, function (key, value) {
            if (key === 'filename' && !path.isAbsolute(value)) {
                const dirname = _dirname(value);
                const basename = value.replace(dirname, '');
                let file = search_file(dirname);
                file = path.join(file, basename);
                if (file !== value) {
                    value = file;
                }
            }
            return value;
        });
        return json;
    }

    // source parameters
    console.log('log_config =', global.log_config, 'namespace =', global.namespace_name);
    let log;
    if (typeof(global.log_config) === 'string') {//log config file path is defined
        const conf_file = search_file(global.log_config);
    if (conf_file) {
            console.log("Logger: opening log-conf file: " + conf_file);
            log = fs.readFileSync(conf_file, 'utf8');
        } else {
            console.error('Logger: could not find: '+conf_file);
        }
    } else if (global.log_config instanceof Object){//log config (object) is defined
        console.log('Logger: use defined config\n'+global.log_config);
        log = JSON.stringify(global.log_config);
    }
    if (log) {
        log4js.configure(correcting(log), {});
    } else {
        console.warn("Logger: wrong parameter", log);
    }

    /**
     * Creates a new logger with specified name
     * @param logger_name the name of logger<br>
     *     NOTE: the loger name have to be defined in the log config file
     * @returns {Logger} the object that can be used for logging
     */
    const getLogger = function (logger_name) {
        if (loggersMap[logger_name]){
            return loggersMap[logger_name];
        } else {
        const log = new Logger(logger_name);
        log.info(`>>>>>>>>> Logger '${logger_name}' created...`);
            loggersMap[logger_name] = log;
        return log;
        }
    };
    exports.getLogger = getLogger;

    /**
     * Initializing of request tracking log
     *
     * @param opt {Number|String|Object} parameter that unique marks the request<br>
     *     NOTE: if opt represents Number or String, it will be used as unique 'reqId' value.
     *     NOTE: if opt parameter represents http.IncommingMessage class (Request object), the unique reqId will be calculated as a MD5 hash of this object.<br>
     *     NOTE: if opt represents the custom Object, it should contains a unique value under 'reqId' key.
     *           Moreover, the custom Object can contains the Request object under 'req' key. In this case the 'reqId' will be calculated as a MD5 hash.
     *           The custom object can contains in addition any custom keys.They will be kept in log.<br>
     *     NOTE: the random number will be used as a 'reqId' in case of missed opt parameter.
     * @param callback {Function} standard callback(err, data)
     */
    const startTracking = function(opt, callback){
        if (opt instanceof Function){
           callback = opt;
           opt = undefined;
        }
        let rid = {};
        if (!opt) {
            rid['reqId'] = Math.ceil(Math.random() * 10000);
        } else if (typeof(opt) === "number" || typeof(opt) === "string"){
            rid['reqId'] = opt;
        } else if (opt instanceof Object) {
            if (opt instanceof http.IncomingMessage) {
                console.log('----- Request received');
                rid['reqId'] = hash.md5(util.inspect(opt));
                namespace.bindEmitter(opt);
                console.log('----- hash = ', rid['reqId']);
            } else if (opt['reqId'] || (opt['req'] && opt['req'] instanceof http.IncomingMessage)) {
                rid = _.clone(opt);
                if (opt['req']) {
                    rid['reqId'] = hash.md5(util.inspect(opt['req']));
                    namespace.bindEmitter(opt['req']);
                }
                delete rid['req'];
            } else {
                return callback('invalid parameters');
            }
        }
        namespace.run(() => {
            namespace.set('reqId', rid);
            callback(null, 'Ok');
        })
    };
    exports.startTracking = startTracking;

})();

class Logger {
    
    /**
     * Creates the new logger
     * @param logger_name the name for logger
     */
    constructor(logger_name) {
        this.log = log4js.getLogger(logger_name);
        this.log.info(">>>>>>>>> Logger for '" + this.log.category + "' initialized with success.", "Log Level: " + this.log.level, " <<<<<<<<<");
        console.log('Logger created ', logger_name);
    }

    /**
     * Returns the tracking info
     * @returns {Object} the tracking info (if exist)
     */
    getTracking(){
        const namespace = getNamespace(global.namespace_name);
        return namespace && namespace.get('reqId') || null;
    }

    fatal(...message) {
        const tr = this.getTracking();
        if (tr) message.splice(0, 0, JSON.stringify(tr));
        this.log.fatal(...message);
    }
    error(...message) {
        const tr = this.getTracking();
        if (tr) message.splice(0, 0, JSON.stringify(tr));
        this.log.error(...message);
    }
    warn(...message) {
        const tr = this.getTracking();
        if (tr) message.splice(0, 0, JSON.stringify(tr));
        this.log.warn(...message);
    }
    info(...message) {
        const tr = this.getTracking();
        if (tr) message.splice(0, 0, JSON.stringify(tr));
        this.log.info(...message);
    }
    debug(...message) {
        const tr = this.getTracking();
        if (tr) message.splice(0, 0, JSON.stringify(tr));
        this.log.debug(...message);
    }
    trace(...message) {
        const tr = this.getTracking();
        if (tr) message.splice(0, 0, JSON.stringify(tr));
        this.log.trace(...message);
    }
    isInfoEnabled() {
        return this.log.isInfoEnabled();
    }
    isDebugEnabled() {
        return this.log.isDebugEnabled();
    }
    isTraceEnabled() {
        return this.log.isTraceEnabled();
    }
    isFatalEnabled() {
        return this.log.isFatalEnabled();
    }
    isErrorEnabled() {
        return this.log.isErrorEnabled();
    }
    isWarnEnabled() {
        return this.log.isWarnEnabled();
    }
}