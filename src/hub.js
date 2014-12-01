'use strict';

var bcrypt = require('bcrypt-nodejs'),
    Server = require('socket.io'),
    express = require('express'),
    http = require('http'),
    path = require('path'),
    mongo = require('mongojs');

var hat = require('hat');

var _validTokens = {};

function addApiCalls (hub, io, socket) {

    function _findScene (sceneId, cb) {
        var search = {_id: mongo.ObjectId(sceneId)};
        return hub.db.mediaScenes.findOne(search, cb);
    }

    socket.on('listScenes', function(callback) {
        hub.db.mediaScenes.find({}, {name: 1}, function(err, sceneNames) {
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
    this.db = mongo.connect(config.mongo, ['mediaScenes']);
};

Hub.prototype.listen = function(callback) {
    var self = this,
        app = express(),
        server = http.Server(app),
        io = new Server(server);

    server.listen(self.config.port, callback);

    this.server = server;

    io.sockets.on('connection', function (socket) {
        var authed = false;
        var returnToken;
        socket.on('auth', function (creds, callback) {
            if (creds.hasOwnProperty('password')) {
                authed = bcrypt.compareSync(creds.password, self.config.secret);    
            } else if (creds.hasOwnProperty('token')) {
                returnToken = creds.token;
                authed = _validTokens.hasOwnProperty(returnToken);
            }
            
            if (authed) {
                addApiCalls(self, io, socket);
                
                if (! returnToken) {
                    returnToken = hat();
                    _validTokens[returnToken] = null;
                }
                
                callback(returnToken);
            } else {
                callback(false);
                socket.disconnect();
            }
        });

    
        setTimeout(function() {
            if (! authed) {
                socket.disconnect();
            }
        }, 10000);
        
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
