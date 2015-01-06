'use strict';

var bcrypt = require('bcrypt-nodejs'),
    Server = require('socket.io'),
    express = require('express'),
    http = require('http'),
    path = require('path'),
    mongo = require('mongojs');

var session = require('./session');

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
        hub.db.mediaScenes.find({'$query': {}, '$orderby': {name: 1}}, {name: 1}, function(err, sceneNames) {
            if (err) {
                callback([]);
            } else {
                callback(sceneNames);
            }
        });
    });
    
    socket.on('saveScene', function(sceneData, callback) {
        // convert _id so mongo recognizes it
        if (sceneData.hasOwnProperty('_id')) {
            sceneData._id = mongo.ObjectId(sceneData._id);
        }

        hub.db.mediaScenes.save(sceneData, function(err, scene) {
            io.to(scene._id.toString()).emit('sceneUpdate', scene);
            callback(err, scene);
        });
    });

    socket.on('loadScene', _findScene);

    socket.on('deleteScene', function(sceneId, callback) {
        hub.db.mediaScenes.remove(idSearch(sceneId), function(err) {
            callback(err);
        });
    });

    socket.on('subScene', function(sceneId, callback) {
        _findScene(sceneId, function(err, scene) {
            socket.join(sceneId); 
            callback(err, scene);
        });
    });

    socket.on('unsubScene', function(sceneId, callback) {
        _findScene(sceneId, function(err, scene) {
            socket.leave(sceneId); 
            callback(err);
        });
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

    server.listen(self.config.port, callback);

    this.server = server;

    io.sockets.on('connection', function (socket) {
        var disconnectTimer = setTimeout(function() {
            socket.disconnect();
        }, 10000);

        socket.on('auth', function (creds, callback) {
 
            function respond (record) {
                if (record) {
                    addApiCalls(self, io, socket);
                    clearTimeout(disconnectTimer);
                    callback(record._id.toString());
                } else {
                    callback(false);
                    socket.disconnect();
                }
            }

            if (creds.hasOwnProperty('password')) {
                if ( bcrypt.compareSync(creds.password, self.config.secret) ) {
                    session.create(throwErr(respond));
                } else {
                    respond();
                }

            } else if (creds.hasOwnProperty('token')) {
                session.find(creds.token, throwErr(respond));
            } else {
                respond();
            }  
        });

    
        
        
    });
};

Hub.prototype.close = function(cb) {
    this.server.close(cb);   
};

module.exports = { 
    createHub: function(mongoUrl) {
        return new Hub(mongoUrl);
    }
};
