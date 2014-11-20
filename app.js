"use strict";
 
var config = require('config'),
	hub = require('src/hub').createHub(config.mongo);
    
hub.listen(config.port);
