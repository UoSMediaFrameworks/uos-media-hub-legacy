"use strict";
var _ = require('lodash');
var mongo = require('mongojs');
var async = require('async');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes']);

var cleanedExternalDeps = require('./processed_and_downloaded_external_deps.json');

var updateMediaSceneStyle = function(validAsset, cb) {

    var sceneIds = _.map(validAsset.asset.sceneIds, function(id) {
        return mongo.ObjectId(id);
    });

    var assetStoreUpload = JSON.parse(validAsset.assetStoreResult);

    var query = { _id: { "$in": sceneIds}};

    db.mediaScenes.find(query, function(err, scenes) {
        if(err) cb(err, null);
        else {
            async.every(scenes, function(scene, callback) {
                var styleTag = scene.style;
                for (var styleKey in styleTag) {
                    if(styleTag.hasOwnProperty(styleKey)) {
                        console.log(validAsset.asset);
                        if(styleTag[styleKey].indexOf(validAsset.asset.url) !== -1) {
                            styleTag[styleKey] = styleTag[styleKey].replace(validAsset.asset.url, assetStoreUpload.url);
                        }
                    }
                }

                var query = { _id: scene._id};
                var update = { $set: {'style': styleTag}};
                db.mediaScenes.update(query, update, callback);
            }, function(err, results) {
                cb(err, results);
            });
        }
    });
};

var tasks = _.map(cleanedExternalDeps, function(validAssetToDownload){
    return updateMediaSceneStyle.bind(null, validAssetToDownload);
});

// APEP allow 5 downloads at a time
async.parallelLimit(tasks, 5, function(err, results) {
    if(err) throw err;
    console.log("DONE");
    // console.log("results: ", results);
    process.exit(1);
});