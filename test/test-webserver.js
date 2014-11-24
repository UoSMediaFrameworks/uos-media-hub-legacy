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
    });

    describe('authenticated HubClient', function () {
        beforeEach(function() {
            this.client = hubClient(hubUrl, socketOps);
            return this.client.authenticate('kittens');
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
    });

    
});
