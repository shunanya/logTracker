#!/usr/bin/env node

'use strict';

/*
The module is sending several HTTPS requests in parallel.
 */

const https = require('https');
const url = require('url');
const _ = require('lodash');


let req_count = 5;

let int = setInterval(() => {
    const url_for_test = 'https://127.0.0.1:8443';
    const method = 'GET';
    request({'url':url_for_test, 'method':method}, (err, data) => {
        console.log(err, data);
    })
    if (--req_count <= 0){
        clearInterval(int);
    }
}, 1);


/**
 *
 * @param options [Object]
 *  url - (mandatory) full url to be requested
 *  method - (optional) HTTP request method = Defaults to 'GET'
 *  headers - (optional) request headers
 *  timeout - (optional) the socket timeout in milliseconds
 *  body - (optional) the sending body (POST, PUT,...)
 * @param callback [function] (error, respond)
 */
function request(option, callback) {
    if (typeof(option) === 'object' && option['url'] && callback) {
        const opt = _.clone(option);
        const urlObject = url.parse(opt['url']);
        opt['host'] = urlObject.hostname;
        opt['path'] = urlObject.path;
        opt['port'] = urlObject.port;
        opt['rejectUnauthorized'] = false;
        const req = https.request(opt, (res) => {
            res.setEncoding('utf8');
            let buffer = '';
            res.on('data', (chunk) => {
                buffer += chunk;// Accumulate content body
            }).on('end', () => {// {"access_token":"2382262-1dSm99CFNH60UV41cBFq","token_type":"bearer","expires_in":86400,"refresh_token":"2332103-62Oo7ZhmrZPodm5H9a8P"}
                return callback(null, decodeURI(buffer));
            }).on('error', (e) => {
                return callback(e.message);
            });
        });
        if (opt['body'])
            req.write(opt['body']);

        req.on('error', (e) => {
            return callback(e.message);
        });

        req.end();
    }
};

