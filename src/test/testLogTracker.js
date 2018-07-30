'use strict';

const http = require('http');
// const _ = require('lodash');
const logger = require('../logTracker');

const nlogger = logger.getLogger('node_server');
const qlogger = logger.getLogger('node_queue');
const host = '127.0.0.1';
const port = 8080;
const users = ['simon', 'john'];

http.createServer((req, res) => {
    nlogger.info('>>>>>>>>>>>>');
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