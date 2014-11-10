as = require('assert');

describe('My dummy test', function() {
	var val;

	before(function() {
		val = true;
	});

	it('should be true', function() {
		as(val);
	});
});