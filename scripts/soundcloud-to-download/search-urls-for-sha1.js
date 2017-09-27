"use strict";

// APEP simple helper script, given a list of URLS, check to see any sha1 hash of the URLs matches a candidate.
// Source: soundcloud conversion work - this is a helper script only.

var _ = require('lodash');
var sha1 = require('sha1');

var urlHash = "e686074f4551408280800302840a91aed01e432a";

var records = require('./scene_soundcloud_records.json');

_.forEach(records, function(sceneRecord) {
    _.forEach(sceneRecord.sceneSoundCloudMediaObjects, function(amob){
        if(sha1(amob.url) === urlHash) {
            console.log(amob.url);
        }
    });
});