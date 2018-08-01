'use strict';

global.log_config_path;
global.namespace_name;

const http = require('http');
const log4js = require('log4js');
const util = require('util');
const hash = require('node_hash');
const _ = require('lodash');
const current_namespace_name = namespace_name?namespace_name:'defaultNamespace';
const getNamespace = require('cls-hooked').getNamespace;
const createNamespace = require('cls-hooked').createNamespace;
const namespace = createNamespace(current_namespace_name);

(function() {
    const path = require('path')
        , fs = require('fs')
        , utils = require('./utils');

    /**
     * rewrite log4js configuration file by replacing relative paths to absolute
     *
     * @param log_file
     *            absolute or relative path to the log file
     */
    function correcting(log_file) {
        console.log("Logger: opening log-conf file: " + log_file);
        const log = fs.readFileSync(log_file, 'utf8');
        let d = false;
        const json = JSON.parse(log, function (key, value) {
            if (key === 'filename') {
                const dirname = utils.dirname(value);
                const basename = value.replace(dirname, '');
                let file = utils.search_file(dirname);
                file = path.join(file, basename);
                if (file !== value) {
                    value = file;
                    d = true;
                }
            }
            return value;
        });
        if (d) {
            const logFileCorrect = log_file + ".new";
            console.log("Logger: write corrections to " + logFileCorrect);
            fs.writeFileSync(logFileCorrect, JSON.stringify(json, null, 2));
            return logFileCorrect;
        } else {
            console.log("Logger: Config-file - There is nothing to correct!!!");
        }
        return log_file;
    }

    // source parameters
    console.log('log_config_path', log_config_path, 'namespace', current_namespace_name);
    const log_conf = log_config_path?log_config_path:'./properties/log4js.json';// relative path to the properties file (JSON)
    const conf_file = utils.search_file(log_conf);
    if (conf_file) {
        // correcting(conf_file);
        // log4js.configure(conf_file, {});
        log4js.configure(correcting(conf_file), {});
    } else {
        console.warn(log_conf, "couldn't find");
    }

    /**
     * Creates a new logger with specified name
     * @param logger_name the name of logger<br>
     *     NOTE: the loger name have to be defined in the log config file
     * @returns {Logger} the object that can be used for logging
     */
    const getLogger = function (logger_name) {
        const log = new Logger(logger_name);
        log.info(`>>>>>>>>> Logger '${logger_name}' created...`);
        return log;
    };
    exports.getLogger = getLogger;

    // levels = {
    // ALL: new Level(Number.MIN_VALUE, "ALL", "grey"),
    // TRACE: new Level(5000, "TRACE", "blue"),
    // DEBUG: new Level(10000, "DEBUG", "cyan"),
    // INFO: new Level(20000, "INFO", "green"),
    // WARN: new Level(30000, "WARN", "yellow"),
    // ERROR: new Level(40000, "ERROR", "red"),
    // FATAL: new Level(50000, "FATAL", "magenta"),
    //   OFF: new Level(Number.MAX_VALUE, "OFF", "grey")
    //}

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
        let rid = {};
        if (opt instanceof Function){
           callback = opt;
           opt = undefined;
        }
        if (!opt) {
            rid['reqId'] = Math.ceil(Math.random() * 10000);
        } else if (typeof(opt) === "number" || typeof(opt) === "string"){
            rid['reqId'] = opt;
        } else if (opt instanceof Object) {
            if (opt instanceof http.IncomingMessage) {
                console.log('----- Request received');
                rid['reqId'] = hash.md5(util.inspect(opt));
                console.log('----- hash = ', rid['reqId']);
            } else if (opt['reqId'] || (opt['req'] && opt['req'] instanceof http.IncomingMessage)) {
                rid = _.clone(opt);
                if (opt['req']) {
                    rid['reqId'] = hash.md5(util.inspect(opt['req']));
                }
                delete rid['req'];
            } else {
                return callback('invalid parameters');
            }
        }
        namespace.run(() => {
            namespace.set('reqId', rid/*Math.ceil(Math.random()*1000)*/);
            callback(null, 'Ok');
        })
    };
    exports.startTracking = startTracking;

})();

class Logger {
    
    constructor(logger_name) {
        this.log = log4js.getLogger(logger_name);
        this.log.info(">>>>>>>>> Logger for '" + this.log.category + "' initialized with success. Log Level: " + this.log.level + " <<<<<<<<<");
        console.log('Logger created ', logger_name);
    }

    formatMessage(message){
        const namespace = getNamespace(current_namespace_name);
        const pre = namespace && namespace.get('reqId')? JSON.stringify(namespace.get('reqId')):'';
        message = pre+': '+message;
        return message;
    }

    log(level, message) {
        this.log.log(level, this.formatMessage(message));
    }
    error(message) {
        this.log.error(this.formatMessage(message));
    }
    warn(message) {
        this.log.warn(this.formatMessage(message));
    }
    fatal(message) {
        this.log.fatal(this.formatMessage(message));
    }
    info(message) {
        this.log.info(this.formatMessage(message));
    }
    debug(message) {
        this.log.debug(this.formatMessage(message));
    }
    trace(message) {
        this.log.trace(this.formatMessage(message));
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