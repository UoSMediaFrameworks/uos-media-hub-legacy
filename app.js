'use strict';

var config = {
		secret: process.env.HUB_SECRET,
		mongo: process.env.HUB_MONGO,
		port: process.env.PORT
};

var hub = require('./src/hub').createHub(config);
    
hub.listen();
