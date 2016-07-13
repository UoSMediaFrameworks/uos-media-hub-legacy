'use strict';

var config = {
		secret: process.env.HUB_SECRET,
		secret_1: process.env.HUB_SECRET_1,
		secret_2: process.env.HUB_SECRET_2,
		secret_3: process.env.HUB_SECRET_3,
		secret_4: process.env.HUB_SECRET_4,
		secret_5: process.env.HUB_SECRET_5,
		secret_6: process.env.HUB_SECRET_6,
		mongo: process.env.HUB_MONGO,
		port: process.env.PORT
};

var hub = require('./src/hub').createHub(config);
    
hub.listen();
