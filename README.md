## LogTracker ##
### Overview ###
Logging are one of the most important aspect when it comes to detecting any problem or anomaly in production. Generally, one of the biggest problems is being able to track the flow of a single request. Since when there are many concurrent requests, the logs of all of them are mixed, making it impossible to track them unless they have a unique identifier.
So, the ability to identify in each trace of log to which request belongs is very important. Fortunately, Node.js beginning version 8.x inserted 'Async Hooks' module that provides an API to register callbacks tracking the lifetime of asynchronous resources created inside a Node.js application. A few wrappers were created already based on 'Async Hooks' named 'cls-*'. They represents so named 'continuation-local storage' which works like thread-local storage in threaded programming, but is based on chains of Node-style callbacks instead of threads. 
Thus, the current implementation uses quite mature 'cls-hooked' implementation. Simply, 'cls-hooked' creates a quite long stack of marked requests. Note also that 'cls-hooked' is grouping unique requests values into namespaces which have to be different for any separate application.
### Description ###
The module 'logTracker' wraps Log4js logger so that any message will be appended by unique info of request (if defined).
It's necessary to start tracking process by creating request unique identifier to be abble to track the request. 
To do so can be by calling method 'startTracking'  as early as possible. It receives two parameters: opt and callback.
The first parameter serves to unique mark a request and can representing Number, String, custom Object or even can be omitted. Application can itself generates the unique ID and send it as a parameter 'opt' or the unique id can be wrapped into custom Object under key 'reqId'. 
Moreover, the opt parameter can representing Request object (http.IncomingMessage). In this case, the MD5 hash will be generated and it will represent a request unique ID. If the opt parameter omitted, the random number will be generated as a unique ID of request.
Please Note that the custom Object can consists any other keys which do message more informative.
So next, any log record will be appended by unique tracking info which allow to simply tracks any separate request.
#### Logger ####
The embedded logger wraps the log4js module. It override the log4js all important methods (TRACE, DEBUG, INFO, WARN, ERROR, FATAL). So you can use it as ordinary logger. It will append tracking info into log records in case you call 'startTracking' method at moment when request is arive. Otherwise, it will work like ordinary logger.   
It gives a possibility to point relative definition of logs location  in the log4js config file. Note that the config file have to be located in the './properties/' folder somewhere higher of current location.  
Naturally, you can define some other path (relative or absolute) by using global.log_config_path variable.
Alternative, the logger configuration can be defined directly.  

The configuration should be prepared according [log4js v2 or higher notations](https://github.com/log4js-node/log4js-node).  

Please find the sample of log4js configuration [here](https://www.screencast.com/t/lH3lUkwL).

### Install ###
To be able to use descibed here module you should put the following command 
>npm install log-tracking --save

### Public Methods ###

***

#### startTracking(opt, callback) ####
Initializing of request tracking log  
  
parameter **opt** unique marks the request. Can representing  Number, String or Object.   

- if opt represents Number or String, it will be used as unique 'reqId' value.
- if opt parameter represents http.IncommingMessage class (Request object), the unique reqId will be calculated as a MD5 hash of this object.<br>
- if opt represents the custom Object, it should contains a unique value under 'reqId' key.  
    Moreover, the custom Object can contains the Request object under 'req' key. In this case the 'reqId' will be calculated as a MD5 hash.  
    The custom object can contains in addition any custom keys.They will be kept in log.
- the random number will be used as a 'reqId' in case of opt parameter missed.  

parameter **callback** is standard callback(err, data)

***

### Usage ###
**Minimalist version:**

>> // one of bellow listed definitions can be provided  
>>global.**log_config** = 'existing log config path' //default path ('./properties/log4js.json') will be used if this definition omitted  
>>global.**log_config** = require('log4j_config').log_conf; // logger configuration can be defined in the JS file directly.  

>global.**namespace_name** = 'desired namespace name'  //default name ('defaultNamespace') will be used if this definition omitted  
  
>const logger = **require('log-tracking')**;  
>const nlogger = **logger.getLogger(**'node_server');
>
>http.createServer((req, res) => {
>    logger.**startTracking**(req, (err, data) => {...}    
>}).listen(port, host);
>	
#### Tests ####
The simple test-modules are located in the './test' folder.  
'testLogTracker' creates the simple HTTP server and when you request it by url 'http://127.0.0.1:8080/' the answere should be 'OK'.   
Correspondigly the log file should contains the log records with tracking info.  
'testLogTrackerS' creates the simple HTTPS server and when you request it by url 'http://127.0.0.1:8443/' the answere should be 'OK'.   
Note: './test' folder contains 'requester.js' and 'requestS' modules which provide several HTTP and HTTPS requests in parallel.  
The generated log file content shold be like depicted below:

>[2018-07-30T16:00:48.080] [INFO] node_server - : >>>>>>>>>>>>
>[2018-07-30T16:00:48.085] [WARN] node_queue - {"user":"simon","reqId":"f5a36a13b4a8df29f2ececc334ad9e9e"}: start tracking err:null; data:Ok
>[2018-07-30T16:00:48.085] [INFO] node_server - {"user":"simon","reqId":"f5a36a13b4a8df29f2ececc334ad9e9e"}: !!! request finishing !!!
>[2018-07-30T16:00:48.087] [INFO] node_server - : >>>>>>>>>>>>
>[2018-07-30T16:00:48.088] [WARN] node_queue - {"user":"john","reqId":"f8d99cf89980dffa610d4218b40e2855"}: start tracking err:null; data:Ok
>[2018-07-30T16:00:48.089] [INFO] node_server - {"user":"john","reqId":"f8d99cf89980dffa610d4218b40e2855"}: !!! request finishing !!!
>[2018-07-30T16:00:49.093] [INFO] node_server - {"user":"simon","reqId":"f5a36a13b4a8df29f2ececc334ad9e9e"}: >>>> request finished
>[2018-07-30T16:00:49.099] [INFO] node_server - {"user":"john","reqId":"f8d99cf89980dffa610d4218b40e2855"}: >>>> request finished
>
#### References ####
- https://nodejs.org/dist/latest-v8.x/docs/api/async_hooks.html
- https://github.com/Jeff-Lewis/cls-hooked