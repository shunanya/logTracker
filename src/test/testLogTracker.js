'use strict';

/*
 This module starts up the test HTTP server that is intended for testing log-tracking workability.
 */

global.log_config = require('./log4js_conf').log_conf;
// global.log_config = './properties/log4js.json'; //alternatively the relative ior absolute path to the log4js configuration can be defined there as well (e.g. './IoT_/properties/log4js.json')
global.namespace_name = 'appNamespace'; // replace by desired name

const http = require('http');
const logTr = require('../logTracker');
const nlogger = logTr.getLogger('node_server');
const qlogger = logTr.getLogger('node_queue');
const host = '127.0.0.1';
const port = 8080;
const users = ['simon', 'john'];

http.createServer((req, res) => {
    if (nlogger.isInfoEnabled()) {
        nlogger.info('>>>>>>>>>>>>', 'processing request');
    }
    logTr.startTracking({req:req, user:users[Math.round(Math.random()+0.1)]}, (err, data) => {
    // logger.startTracking(Math.ceil(Math.random() * 1000), (err, data) => {
            qlogger.warn('start tracking err:'+ err,' data:'+ data);
            setTimeout(() => {
                res.end('err:'+err, ' data:'+data);
                nlogger.info('>>>> request finished '+ JSON.stringify(nlogger.getTracking()));
            }, 1000);
            nlogger.info('!!! request finishing !!!');
        });
}).listen(port, host);

nlogger.info('HTTP Server listen on port ', port);
