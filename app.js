"use strict";
	
var config = require('./config.js'),
	hub = require('./src/hub').createHub(config.mongo);
    
hub.listen(config.port);
