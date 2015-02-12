'use strict';

// try to load the config
var config;
try {
	config = require('./config');
} catch (e) {
	config = {
		secret: process.env.HUB_SECRET,
		mongo: process.env.HUB_MONGO,
		port: process.env.PORT,
	};

}

var hub = require('./src/hub').createHub(config);
    
hub.listen();
