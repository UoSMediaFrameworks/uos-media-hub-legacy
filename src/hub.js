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
var shortid = require('shortid');

function getDateForLog() {
    return new Date();
}

function throwErr (func) {
    return function(err, data) {
        if (err) {
            throw err;  
        } else {
            func.call(null, data);
        }
    };
}

function validateScene (sceneData) {
    // convert _id so mongo recognizes it
    if (sceneData.hasOwnProperty('_id')) {
        sceneData._id = mongo.ObjectId(sceneData._id);
    }

    // add _ids to all mediaObjects
    if (sceneData.hasOwnProperty('scene')) {
        if (! Array.isArray(sceneData.scene) ) {
            throw new Error('"scene" property must be an array of objects');
        } else {
            sceneData.scene.forEach(function(mediaObject) {
                if (! mediaObject.hasOwnProperty('_id')) {
                    mediaObject._id = mongo.ObjectId();
                }
            });   
        }
    }

    return sceneData;
}

function validateSceneGraph (sceneGraphData) {
    //convert _id so mongo recognizes it
    if (sceneGraphData.hasOwnProperty('_id')) {
        sceneGraphData._id = mongo.ObjectId(sceneGraphData._id);
    }

    //TODO most likely more detailed validation can occur

    return sceneGraphData;
}

function checkPasswordKeyAndGetGroup (password, config) {

    try {
        //AJF: Compares the passwords and determines what group the user logging into belongs to
        if ( bcrypt.compareSync(password, config.secret) ) {
            return 0;
        } else if (bcrypt.compareSync(password, config.secret_1)) {
            return 1;
        } else if (bcrypt.compareSync(password, config.secret_2)) {
            return 2;
        } else if (bcrypt.compareSync(password, config.secret_101)) {
            return 101;
        } else if (bcrypt.compareSync(password, config.secret_102)) {
            return 102;
        } else if (bcrypt.compareSync(password, config.secret_103)) {
            return 103;
        } else if (bcrypt.compareSync(password, config.secret_104)) {
            return 104;
        } else if (bcrypt.compareSync(password, config.secret_105)) {
            return 105;
        } else if (bcrypt.compareSync(password, config.secret_106)) {
            return 106;
        } else if (bcrypt.compareSync(password, config.secret_107)) {
            return 107;
        } else if (bcrypt.compareSync(password, config.secret_108)) {
            return 108;
        } else if (bcrypt.compareSync(password, config.secret_109)) {
            return 109;
        } else if (bcrypt.compareSync(password, config.secret_110)) {
            return 110;
        } else if (bcrypt.compareSync(password, config.secret_111)) {
            return 111;
        } else if (bcrypt.compareSync(password, config.secret_112)) {
            return 112;
        } else if (bcrypt.compareSync(password, config.secret_113)) {
            return 113;
        } else if (bcrypt.compareSync(password, config.secret_114)) {
            return 114;
        } else if (bcrypt.compareSync(password, config.secret_115)) {
            return 115;
        } else if (bcrypt.compareSync(password, config.secret_116)) {
            return 116;
        }

        // APEP if we haven't found a group, we must return nothing found
        return -1;
    } catch (e) {
        console.log("Error trying to find group and password lookup");
        return -1;
    }
}

function adminApiCalls(hub, io, socket, session) {

    socket.on('authProvider', function (creds, callback) {

        console.log("AuthProvider - received creds: ", creds);

        //APEP: param record - session object from db
        function succeed (record) {
            var roomId = shortid.generate(); // APEP: generate a user friendly shortid for roomID for graph and player to communicate
            return callback(null, record._id.toString(), roomId, record._groupID.toString());
        }

        if (creds.hasOwnProperty('password') && creds.password && creds.password !== '') {
            //AJF: Compares the passwords and determines what group the user logging into belongs to
            var userGroup = checkPasswordKeyAndGetGroup(creds.password, hub.config);

            if ( userGroup !== -1 ) {
                session.create(userGroup, function(err, data){
                    if (data) {
                        succeed(data);
                    } else {
                        return callback(err);
                    }
                });
            } else {
                console.log("AuthProvider - calling back invalid password - not found");
                return callback('Invalid Password', null, null, null);
            }
        } else if (creds.hasOwnProperty('token') && creds.token && creds.token !== '') {
            console.log("AuthProvider - Finding session via token");
            session.find(creds.token, function(err, data) {
                if (data) {
                    succeed(data);
                } else {
                    return callback('Invalid Token', null, null, null);
                }
            });
        } else {
            return callback('Password must be provided', null, null, null);
        }

    });
}

