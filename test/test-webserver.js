"use strict";

var hub = require(__dirname + '/../src/hub'),
	http = require('q-io/http'),
	assert = require('assert'),
	fs = require('q-io/fs'),
	q = require('q'),
	io = require('socket.io-client'),
    hubClient = require(__dirname + '/../public/hub-api.js'),
	socketOps = {
		transports: ['websocket'],
		forceNew: true
	},
	port = 3333,
	hubUrl = 'http://localhost:' + port;

describe('application', function () {
	var hubApp, clock;

	before(function (done) {
		hubApp = hub.createHub(true);
		hubApp.listen(port, function(err, result) {
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

        describe('an authenticated HubClient', function () {
        	beforeEach(function() {
        		return this.client.authenticate('kittens');
        	});

        	it('should save a scene', function () {
            	return this.client.saveScene({test: 'aoeu', heu: 3});
            });
        });

	});
});
