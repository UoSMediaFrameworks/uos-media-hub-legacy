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
		vimeoClientId: process.env.VIMEO_CLIENT_ID,
		vimeoClientSecret: process.env.VIMEO_CLIENT_SECRET,
		vimeoAccessToken: process.env.VIMEO_ACCESS_TOKEN
	};

}

var hub = require('./src/hub').createHub(config);
    
hub.listen();