function addApiCalls (hub, io, socket) {
    function idSearch (id) {
        return {_id: mongo.ObjectId(id)};
    }

    function _findScene (sceneId, cb) {
        console.log(getDateForLog() + " - hub.js - _findScene");
        return hub.db.mediaScenes.findOne(idSearch(sceneId), cb);
    }

    function _findSceneGraph(sceneGraphId, cb) {
        console.log(getDateForLog() + " - hub.js - _findSceneGraph");
        return hub.db.mediaSceneGraphs.findOne(idSearch(sceneGraphId), cb);
    }

    function _findSceneList(cb) {
        _findSceneListWithGroupId(socket.groupID, cb);
    }

    function _findSceneListWithGroupId(groupId, cb) {
        console.log(getDateForLog() + " - hub.js - listScenes groupId: " + groupId);

        try {
            groupId = parseInt(groupId);
        } catch (e) {
            return cb(true, null);
        }

        //AJF: if the groupID is 0 (admin) then list all scenes
        if(groupId === 0) {
            hub.db.mediaScenes.find({'$query': {}, '$orderby': {name: 1}}, {name: 1, _groupID: 2}, cb);
        } else {
            hub.db.mediaScenes.find({'$query': {_groupID: groupId}, '$orderby': {name: 1}}, {name: 1, _groupID: 2}, cb);
        }
    }

    // APEP Support listing scenes given a groupID, this is for controllers who use this API as an admin socket.
    // This is the reason for the additional call, an admin socket must be able to give the groupID for its client socket.
    socket.on('listScenesForGroup', _findSceneListWithGroupId);

    socket.on('listScenes', _findSceneList);

    socket.on('listSceneGraphs', function(callback) {
        console.log(getDateForLog() + " - hub.js - listSceneGraphs");
        hub.db.mediaSceneGraphs.find({'$query': {}}, callback);
    });
    
    socket.on('saveScene', function(sceneData, callback) {
        console.log(getDateForLog() + " - hub.js - listSceneGraphs");

        try {
            var data = validateScene(sceneData);

            console.log(getDateForLog() + " - hub.js - saveScene after validation: ", data);

			//AJF: sanity check to stop client side CTRL+Z bug blank scene reaching the db
			if(data.hasOwnProperty('themes') || data.hasOwnProperty('style') || data.hasOwnProperty('scene')) {
				console.log("Valid");
			
                //AJF: save the groupID acquired from the socket if the groupID isn't already set
                console.log(getDateForLog() + " - hub.js - saveScene data._groupID: " + data._groupID);

                if(!data._groupID) {
                    console.log(getDateForLog() + " - hub.js - saveScene data._groupID not set so setting to: " + socket.groupID);
                    data._groupID = socket.groupID;
                }


                hub.db.mediaScenes.save(data, function(err, scene) {
                    io.to(scene._id.toString()).emit('sceneUpdate', scene);

                    if (callback) {
                        callback(err, scene);
                    }
                });
			}
        } catch(err) {
            if (callback) {
                callback(err.message);
            }
        }
    });

    socket.on('saveSceneGraph', function(sceneGraphData, callback) {
        try {
            console.log(getDateForLog() + " - hub.js - saveSceneGraph");

            var data = validateSceneGraph(sceneGraphData);

            hub.db.mediaSceneGraphs.save(data, function(err, sceneGraph) {
                io.to(sceneGraph._id.toString()).emit('sceneGraphUpdate', sceneGraph);

                if (callback) {
                    callback(err, sceneGraph);
                }
            });

        } catch(err) {
            if(callback) {
                callback(err.message);
            }
        }
    });

    socket.on('loadScene', _findScene);

    socket.on('loadSceneGraph', _findSceneGraph);
    
    socket.on('loadSceneByName', function(name, callback) {

        console.log(getDateForLog() + " - hub.js - loadSceneByName");

        hub.db.mediaScenes.findOne({name: name}, callback);
    });

    socket.on('deleteScene', function(sceneId, callback) {

        console.log(getDateForLog() + " - hub.js - deleteScene");

        hub.db.mediaScenes.remove(idSearch(sceneId), function(err) {
            if (callback) {
                callback(err);    
            }
        });
    });

    socket.on('deleteSceneGraph', function(sceneGraphId, callback){

        console.log(getDateForLog() + " - hub.js - deleteSceneGraph");

        hub.db.mediaSceneGraphs.remove(idSearch(sceneGraphId), function(err){
            if(callback) {
                callback(err);
            }
        });
    });

    socket.on('subScene', function(sceneId, callback) {

        console.log(getDateForLog() + " - hub.js - subScene");

        _findScene(sceneId, function(err, scene) {
            socket.join(sceneId);
            
            if (callback) {
                callback(err, scene);    
            } 
        });
    });

    socket.on('unsubScene', function(sceneId, callback) {

        console.log(getDateForLog() + " - hub.js - unsubScene");

        _findScene(sceneId, function(err, scene) {
            socket.leave(sceneId); 
            if (callback) {
                callback(err);
            }
        });
    });

    socket.on('sendCommand', function(roomId, commandName, commandValue) {


        console.log(getDateForLog() + " - hub.js - sendCommand: ", {
            roomId: roomId,
            commandName: commandName,
            commandValue: commandValue
        });

        io.to(roomId).emit('command', {name: commandName, value: commandValue});
    });

    socket.on('register', function(roomId) {

        roomId = roomId.replace("/#", "");

        console.log(getDateForLog() + " - hub.js - REGISTER TO ROOM: ", roomId);

        socket.join(roomId);
    });
}

