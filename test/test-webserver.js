var hub = require(__dirname + '/../src/hub'),
	http = require('http'),
	assert = require('assert'),
	util = require('util'),
	port = 3333;

describe('webserver', function () {
	var hubApp;

	before(function (done) {
		hubApp = hub.createHub();
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

	it('should serve the hub-api.js at /hub-api.js', function (done) {
		http.get(util.format('http://localhost:%d/hub-api.js', port), function(res) {
			assert.equal(200, res.statusCode);
			done();
		});
	});
});