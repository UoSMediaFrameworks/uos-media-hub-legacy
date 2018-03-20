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
		secret_112: process.env.HUB_SECRET_112,
		secret_113: process.env.HUB_SECRET_113,
        secret_114: process.env.HUB_SECRET_114,
        secret_115: process.env.HUB_SECRET_115,
        secret_116: process.env.HUB_SECRET_116,
        secret_117: process.env.HUB_SECRET_117,
		secret_118: process.env.HUB_SECRET_118,
	    secret_119:process.env.Hub_secret_119,
		mongo: process.env.HUB_MONGO,
		port: process.env.PORT
};

var hub = require('./src/hub').createHub(config);
    
hub.listen();