var Hub = function(config) {
    this.config = config;
    this.db = mongo.connect(config.mongo, ['mediaScenes', 'sessions', 'mediaSceneGraphs']);
    session.setClient(this.db);
};

Hub.prototype.listen = function(callback) {
    var self = this,
        app = express(),
        server = http.Server(app),
        io = new Server(server);

    this.server = server;

    app.use(cors());

    // allow cross origin requests
    io.set('origins', '*:*');
    io.sockets.on('connection', function (socket) {

        var disconnectTimer = setTimeout(function() {
            socket.disconnect();
        }, 10000);

        socket.on('auth', function (creds, callback) {

            //APEP: param record - session object from db
            function succeed (record) {

                socket.groupID = record._groupID; //AJF: set the groupID on the socket to be used in further local calls
                addApiCalls(self, io, socket); //APEP: attach all the socket listeners
                //APEP: for admin sockets, we can provide some additional socket listeners
                if(record._groupID === 0) {
                    adminApiCalls(self, io, socket, session);
                }
                clearTimeout(disconnectTimer); //APEP: ensure we stop the fail safe of closing an unauthenticated socket
                var roomId = shortid.generate(); // APEP: generate a user friendly shortid for roomID for graph and player to communicate

                console.log("auth - suceed - calling back:");
                // APEP logging and test if callback exists - used due to error in android platform
                if(callback)
                    callback(null, record._id.toString(), roomId, record._groupID.toString());//AJF: try to return the groupID...
            }

            function fail (msg) {
                callback(msg);
                socket.disconnect();
            }

            if (creds.hasOwnProperty('password') && creds.password && creds.password !== '') {
                //AJF: Compares the passwords and determines what group the user logging into belongs to
                var userGroup = checkPasswordKeyAndGetGroup(creds.password, self.config);

                if ( userGroup !== -1 ) {
                    session.create(userGroup, throwErr(succeed));
                } else {
                    fail('Invalid Password');
                }

            } else if (creds.hasOwnProperty('token') && creds.token && creds.token !== '') {
                console.log("Finding session via token");
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
