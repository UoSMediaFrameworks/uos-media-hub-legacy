'use strict';

var config = require('./config'),
    accessKey = config.secret,
    bcrypt = require('bcrypt-nodejs'),
    Server = require('socket.io'),
    express = require('express'),
    http = require('http'),
    path = require('path');

var Hub = function() {

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
                socket.on('list', function() {

                });
                
                socket.on('saveScene', function(sceneData, callback) {
                    console.log(sceneData);
                    callback(true);
                });

                callback(true);
            } else {
                callback(false);
                socket.disconnect();
            }
        });

        if (! self.disableDisconnectTimeout) {
            setTimeout(function() {
                if (! authed) {
                    socket.disconnect();
                }
            }, 3000);
        }
    });
};

Hub.prototype.close = function(cb) {
    this.server.close(cb);   
};

module.exports = { 
    createHub: function(disableDisconnectTimeout) {
        var h = new Hub();
        h.disableDisconnectTimeout = disableDisconnectTimeout;
        return h;
    }
};
