'use strict';

/*
 The module start up the test HTTPS server that is intended for testing log-tracking workability.
 */

global.log_config_path = './IoT_/properties/log4js.json'; //replace by existing config path
global.namespace_name = 'appNamespace'; // replace by desired name

const fs = require('fs');
const https = require('https');
const path = require('path');
const ssh_path = path.normalize(path.join(__dirname, '.ssh'));
const logger = require('../logTracker');
const nlogger = logger.getLogger('node_server');
const qlogger = logger.getLogger('node_queue');
const host = '127.0.0.1';
const port = 8443;
const users = ['simon', 'john'];

nlogger.info('Certificates path: '+ssh_path);

if (!fs.existsSync(ssh_path)){
    nlogger.fatal('ssh certificates path is not exist or specified incorrectly');
    process.exit(1);
}

const options = {
    key: '',
    cert: '',
    ca: ''
};

const files = fs.readdirSync(ssh_path);
const file_key = files.find((file) => {return file.endsWith('.key') && !file.endsWith('ca.key');})
if (!file_key) {
    nlogger.fatal('ssh key certificate is not exist');
    process.exit(1);
}
options.key = fs.readFileSync(path.join(ssh_path, file_key), 'utf8');

const file_crt = files.find((file) => {return file.endsWith('.crt') && !file.endsWith('ca.crt');})
if (!file_crt) {
    nlogger.fatal('ssh crt certificate is not exist');
    process.exit(1);
}
options.cert = fs.readFileSync(path.join(ssh_path, file_crt), 'utf8');

const file_ca_crt = files.find((file) => {return file.endsWith('ca.crt');})
if (!file_ca_crt){
    nlogger.warn('ssh ca.crt certificate is not exist');
} else {
    options.ca = fs.readFileSync(path.join(ssh_path, file_ca_crt), 'utf8');
}

const file_ca_crl = files.find((file) => {return file.endsWith('ca.crl');})
if (!file_ca_crl){
    nlogger.warn('ssh ca.crl certificate is not exist');
} else {
    options.crl = fs.readFileSync(path.join(ssh_path, file_ca_crl), 'utf8');
}

if (file_ca_crt && file_ca_crl){
    options.requestCert = true;
    options.rejectUnauthorized = true;
}

https.createServer(options, function (req, res) {
    console.log(new Date(),  req.connection.remoteAddress, req.method, req.url);
    nlogger.info('>>>>>>>>>>>>');
    logger.startTracking({req:req, user:users[Math.round(Math.random()+0.1)]}, (err, data) => {
        // nlogger.startTracking(Math.ceil(Math.random() * 1000), (err, data) => {
        qlogger.warn('start tracking err:'+ err+'; data:'+ data);
        setTimeout(() => {
            res.end('err:'+err+' data:'+data);
            nlogger.info('>>>> request finished');
        }, 1000);
        nlogger.info('!!! request finishing !!!');
    });
}).listen(port);

nlogger.info('HTTPS Server listen on '+port);
