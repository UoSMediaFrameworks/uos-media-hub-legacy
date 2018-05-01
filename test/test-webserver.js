"use strict";

// try to load the config
var config;
try {
    config = require('../config');
} catch (e) {
    config = {
        secret: process.env.HUB_SECRET,
        secret_1: process.env.HUB_SECRET_1,
        secret_2: process.env.HUB_SECRET_2,
        secret_101: process.env.HUB_SECRET_101,
        secret_102: process.env.HUB_SECRET_102,
        secret_103: process.env.HUB_SECRET_103,
        secret_104: process.env.HUB_SECRET_104,
        secret_105: process.env.HUB_SECRET_105,
        secret_106: process.env.HUB_SECRET_106,
        secret_107: process.env.HUB_SECRET_107,
        secret_108: process.env.HUB_SECRET_108,
        secret_109: process.env.HUB_SECRET_109,
        secret_110: process.env.HUB_SECRET_110,
        secret_111: process.env.HUB_SECRET_111,
        secret_112: process.env.HUB_SECRET_112,
        secret_113: process.env.HUB_SECRET_113,
        secret_114: process.env.HUB_SECRET_114,
        secret_115: process.env.HUB_SECRET_115,
        secret_116: process.env.HUB_SECRET_116,
        mongo: process.env.HUB_MONGO,
        port: process.env.PORT
    };
}


var hub = require(__dirname + '/../src/hub'),
        assert = require('assert'),
    io = require('socket.io-client'),
    async = require('async'),
    _ = require('lodash'),
    session = require('../src/session'),
    socketOps = {
        transports: ['websocket'],
        forceNew: true
    },
    hubUrl = 'http://localhost:' + config.port,
    request = require('supertest')(hubUrl),
    bcrypt = require('bcrypt-nodejs');

