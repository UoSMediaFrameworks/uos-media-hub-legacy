'use strict';

var config = {
		secret: process.env.HUB_SECRET,
		secret_1: process.env.HUB_SECRET_1,
		secret_2: process.env.HUB_SECRET_2,
		secret_101: process.env.HUB_SECRET_101,
		secret_102: process.env.HUB_SECRET_102,
		secret_103: process.env.HUB_SECRET_103,
		secret_104: process.env.HUB_SECRET_104,
		secret_105: process.env.HUB_SECRET_105,
		secret_106: process.env.HUB_SECRET_106,
		secret_107: process.env.HUB_SECRET_107,
		secret_108: process.env.HUB_SECRET_108,
		secret_109: process.env.HUB_SECRET_109,
		secret_110: process.env.HUB_SECRET_110,
		secret_111: process.env.HUB_SECRET_111,
		mongo: process.env.HUB_MONGO,
		port: process.env.PORT
};

var hub = require('./src/hub').createHub(config);
    
hub.listen();
