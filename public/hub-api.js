"use strict";

(function() {

	var root = this;
    // hold on to anything else currently in the global object incase we want to call
    // with noConflict()
	var previousModule = root.HubClient;

    // detect existence of socket.io-client
    var hasRequire = typeof require !== 'undefined';
    
    function loadLib(browserName, nodeName, errorMsg) {
        var lib = root[browserName];
        if (typeof lib === 'undefined') {
            if (hasRequire) {
                return require(nodeName);
            }
            
            if (errorMsg) {
                throw new Error(errorMsg);   
            }
        }
        
        return lib;
    }
    
    var io = loadLib('io', 'socket.io-client', 'HubClient requires socket.io-client, see http://socket.io');
    var q = loadLib('Q', 'q', 'HubClient requires Q or jQuery for promises. See http://github.com/kriskowal/q');
    

    function makePromise() {
    	var deferred = q.defer(),
    		func = function(success) {
    			if (success) {
	                deferred.resolve();
	            } else {
	                deferred.reject();
	            }
    		};
    	func.promise = deferred.promise;

    	return func;
    }

	var HubClient = function(url, socketIoOpts) {
        this.socket = io(url, socketIoOpts);
	};

    HubClient.prototype.authenticate = function(password) {
        var func = makePromise();
        this.socket.emit('auth', password, func);
        return func.promise;
    };

    HubClient.prototype.listScenes = function() {
    	var deferred = q.defer();
        this.socket.emit('listScenes', function(sceneNames) {
        	if (sceneNames) {
        		deferred.resolve(sceneNames);
        	} else {
        		deferred.reject();
        	}
        });
        return deferred.promise;
    };
    
    HubClient.prototype.saveScene = function(mediaScene) {
    	var deferred = q.defer();
        this.socket.emit('saveScene', mediaScene, function(err, scene) {
        	if (err) {
        		deferred.reject(err);
        	} else {
        		deferred.resolve(scene); 
        	}
        });
        return deferred.promise;
    };

    HubClient.prototype.loadScene = function(sceneName) {
    	var deferred = q.defer();
    	this.socket.emit('loadScene', sceneName, function(mediaScene) {
    		if (mediaScene) {
    			deferred.resolve(mediaScene);
    		} else {
    			deferred.reject();
    		}
    	});

    	return deferred.promise;
    };

    HubClient.prototype.disconnect = function() {
    	this.socket.disconnect();
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