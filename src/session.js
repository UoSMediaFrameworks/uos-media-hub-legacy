'use strict';

var mongo = require('mongojs');

var _client,
    _sessions;

function requireClient (func) {
    return function() {
        if (! _client) {
            throw new Error('client must be set via session.setClient before calling ' + func.name);
        } else {
            func.apply(null, arguments);
        }
    };
}

module.exports = {
    setClient: function(client) {
        _client = client;
        _sessions = _client.sessions;
    },

    create: requireClient(function create(cb) {
        _sessions.save({created: new Date()}, cb);
    }),

    find: requireClient(function find(id, cb) {
        // some object ids might be invalid so ignore errors from there
        try {
            var search = {_id: new mongo.ObjectId(id)};    
            return _sessions.findOne(search, cb);
        } catch(err) {
            cb(null, null);
        }
    })
};