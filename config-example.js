'use strict';

// default dev config
var config = {
	// 'kittens' using bcrypt 
	secret: process.env.HUB_SECRET || '$2a$10$vt2TBymKZTKxMz/Z8J6g5OgtG2IslI8A2tGiEO0jYlfZ1XlAxTOsG',
	mongo: process.env.HUB_MONGO || 'mongodb://127.0.0.1:27017/mediahubdev',	
	port: process.env.PORT || 3000,
	
};

module.exports = config;