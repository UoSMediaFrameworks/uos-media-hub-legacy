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

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes']);

var gdcGroups = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
var narmGroups = [112];

function mediaFileExists(url, cb) {
    var filePath = url.replace(CDN_BASE_URL, CDN_FS_BASE_DIR);

    fs.stat(filePath, function(err, stat) {
        if(!err) {
            cb(null, true);
        } else if(err.code === 'ENOENT') {
            cb(null, false);
        } else {
            cb(err, false);
        }
    });
}

var CDN_FS_BASE_DIR = "/var/cdn";
var CDN_BASE_URL = "http://mediaframework:8090";

db.mediaScenes.find({"_groupID": { "$in": gdcGroups}}, function(err, scenes) {

    if(err) throw err;

    var goodUrls = {};
    var errorUrls = [];
    var externalMedia = [];

    async.everyLimit(scenes, 2, function(scene, callback) {

        var allMediaAssets = _.filter(scene.scene, function(media) {
            return (media.type === "image" || media.type === "video" || media.type === "audio") && media.url;
        });

        var externalMediaRemaining = _.filter(allMediaAssets, function(media){
            return media.url.indexOf('mediaframework:8090') === -1;
        });

        // APEP rather than a list of lists, lets just push the single mos
        _.forEach(externalMediaRemaining, function(mo){
            externalMedia.push(mo);
        });

        var internalMediaRemaining =_.filter(allMediaAssets, function(media){
            return media.url.indexOf('mediaframework:8090') !== -1;
        });

        async.everyLimit(internalMediaRemaining, 4, function(mob, cb) {
            mediaFileExists(mob.url, function(err, exists) {
                if(err) {
                    errorUrls.push({
                        sceneId: scene._id,
                        imoId: mob._id,
                        url: mob.url,
                        type: "ERROR",
                        err: err
                    });
                } else if (!exists) {
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
                cb(null, true);
            });
        }, function(err, results) {
            callback(err, results);
        });
    }, function(err, results){
        async.parallel([
            function(cb) {
                fs.writeFile('./confirm-all-scene-json-urls-using-cdn-fs/internal-media.json', JSON.stringify(goodUrls), 'utf8', function(){
                    console.log("internal-media.json file created");
                    cb();
                });
            },
            function(cb) {
                fs.writeFile('./confirm-all-scene-json-urls-using-cdn-fs/missing-internal-media.json', JSON.stringify(errorUrls), 'utf8', function(){
                    console.log("missing-internal-media.json file created");
                    cb();
                });
            },
            function(cb) {
                fs.writeFile('./confirm-all-scene-json-urls-using-cdn-fs/media-still-external.json', JSON.stringify(externalMedia), 'utf8', function(){
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