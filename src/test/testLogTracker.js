'use strict';

/*
 The module start up the test HTTP server that is intended for testing log-tracking workability.
 */

global.log_config_path = './IoT_/properties/log4js.json'; //replace by existing config path
global.namespace_name = 'appNamespace'; // replace by desired name

const http = require('http');
const logger = require('../logTracker');
const nlogger = logger.getLogger('node_server');
const qlogger = logger.getLogger('node_queue');
const host = '127.0.0.1';
const port = 8080;
const users = ['simon', 'john'];

http.createServer((req, res) => {
    if (nlogger.isInfoEnabled()) {
        nlogger.info('>>>>>>>>>>>>');
    }
    logger.startTracking({req:req, user:users[Math.round(Math.random()+0.1)]}, (err, data) => {
    // logger.startTracking(Math.ceil(Math.random() * 1000), (err, data) => {
            qlogger.warn('start tracking err:'+ err+'; data:'+ data);
            setTimeout(() => {
                res.end('err:'+err+' data:'+data);
                nlogger.info('>>>> request finished');
            }, 1000);
            nlogger.info('!!! request finishing !!!');
        });
}).listen(port, host);

nlogger.info('HTTP Server listen on', port);
