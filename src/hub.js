var config = require('./config'),
    accessKey = config.secret,
    bcrypt = require('bcrypt'),
    Server = require('socket.io'),
    express = require('express'),
    http = require('http'),
    path = require('path');

var hubPrototype = {
    listen: function(port, callback) {
        var app = express(),
            server = http.Server(app),
            io = new Server(server);

        server.listen(port, callback);
        console.log('hub listening on port ' + port);

        this.server = server;

        // serve up the API library
        app.get('/hub-api.js', function(req, res) {
            res.sendFile(path.resolve(__dirname + '/../public/hub-api.js'));
        });


        io.sockets.on('connection', function (socket) {
            var authed = false;
            socket.on('auth', function (secret, callback) {
                authed = bcrypt.compareSync(secret, accessKey);

                callback(authed);


                if (authed) {
                    // enable other api handlers
                    socket.on('list', function() {

                    });

                    
                    
                    socket.on('ping', function() {
                        socket.emit('pong');
                    });
                } else {
                    socket.disconnect();
                }
            });

            setTimeout(function() {
                if (! authed) {
                    socket.disconnect();
                }
            }, 3000);
        });
    },
    close: function(callback) {
        this.server.close(callback);
    }
};

module.exports = { 
    createHub: function() {
        return Object.create(hubPrototype);
    }
};
