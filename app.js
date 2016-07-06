'use strict';

var config = {
		secret: process.env.HUB_SECRET,
		secret_1: process.env.HUB_SECRET_1,
		secret_2: process.env.HUB_SECRET_2,
		mongo: process.env.HUB_MONGO,
		port: process.env.PORT
};

var hub = require('./src/hub').createHub(config);
    
hub.listen();
