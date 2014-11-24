'use strict';

var bcrypt = require('bcrypt-nodejs'),
    Server = require('socket.io'),
    express = require('express'),
    http = require('http'),
    path = require('path'),
    mongo = require('mongojs');

function addApiCalls (hub, socket) {
    socket.on('listScenes', function(callback) {
        hub.db.mediaScenes.find({}, {name: 1}, function(err, sceneNames) {
            if (err) {
                callback(false);
            } else {
                callback(sceneNames);
            }
        });
    });
    
    socket.on('saveScene', function(sceneData, callback) {
        hub.db.mediaScenes.save(sceneData, callback);
    });

    socket.on('loadScene', function(sceneId, callback) {
        hub.db.mediaScenes.findOne({_id: mongo.ObjectId(sceneId)}, callback);
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
        socket.on('auth', function (secret, callback) {
            authed = bcrypt.compareSync(secret, self.config.secret);

            if (authed) {
                addApiCalls(self, socket);
                callback(true);
            } else {
                callback(false);
                socket.disconnect();
            }
        });

    
        setTimeout(function() {
            if (! authed) {
                socket.disconnect();
            }
        }, 3000);
        
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
