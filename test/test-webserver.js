"use strict";

var hub = require(__dirname + '/../src/hub'),
    http = require('q-io/http'),
    assert = require('assert'),
    fs = require('q-io/fs'),
    q = require('q'),
    _ = require('lodash'),
    hubClient = require('media-hub-client'),
    socketOps = {
        transports: ['websocket'],
        forceNew: true
    },
    config = require('../config'),
    hubUrl = 'http://localhost:' + config.port;

describe('Hub', function () {
    var hubApp,
        clearDatabase = function() {
            var deferred = q.defer();
            hubApp.db.mediaScenes.remove({}, function(err, count) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(count);
                }
            });

            return deferred.promise;
        };

    before(function (done) {
        hubApp = hub.createHub(config);
        hubApp.listen(function(err, result) {
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

    afterEach(function () {
        return clearDatabase();
    });

    it('should exist', function () {
        assert(hubApp);
    });

    describe('HubClient', function () {

        beforeEach(function() {
            this.client = hubClient(socketOps);
        });

        afterEach(function() {
            this.client.disconnect();
        });

        describe('HubClient()', function() {
            it('should return an object of sorts', function() {
                var client = this.client.connect(hubUrl, {password: 'kittens'});
                assert(client !== null && typeof client === 'object');
            });
        });

        describe('HubClient.connect()', function () {
            it('should fulfill promise when given valid password', function() {
                return this.client.connect(hubUrl, {password: 'kittens'}).then(
                    function() {},
                    function() { assert.fail('promise rejected'); }
                );
            });

            it('should fulfill promise with a token', function () {
                return this.client.connect(hubUrl, {password: 'kittens'}).then(
                    function(token) {
                        assert.equal(typeof token, 'string');
                    },
                    function() { assert.fail('promise rejected'); }
                ); 
            });

            it('should fulfill promise when given a token with same token', function () {
                return this.client.connect(hubUrl, {password: 'kittens'}).then(
                    function(token) {
                        hubClient(socketOps).connect(hubUrl, {token: token}).then(function(secondToken) {
                            assert.equal(token, secondToken);
                        });
                    }
                );
            });

            it('should reject promise when given invalid password', function() {
                return this.client.connect(hubUrl, {password: 'puppies'}).then(
                    function() { assert.fail('promise fulfilled'); },
                    function() {}
                );
            });

            it('should reject promise when given invalid token', function() {
                return this.client.connect(hubUrl, {token: '9487asnotheu'}).then(
                    function() { assert.fail('promise fulfilled'); },
                    function() {}
                );
            });
        });
    });

    describe('connected HubClient', function () {
        beforeEach(function() {
            this.client = hubClient(socketOps);
            return this.client.connect(hubUrl, {password: 'kittens'});
        });

        afterEach(function () {
            this.client.disconnect();
        });

        describe('HubClient.saveScene()', function () {
            it('should resolve a promise successfully when scene is saved', function () {
                return this.client.saveScene({name: 'scene1', heu: 3});
            });

            it('should include the saved scene in the resolved promise', function () {
                return this.client.saveScene({name: 'scene1', heu: 3}).then(function(scene) {
                    assert(scene !== null && typeof scene === 'object');
                });
            });

            it('should be loadable with loadScene', function () {
                var self = this;
                return self.client.saveScene({name: 'aosenhtua', heu: 3}).then(function(savedScene) {
                    return self.client.loadScene(savedScene._id).then(function(loadedScene) {
                        assert.deepEqual(savedScene, loadedScene);
                    });
                });
            });

            it('should update an existing scene when saved, not create a new one', function () {
            	var self = this;
            	return self.client.saveScene({name: 'aosenhtua', heu: 3}).then(function(savedScene) {
                    return self.client.saveScene(savedScene).then(function(s2) {
                    	return self.client.listScenes().then(function(scenes) {
                    		assert.equal(scenes.length, 1);
                    	});
                    });
                });
            });
        });

        describe('HubClient.listScenes()', function () {

            beforeEach(function () {
                var self = this;
                
                return q.all([
                    self.client.saveScene({name: 'a'}),
                    self.client.saveScene({name: 'b'}),
                    self.client.saveScene({name: 'c'})
                ]).then(function() {
                    return self.client.listScenes().then(function(scenes) {
                        self.scenes = scenes; 
                    });
                });
            });

            it('should return all scenes', function () {
                assert.equal(this.scenes.length, 3); 
            });

            it('should only include name and _id properties', function () {
                var keys = _.uniq(_.flatten(_.map(this.scenes, function(s) { return _.keys(s); })));
                assert.deepEqual(_.sortBy(keys), _.sortBy(['name', '_id']));
            });
        });

        describe('HubClient.subScene()', function () {
        	beforeEach(function () {
        		var self = this;
        		return this.client.saveScene({name: 'a'}).then(function(scene) {
        			self.scene = scene;
        		});
        	});

        	it('should return scene that was subscribed to', function () {
        		var self = this;
        		return self.client.subScene(self.scene._id, function() {}).then(function(scene) {
        			assert.deepEqual(self.scene, scene);
        		});
        	});

            it('should call the subScene handler when a scene gets updated', function (done) {
                var self = this;
                var newScene;
                var handler = function(updatedScene) {
                    assert.deepEqual(newScene, updatedScene);
                    done();
                };

                self.client.subScene(self.scene._id, handler).then(function() {
                    // connect with another client and update the scene
                    var otherClient = hubClient(socketOps);
                    otherClient.connect(hubUrl, {password: 'kittens'}).then(function() {
                        newScene = self.scene;
                        newScene.newKey = 'blah';
                        otherClient.saveScene(newScene);
                    });
                }); 
            });
        });

        describe('HubClient.deleteScene()', function () {
            it('should delete a scene identified by an id', function () {
                var self = this;
                return self.client.saveScene({name: 'scenester'}).then(function(scene) {
                    return self.client.deleteScene(scene._id).then(function(err) {
                        return self.client.loadScene(scene._id).then(function(err, newScene) {
                            assert(! newScene);
                        });
                    });
                });
            });
        });

        describe('HubClient.unsubScene()', function () {
            beforeEach(function () {
                var self = this;
                return this.client.saveScene({name: 'a'}).then(function(scene) {
                    self.scene = scene;
                    return self.client.subScene(scene._id, function() {
                        self.handler();
                    });
                });
            });

            it('should not call handler after scene gets updated', function () {
                var self = this;
                self.handler = function() {
                    assert.fail('handler was called');
                };

                return self.client.unsubScene(self.scene._id).then(function() {
                    self.scene.foo = 'bar';
                    return self.client.saveScene(self.scene);
                });
            });
        });
        
    });

    
});
