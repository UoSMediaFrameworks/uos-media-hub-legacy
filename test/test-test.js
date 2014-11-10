var should = require('should');

describe('My dummy test', function() {
	var val;

	before(function() {
		val = true;
	});

	it('should be true', function() {
		val.should.be.true;
	})
});