"use strict";

var hub = require(__dirname + '/../src/hub'),
	http = require('q-io/http'),
	assert = require('assert'),
	fs = require('q-io/fs'),
	q = require('q'),
	_ = require('lodash'),
	io = require('socket.io-client'),
    hubClient = require(__dirname + '/../public/hub-api.js'),
	socketOps = {
		transports: ['websocket'],
		forceNew: true
	},
	config = require(__dirname + '/../config.js'),
	hubUrl = 'http://localhost:' + config.port;

describe('application', function () {
	var hubApp, clock;

	before(function (done) {
		hubApp = hub.createHub(config.mongo);
		hubApp.listen(config.port, function(err, result) {
			if (err){
				done(err);
			} else {
				done();
			}
		});
	});

	/*  
	I should be using a done callback here, but for some reason
	it doesn't get triggered when running under mocha, the server
	get's forced to close anyways because the process exits.  This 
	seems to be an issue somewhere in mocha/http
	*/
	
	after(function () {
		hubApp.close();
	});

	it('should exist', function () {
		assert(hubApp);
	});

	describe('webserver', function () {
		it('should serve the hub-api.js at /hub-api.js', function () {
			return q.allSettled([
				http.read(hubUrl + '/hub-api.js'),
				fs.read(__dirname + '/../public/hub-api.js')
			]).spread(function(res, file) {
				assert.equal(res.value.toString('utf-8'), file.value);
			});
		});
	});

	describe('socket server & hub client', function () {

        beforeEach(function() {
            this.client = hubClient(hubUrl, socketOps);
        });

        afterEach(function() {
        	this.client.disconnect();
        });

        describe('HubClient()', function() {
            it('should return an object of sorts', function() {
                var client = hubClient(hubUrl, socketOps);
                assert(client !== null && typeof client === 'object');
            });
        });

        describe('HubClient.authenticate()', function () {
            it('should fulfill promise when given valid password', function() {
                return this.client.authenticate('kittens').then(
                    function() {},
                    function() { assert.fail('promise rejected'); }
                );
            });

            it('should reject promise when given invalid password', function() {
                return this.client.authenticate('puppies').then(
                    function() { assert.fail('promise fulfilled'); },
                    function() {}
                );
            });
        });

        describe('HubClient.saveScene()', function () {
        	beforeEach(function() {
        		return this.client.authenticate('kittens');
        	});

        	it('should resolve a promise successfully when scene is saved', function () {
            	return this.client.saveScene({name: 'scene1', heu: 3});
            });

            it('should be listed in listScenes()', function () {
            	var self = this;
            	var sceneName = 'scene1';
            	return self.client.saveScene({name: sceneName, heu: 3}).then(function() {
            		return self.client.listScenes().then(function(scenes) {
            			// figure out if it's in there
            			//_.where()
            			console.log('here', scenes);
            		});
            	});
            });
        });

	});
});
