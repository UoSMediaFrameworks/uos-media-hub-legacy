var hub = require(__dirname + '/../src/hub'),
	http = require('q-io/http'),
	assert = require('assert'),
	util = require('util'),
	fs = require('q-io/fs'),
	q = require('q'),
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

	it('should serve the hub-api.js at /hub-api.js', function () {
		return q.allSettled([
			http.read(util.format('http://localhost:%d/hub-api.js', port)),
			fs.read(__dirname + '/../public/hub-api.js')
		]).spread(function(res, file) {
			assert.equal(res.value.toString('utf-8'), file.value);
		});
	});
}); 