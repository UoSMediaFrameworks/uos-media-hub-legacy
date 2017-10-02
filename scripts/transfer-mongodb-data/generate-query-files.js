'use strict';

var _ = require('lodash');
var mongo = require('mongojs');
var ObjectId = mongo.ObjectId;
var fs = require('fs');
var async = require('async');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require("path");
var sha1 = require('sha1');
var recursive = require("recursive-readdir");

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes', 'imagemediaobjects', 'videomediaobjects', 'audiomediaobjects']);

var gdcGroups = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];

var narmGroups = [112];

// APEP Questionable choice to cache all the database values here.  We could run a query per URL which is most likely the better solution.
async.parallel({
    "audio": function(callback){
        db.audiomediaobjects.find({}, callback);
    },
    "video": function(callback){
        db.videomediaobjects.find({}, callback);
    },
    "image": function(callback){
        db.imagemediaobjects.find({}, callback);
    },
    "scenes": function(callback) {
        db.mediaScenes.find({"_groupID": { "$in": gdcGroups}}, callback);
    }
}, function(err, results) {

    if(err) throw err;

    var audioMediaObjects = results.audio;
    var imageMediaObjects = results.image;
    var videoMediaObjects = results.video;
    var mediaScenes = results.scenes;

    var amoIds = [];
    var imoIds = [];
    var vmoIds = [];

    function checkSceneMediaUrlForDatabaseRecord(databaseValues, media, type, cacheCollection){
        if(media.url) {
            var linkedObjects = _.filter(databaseValues, function(mo){
                return mo[type].url === media.url;
            });


            // APEP this is most likely a redundant check
            if(linkedObjects.length === 1) {
                // APEP We cannot use _id here, the ID query requires ObjectId("id"), this is not valid JSON.
                // APEP wrapping the whole thing in a string, or single quotes does not fix the issue
                cacheCollection.push(linkedObjects[0][type].url);
            } else if(linkedObjects.length > 1) {
                console.log(`ERR more than one linked object ${linkedObjects.length}, ${media.url}`);

            }
        }
    }

    _.forEach(mediaScenes, function(mediaScene) {
        _.forEach(mediaScene.scene, function(media) {
            checkSceneMediaUrlForDatabaseRecord(audioMediaObjects, media, "audio", amoIds);
            checkSceneMediaUrlForDatabaseRecord(imageMediaObjects, media, "image", imoIds);
            checkSceneMediaUrlForDatabaseRecord(videoMediaObjects, media, "video", vmoIds);
        });
    });

    var mediaScenesQueryForFile = {"_groupID": { "$in": gdcGroups}};
    var amoQueryForFile = {"audio.url": {"$in":amoIds }};
    var imoQueryForFile = {"image.url": {"$in":imoIds }};
    var vmoQueryForFile = {"video.url": {"$in":vmoIds }};

    async.parallel([
        function(cb){
            fs.writeFile("./scripts/transfer-mongodb-data/media-scenes-query.json", JSON.stringify(mediaScenesQueryForFile), 'utf8', cb);
        },
        function(cb){
            fs.writeFile("./scripts/transfer-mongodb-data/amos-query.json", JSON.stringify(amoQueryForFile), 'utf8', cb);
        },
        function(cb){
            fs.writeFile("./scripts/transfer-mongodb-data/imos-query.json", JSON.stringify(imoQueryForFile), 'utf8', cb);
        },
        function(cb){
            fs.writeFile("./scripts/transfer-mongodb-data/vmos-query.json", JSON.stringify(vmoQueryForFile), 'utf8', cb);
        }
    ], function(err, results){

        console.log("Query Files written to disk");

        process.exit(1);
    });
});

//     var mediaScenesQueryForFile = {"_groupID": { "$in": gdcGroups}};
