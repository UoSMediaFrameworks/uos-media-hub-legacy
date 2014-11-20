'use strict';

var config = require('./config'),
    accessKey = config.secret,
    bcrypt = require('bcrypt-nodejs'),
    Server = require('socket.io'),
    express = require('express'),
    http = require('http'),
    path = require('path'),
    mongo = require('mongojs');

var Hub = function(mongoUrl) {
    this.db = mongo.connect(mongoUrl, ['mediaScenes']);
};


Hub.prototype.listen = function(port, callback) {
    var self = this,
        app = express(),
        server = http.Server(app),
        io = new Server(server);

    server.listen(port, callback);

    this.server = server;

    // serve up the API library
    app.get('/hub-api.js', function(req, res) {
        res.sendFile(path.resolve(__dirname + '/../public/hub-api.js'));
    });


    io.sockets.on('connection', function (socket) {
        var authed = false;
        socket.on('auth', function (secret, callback) {
            authed = bcrypt.compareSync(secret, accessKey);

            if (authed) {
                // enable other api handlers
                socket.on('listScenes', function(callback) {
                    self.db.mediaScenes.find({}, {name: 1}, function(err, sceneNames) {
                        if (err) {
                            callback(false);
                        } else {
                            callback(sceneNames);
                        }
                    });
                });
                
                socket.on('saveScene', function(sceneData, callback) {
                    self.db.mediaScenes.save(sceneData, callback);
                });

                socket.on('loadScene', function(sceneName, callback) {
                    self.db.mediaScenes.find({name: sceneName}, function(err, scenes) {

                    });
                });

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