describe('Hub', function () {
        var hubApp,
            clearDatabase = function (callback) {
                hubApp.db.mediaScenes.remove({}, function () {
                    var collection = hubApp.db.collection('usersWithGroup');
                    collection.remove({}, callback);
                });

            };

        before(function (done) {
            hubApp = hub.createHub(config);
            hubApp.listen(function (err, result) {
                if (err) {
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

        afterEach(function (done) {
            clearDatabase(done);
        });

        it('should exist', function () {
            assert(hubApp);
        });

        describe('socket API', function () {

                beforeEach(function (done) {
                    this.socket = io(hubUrl, socketOps);
                    this.socket.on('connect', function () {
                        done();
                    });
                });

                afterEach(function () {
                    this.socket.disconnect();
                });

                function validateUsersCollectionEmpty(cb) {
                    var collection = hubApp.db.collection('usersWithGroup');
                    collection.find({}, function (err, users) {
                        assert(err === null, "empty user check db error");
                        assert(Array.isArray(users), "users is not an array");
                        assert(users.length === 0, "users table not empty");
                        cb();
                    });
                }

                function validateUsersCollectionHasUsers(cb) {

                    var collection = hubApp.db.collection('usersWithGroup');
                    collection.find({}, function (err, users) {
                        assert(Array.isArray(users));
                        assert(users.length > 0);
                        cb();
                    });
                }

                function insertUser(cb) {
                    var testUser = {
                        username: "test-user",
                        password: bcrypt.hashSync("test0101"),
                        groupID: 0,
                        groupName: "admin"
                    };
                    var collection = hubApp.db.collection('usersWithGroup');
                    collection.insert(testUser, function (err, result) {
                        assert(err === null);
                        cb();
                    });
                }

                //APEP: Allow an admin socket (/controller) to request a new session for a new client its responsible for
                describe('"authProvider", {password: <valid password>}', function () {

                    before(function (done) {
                        validateUsersCollectionEmpty(function () {
                            insertUser(done);
                        });
                    });

                    it('should provide valid password for authentication from the database', function (done) {
                        validateUsersCollectionHasUsers(function () {
                            var self = this;
                            this.socket.emit('auth', {username: 'test-user', password: 'test0101'}, function (err, t) {

                                self.socket.emit('authProvider', {
                                    username: 'test-user',
                                    password: 'test0101'
                                }, function (err, token) {
                                    var sock2 = io(hubUrl, socketOps);
                                    sock2.on('connect', function () {
                                        sock2.emit('auth', {token: token}, function (err, secondToken) {
                                            assert.equal(token, secondToken);
                                            done();
                                        });
                                    });
                                });
                            });

                        }.bind(this));
                    });

                    it('should provide valid password for auth from the secret keys', function (done) {
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            self.socket.emit('authProvider', {password: 'kittens'}, function (err, token) {
                                var sock2 = io(hubUrl, socketOps);
                                sock2.on('connect', function () {
                                    sock2.emit('auth', {token: token}, function (err, secondToken) {
                                        assert.equal(token, secondToken);
                                        done();
                                    });
                                });
                            });
                        });
                    });

                    it('should provide valid password for auth from the secret keys with empty username', function (done) {
                        var self = this;
                        this.socket.emit('auth', {username: '', password: 'kittens'}, function (err, t) {
                            self.socket.emit('authProvider', {username: '', password: 'kittens'}, function (err, token) {
                                var sock2 = io(hubUrl, socketOps);
                                sock2.on('connect', function () {
                                    sock2.emit('auth', {token: token}, function (err, secondToken) {
                                        assert.equal(token, secondToken);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });

                describe('"authProvider", {password: <invalid password>', function () {

                    it('should provide invalid password for authentication', function (done) {
                        this.timeout(7000);
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            self.socket.emit('authProvider', {password: 'invalid'}, function (err, token) {
                                assert(err);
                                done();
                            });
                        });
                    });
                });

                describe('"authProvider", {username:<invalid username>,password:<invalid password>}', function () {
                    before(function (done) {
                        validateUsersCollectionEmpty(function () {
                            insertUser(done);
                        });
                    });
                    it('should provide invalid username or password authentication', function (done) {
                        this.timeout(7000);
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            assert(!err,"auth with password and username success");
                            self.socket.emit('authProvider', {password: 'invalid',username:'invalid'}, function (err, token) {
                                assert(err,"the username or password was invalid");
                                done();
                            });
                        });
                    });
                });

                describe('"authProvider", {username:<valid username>,password:<invalid password>}', function () {
                    before(function (done) {
                        validateUsersCollectionEmpty(function () {
                            insertUser(done);
                        });
                    });
                    it('should provide valid username and invalid password authentication', function (done) {
                        this.timeout(7000);
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            self.socket.emit('authProvider', {password: 'invalid',username:'test-user'}, function (err, token) {
                                assert(err,"wrong password");
                                done();
                            });
                        });
                    });
                });

                describe('"authProvider", {username:<invalid username>,password:<valid password>}', function () {
                    before(function (done) {
                        validateUsersCollectionEmpty(function () {
                            insertUser(done);
                        });
                    });
                    it('should provide invalid username but valid password authentication', function (done) {
                        this.timeout(7000);
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            self.socket.emit('authProvider', {password: 'test0101',username:'invalid'}, function (err, token) {
                                assert(err,"username does not exist or wrong username and password error");
                                done();
                            });
                        });
                    });
                });

                describe('"authProvider", {username:<valid username>,password:<valid password>}', function () {
                    before(function (done) {
                        validateUsersCollectionEmpty(function () {
                            insertUser(done);
                        });
                    });
                    it('should provide valid username and password authentication', function (done) {
                        this.timeout(7000);
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            self.socket.emit('authProvider',{
                                username: 'test-user',
                                password: 'test0101'
                            }, function (err, token) {
                                assert(token,"token received for valid account details");
                                done();
                            });
                        });
                    });
                });
                describe('"authProvider", {token: <valid token>', function () {

                    it('should provide invalid password for authentication', function (done) {
                        this.timeout(5000);
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            assert(!err);
                            self.socket.emit('authProvider', {password: 'kittens'}, function (err, token) {
                                assert(!err);
                                assert(token);
                                self.socket.emit('authProvider', {"token": token}, function (err, token) {
                                    assert(!err);
                                    done();
                                });
                            });
                        });
                    });
                });

                describe('"authProvider", {token: <invalid token>', function () {

                    it('should provide invalid password for authentication', function (done) {
                        this.timeout(5000);
                        var self = this;
                        this.socket.emit('auth', {password: 'kittens'}, function (err, t) {
                            assert(!err);
                            self.socket.emit('authProvider', "{\"token\": token}", function (err, token) {
                                assert(err);
                                console.log(err);
                                done();
                            });
                        });
                    });
                });

                describe('"auth", {password: <valid password>}, callback(err, token)', function () {
                    it('should invoke callback with a token and a room id', function (done) {
                        this.socket.emit('auth', {password: 'kittens'}, function (err, token, roomId) {
                            assert(token);
                            assert(roomId);
                            done();
                        });
                    });

                    it('should invoke callback with a token when given same token', function (done) {
                        this.socket.emit('auth', {password: 'kittens'}, function (err, token) {
                            var sock2 = io(hubUrl, socketOps);
                            sock2.on('connect', function () {
                                sock2.emit('auth', {token: token}, function (err, secondToken) {
                                    assert.equal(token, secondToken);
                                    done();
                                });
                            });
                        });
                    });
                });

                describe('"auth", {password: <null>}, callback(err, token)', function () {
                    it('should invoke callback with an error message', function (done) {
                        this.socket.emit('auth', {password: null}, function (err, token) {
                            assert(err);
                            done();
                        });
                    });
                });

                describe('"auth", {password: <invalid password>}, callback(err, token)', function () {
                    it('should invoke callback with an error message', function (done) {
                        this.timeout(7000);
                        this.socket.emit('auth', {password: "invalidpass"}, function (err, token) {
                            assert(err);
                            done();
                        });
                    });
                });

                describe('"auth", {token: <invalid token>}, callback(err, token)', function () {
                    it('should invoke callback with an error message', function (done) {
                        this.socket.emit('auth', {token: '9487asnotheu'}, function (err, token) {
                            assert(err);
                            done();
                        });
                    });
                });

                describe('after valid "auth":', function () {
                    beforeEach(function (done) {
                        this.socket.emit('auth', {password: 'kittens'}, done);
                    });


                    describe('"saveScene", sceneObj, callback(err, scene) with invalid scene', function () {
                        it('should resolve callback with an error', function (done) {
                            this.socket.emit('saveScene', {name: 'bad scene', scene: {}}, function (err, scene) {
                                assert(err);
                                done();
                            });
                        });
                    });

                    describe('"saveScene", sceneObj, callback(err, scene) with valid scene', function () {

                        beforeEach(function (done) {
                            var self = this;
                            var sceneData = {
                                name: 'scene1',
                                scene: [
                                    {
                                        'tags': '',
                                        'type': 'image',
                                        'url': 'http://www.history.com/news/wp-content/uploads/2013/03/neanderthals-rabbits.jpg'
                                    },
                                    {
                                        'tags': '',
                                        'type': 'image',
                                        'url': 'http://www.hollyoakvets.com/wp-content/uploads/2015/05/bunnies.jpg'
                                    }
                                ]
                            };
                            this.socket.emit('saveScene', sceneData, function (err, scene) {
                                self.error = err;
                                self.scene = scene;
                                done();
                            });
                        });

                        it('should resolve callback with saved scene', function () {
                            assert(this.scene);
                        });

                        it('should add an _id property to the scene object', function () {
                            assert(this.scene._id);
                        });

                        it('should add _id properties to all of the mediaObjects', function () {
                            this.scene.scene.forEach(function (mediaObject) {
                                assert(mediaObject._id);
                            });
                        });

                        it('should update a scene if it already exists', function (done) {
                            var self = this;
                            this.socket.emit('saveScene', this.scene, function (err, s2) {
                                self.socket.emit('listScenes', function (err, scenes) {
                                    assert.equal(scenes.length, 1);
                                    done();
                                });
                            });
                        });
                    });

                    describe('"loadScene", sceneId, callback(err, scene)', function () {
                        it('should resolve callback with a scene', function (done) {
                            var self = this;
                            this.socket.emit('saveScene', {
                                name: 'aosenhtua',
                                heu: 3,
                                scene: []
                            }, function (err, savedScene) {
                                self.socket.emit('loadScene', savedScene._id, function (err, loadedScene) {
                                    assert.deepEqual(savedScene, loadedScene);
                                    done();
                                });
                            });
                        });
                    });

                    describe('"listScenes", callback(err, sceneList)', function () {
                        beforeEach(function (done) {
                            var self = this;
                            async.parallel([
                                function (cb) {
                                    self.socket.emit('saveScene', {name: 'a', scene: []}, cb);
                                },
                                function (cb) {
                                    self.socket.emit('saveScene', {name: 'b', scene: []}, cb);
                                },
                                function (cb) {
                                    self.socket.emit('saveScene', {name: 'c', scene: []}, cb);
                                }
                            ], function (err, results) {
                                self.socket.emit('listScenes', function (err, sceneList) {
                                    self.sceneList = sceneList;
                                    done();
                                });
                            });
                        });

                        it('should return all scenes', function () {
                            assert.equal(this.sceneList.length, 3);
                        });

                        it('should only include name, _id and _groupID properties', function () {
                            var keys = _.uniq(_.flatten(_.map(this.sceneList, function (s) {
                                return _.keys(s);
                            })));
                            assert.deepEqual(_.sortBy(keys), _.sortBy(['name', '_id', "_groupID"]));
                        });
                    });

                    describe('"listScenesForGroup", callback(err, sceneList', function () {

                        beforeEach(function (done) {
                            var self = this;
                            async.parallel([
                                function (cb) {
                                    self.socket.emit('saveScene', {name: 'a', scene: [], _groupID: 0}, cb);
                                },
                                function (cb) {
                                    self.socket.emit('saveScene', {name: 'b', scene: [], _groupID: 101}, cb);
                                },
                                function (cb) {
                                    self.socket.emit('saveScene', {name: 'c', scene: [], _groupID: 0}, cb);
                                }
                            ], function (err, results) {
                                self.socket.emit('listScenesForGroup', 0, function (err, firstSceneList) {
                                    self.adminSceneList = firstSceneList;

                                    self.socket.emit('listScenesForGroup', 101, function (err, secondSceneList) {
                                        self.groupSceneList = secondSceneList;

                                        self.socket.emit('listScenesForGroup', "101", function (err, secondSceneList) {
                                            self.groupSceneListUsingString = secondSceneList;
                                            done();
                                        });
                                    });
                                });
                            });
                        });

                        it('should return all scenes for admin <0>', function () {
                            assert.equal(this.adminSceneList.length, 3);
                        });

                        it('should return only group scenes for non admin <101>', function () {
                            assert.equal(this.groupSceneList.length, 1);
                        });

                        it('should allow group ID to be sent as a string <"101">', function () {
                            assert.equal(this.groupSceneListUsingString.length, 1);
                            assert.equal(this.groupSceneList.length, this.groupSceneListUsingString.length);
                        });
                    });

                    describe('"subScene", sceneId, callback(err, scene)', function () {
                        beforeEach(function (done) {
                            this.socket.emit('saveScene', {name: 'a', scene: []}, function (err, scene) {
                                this.scene = scene;
                                done();
                            }.bind(this));
                        });


                        it('should invoke the callback with the requested scene', function (done) {
                            this.socket.emit('subScene', this.scene._id, function (err, scene) {
                                assert.deepEqual(this.scene, scene);
                                done();
                            }.bind(this));
                        });

                        it('should cause socket to recieve "sceneUpdate" messages when that scene gets updated', function (done) {
                            var self = this;
                            this.socket.emit('subScene', this.scene._id, function () {
                                var otherSocket = io(hubUrl, socketOps);
                                otherSocket.on('connect', function () {
                                    otherSocket.emit('auth', {password: 'kittens'}, function () {
                                        self.scene.newKey = 'blah';
                                        otherSocket.emit('saveScene', self.scene);
                                    });
                                });
                            });

                            this.socket.on('sceneUpdate', function (sceneData) {
                                assert.deepEqual(self.scene, sceneData);
                                done();
                            });
                        });
                    });

                    describe('"deleteScene", sceneId, callback(err)', function () {
                        it('should delete a scene', function (done) {
                            var self = this;
                            self.socket.emit('saveScene', {name: 'a', scene: []}, function (err, scene) {
                                self.socket.emit('deleteScene', scene._id, function (err) {
                                    self.socket.emit('loadScene', scene._id, function (err, newScene) {
                                        assert(!newScene);
                                        done();
                                    });
                                });
                            });
                        });
                    });

                    describe('"unsubScene", sceneId, callback(err)', function () {
                        beforeEach(function (done) {
                            this.socket.emit('saveScene', {name: 'a', scene: []}, function (err, scene) {
                                this.scene = scene;
                                done();
                            }.bind(this));
                        });

                        it('should prevent socket from recieving "sceneUpdate" messages when that scene gets updated', function (done) {
                            var self = this;
                            this.socket.emit('subScene', this.scene._id, function () {
                                var otherSocket = io(hubUrl, socketOps);
                                otherSocket.on('connect', function () {
                                    otherSocket.emit('auth', {password: 'kittens'}, function () {
                                        self.socket.emit('unsubScene', self.scene._id, function (err) {
                                            self.scene.newKey = 'blah';
                                            otherSocket.emit('saveScene', self.scene, function (err, scene) {
                                                done();
                                            });
                                        });
                                    });
                                });
                            });

                            this.socket.on('sceneUpdate', function (sceneData) {
                                done('sceneUpdate message recieved');
                            });
                        });
                    });
                });
            }
        );
    }
);
