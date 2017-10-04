'use strict';

var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');
var async = require('async');
var fs = require('fs');
var path = require("path");
var sha1 = require('sha1');
var recursive = require("recursive-readdir");
var request = require('request');
var urlExists = require('url-exists');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes']);

var gdcGroups = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
var narmGroups = [112];

db.mediaScenes.find({"_groupID": { "$in": gdcGroups}}, function(err, scenes) {

    if(err) throw err;

    var goodUrls = {};
    var errorUrls = [];
    var externalMedia = [];

    async.every(scenes, function(scene, callback) {

        var allMediaAssets = _.filter(scene.scene, function(media) {
            return media.type === "image" || media.type === "video" || media.type === "audio";
        });

        var externalMediaRemaining = _.filter(allMediaAssets, function(media){
            return media.url.indexOf('mediaframework:8090') === -1;
        });
        externalMedia.push(externalMediaRemaining);

        var internalMediaRemaining =_.filter(allMediaAssets, function(media){
            return media.url.indexOf('mediaframework:8090') !== -1;
        });

        async.every(internalMediaRemaining, function(mob, cb) {
            urlExists(mob.url, function(err, exists) {
                if(err || !exists) {
                    errorUrls.push({
                        sceneId: scene._id,
                        imoId: mob._id,
                        url: mob.url,
                        type: "MISSING"
                    });
                } else {
                    if (goodUrls.hasOwnProperty(mob.url)) {
                        goodUrls[mob.url] += 1;
                    } else {
                        goodUrls[mob.url] = 1;
                    }
                }
                cb(err, true);
            });
        }, function(err, results) {
            callback(err, results);
        });
    }, function(err, results){
        async.parallel([
            function(cb) {
                fs.writeFile('./confirm-all-scene-json-urls/internal-media.json', JSON.stringify(goodUrls), 'utf8', function(){
                    console.log("internal-media.json file created");
                    cb();
                });
            },
            function(cb) {
                fs.writeFile('./confirm-all-scene-json-urls/missing-internal-media.json', JSON.stringify(errorUrls), 'utf8', function(){
                    console.log("missing-internal-media.json file created");
                    cb();
                });
            },
            function(cb) {
                fs.writeFile('./confirm-all-scene-json-urls/media-still-external.json', JSON.stringify(externalMedia), 'utf8', function(){
                    console.log("media-still-external.json file created");
                    cb();
                });
            }
        ], function(err, results) {
            console.log("DONE");
            process.exit(1);
        });
    });
});