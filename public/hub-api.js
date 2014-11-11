"use strict";

(function() {
	var root = this;
    // hold on to anything else currently in the global object incase we want to call
    // with noConflict()
	var previousModule = root.HubClient;

    // detect existence of socket.io-client
    var hasRequire = typeof require !== 'undefined';
    var io = root.io,
        Q = root.Q;

    if( typeof _ === 'undefined' ) {
        if( hasRequire ) {
            io = require('socket.io-client');
        }
        else throw new Error('HubClient requires socket.io-client, see http://socket.io');
    }

    if( typeof Q === 'undefined' ) {
        if( hasRequire ) {
            Q = require('q');
        }
        else throw new Error('HubClient requires Q, see http://github.com/kriskowal/q');
    }


	var HubClient = function(url, password, socketIoOpts) {
        this.socket = io(url, socketIoOpts);
	};

    HubClient.prototype.authenticate = function(password) {
        var deferred = Q.defer();
        this.socket.emit('auth', password, function(success) {
            if (success) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    // maybe down the road I want to switch out the constructor, so keep it internal
    var HubClientConstructor = function(url, socketIoOpts) {
        return new HubClient(url, socketIoOpts);
    };

    // optional noConflict mode
	HubClient.noConflict = function() {
		root.HubClient = previousModule;
		return HubClientConstructor;
	};

    // export constructor
	if( typeof exports !== 'undefined' ) {
		if( typeof module !== 'undefined' && module.exports ) {
			exports = module.exports = HubClientConstructor;
		}
		exports.HubClient = HubClientConstructor;
	} else {
		root.HubClient = HubClientConstructor;
	}
}).call(this);
