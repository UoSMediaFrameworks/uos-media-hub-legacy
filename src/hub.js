'use strict';

var bcrypt = require('bcrypt-nodejs'),
    Server = require('socket.io'),
    express = require('express'),
    http = require('http'),
    path = require('path'),
    mongo = require('mongojs');

var util = require('util');
var session = require('./session');
var _ = require('lodash');
var cors = require('cors');

var _validTokens = {};

function throwErr (func) {
    return function(err, data) {
        if (err) {
            throw err;  
        } else {
            func.call(null, data);
        }
    };
}

function addApiCalls (hub, io, socket) {
    function idSearch (id) {
        return {_id: mongo.ObjectId(id)};
    }

    function _findScene (sceneId, cb) {
        return hub.db.mediaScenes.findOne(idSearch(sceneId), cb);
    }

    socket.on('listScenes', function(callback) {
        hub.db.mediaScenes.find({'$query': {}, '$orderby': {name: 1}}, {name: 1}, callback);
    });
    
    socket.on('saveScene', function(sceneData, callback) {
        // convert _id so mongo recognizes it
        if (sceneData.hasOwnProperty('_id')) {
            sceneData._id = mongo.ObjectId(sceneData._id);
        }

        hub.db.mediaScenes.save(sceneData, function(err, scene) {
            io.to(scene._id.toString()).emit('sceneUpdate', scene);
            
            if (callback) {
                callback(err, scene);
            }
        });
    });

    socket.on('loadScene', _findScene);

    socket.on('loadSceneByName', function(name, callback) {
        hub.db.mediaScenes.findOne({name: name}, callback);
    });

    socket.on('deleteScene', function(sceneId, callback) {
        hub.db.mediaScenes.remove(idSearch(sceneId), function(err) {
            if (callback) {
                callback(err);    
            }
        });
    });

    socket.on('subScene', function(sceneId, callback) {
        _findScene(sceneId, function(err, scene) {
            socket.join(sceneId);
            
            if (callback) {
                callback(err, scene);    
            } 
        });
    });

    socket.on('unsubScene', function(sceneId, callback) {
        _findScene(sceneId, function(err, scene) {
            socket.leave(sceneId); 
            if (callback) {
                callback(err);
            }
        });
    });

    socket.on('sendCommand', function(roomId, commandName, commandValue) {
        io.to(roomId).emit('command', {name: commandName, value: commandValue});
    });

    socket.on('register', function(roomId) {
        socket.join(roomId);
    });
}

var Hub = function(config) {
    this.config = config;
    this.db = mongo.connect(config.mongo, ['mediaScenes', 'sessions']);
    session.setClient(this.db);
};

Hub.prototype.listen = function(callback) {
    var self = this,
        app = express(),
        server = http.Server(app),
        io = new Server(server);

    this.server = server;

    app.use(cors());

    // require a valid session token for all api calls
    var validateSession =  function(req, res, next) {
        session.find(req.query.token, function(err, data) {
            if (err || ! data) {
                res.sendStatus(401);
            } else {
                next();
            }
        });
    };

    // allow cross origin requests
    io.set('origins', '*:*');
    io.sockets.on('connection', function (socket) {
        var disconnectTimer = setTimeout(function() {
            socket.disconnect();
        }, 10000);

        socket.on('auth', function (creds, callback) {
 
            function succeed (record) {
                addApiCalls(self, io, socket);
                clearTimeout(disconnectTimer);
                callback(null, record._id.toString());
            }

            function fail (msg) {
                callback(msg);
                socket.disconnect();
            }

            if (creds.hasOwnProperty('password') && creds.password && creds.password !== '') {
                if ( bcrypt.compareSync(creds.password, self.config.secret) ) {
                    session.create(throwErr(succeed));
                } else {
                    fail('Invalid Password');
                }

            } else if (creds.hasOwnProperty('token') && creds.token && creds.token !== '') {
                session.find(creds.token, function(err, data) {
                        if (data) {
                            succeed(data);
                        } else {
                            fail('Invalid Token'); 
                        }
                    });
            } else {
                fail('Password must be provided');
            }  
        });
        
    });

    server.listen(self.config.port, callback);
};

Hub.prototype.close = function(cb) {
    this.server.close(cb);   
};

module.exports = { 
    createHub: function(mongoUrl) {
        return new Hub(mongoUrl);
    }
};
