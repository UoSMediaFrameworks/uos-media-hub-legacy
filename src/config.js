"use strict";

var extend = require('util-extend');

// default dev config
var config = {
	// 'kittens' using bcrypt 
	secret: '$2a$10$vt2TBymKZTKxMz/Z8J6g5OgtG2IslI8A2tGiEO0jYlfZ1XlAxTOsG',
	mongo: 'mongodb://MediaHubDev:lfZ_Nm5cPuxKcpUyp62koqs9ZylzExoO1tWJl2xfmAs-@ds041167.mongolab.com:41167/MediaHubDev',
	// mongo -u MediaHubDev -p lfZ_Nm5cPuxKcpUyp62koqs9ZylzExoO1tWJl2xfmAs- ds041167.mongolab.com:41167/MediaHubDev
	port: process.env.PORT || 3000

};

switch(process.env.CONFIG) {
	case 'TRAVIS':
		config = extend(config, {mongo: 'mongodb://127.0.0.1:27017'});
		break;
}

module.exports = config;