"use strict";

var mongo = require('mongojs');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');

function processScene(db, BLOB_STORAGE_HOST, sceneId) {
    db.mediaScenes.findOne({"_id": mongo.ObjectId(sceneId)}, function(err, scene){
        if(err) throw err;

        var images = [];
        var videos = [];

        _.forEach(scene.scene, function(mo){
            if(mo.type === "video" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                videos.push(mo);

            } else if(mo.type === "image" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                images.push(mo);
            }
        });

        collectVideoMediaObjects(db, videos);
        collectImageMediaObjects(db, images);
    });
}

function processSceneWithCallback(db, BLOB_STORAGE_HOST, sceneId, writeToFile, done) {
    db.mediaScenes.findOne({"_id": mongo.ObjectId(sceneId)}, function(err, scene){
        if(err) throw err;

        var images = [];
        var videos = [];

        _.forEach(scene.scene, function(mo){
            if(mo.type === "video" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                videos.push(mo);

            } else if(mo.type === "image" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                images.push(mo);
            }
        });

        async.parallel([
                function(callback) {
                    collectVideoMediaObjects(db, videos, writeToFile, callback);
                },
                function(callback) {
                    collectImageMediaObjects(db, images, writeToFile, callback);
                }
            ],
            // optional callback
            function(err, results) {
                done(err, results);
            });
    });
}

function collectImageMediaObjects(db, images, writeToFile, cb) {
    var imageMediaIds = [];
    _.forEach(images, function(imo) {

        // console.log("mo: ", imo);

        var partUrlForImage = imo.url.replace("https://uosassetstore.blob.core.windows.net/assetstoredev/", "");
        var urlSplit = partUrlForImage.split("/");
        var imoId = urlSplit[0];
        imageMediaIds.push(mongo.ObjectId(imoId));
    });

    collectImageMediaObjectsFromDb(db, imageMediaIds, writeToFile, cb);
}

function collectImageMediaObjectsFromDb(db, imoIds, writeToFile, cb) {
    db.imagemediaobjects.find({"_id": { "$in": imoIds}}, function(err, imos){
        if(err) {
            if(cb) {
                cb(true, null);
            } else {
                throw err;
            }
        }

        // console.log("imos: ", imos);

        if(writeToFile) {
            fs.writeFile('media-download-for-local/image-media-objects-for-download.json', JSON.stringify(imos), 'utf8', function() {
                console.log("imos - record file created");

                if(cb) {
                    cb(null, true);
                }
            });
        } else {
            cb(null, imos);
        }

    });
}

function collectVideoMediaObjects(db, videos, writeToFile, cb) {

    var videoMediaIds = [];
    _.forEach(videos, function(vmo) {

        // APEP ensure that it is in the raw folder... some media seems to have gone in the wrong bucket, we really need to resolve this
        if(vmo.url.indexOf("assetstoredev/video/raw") !== -1) {
            var videoUrlWithoutHostAndFileSystem = vmo.url.replace("https://uosassetstore.blob.core.windows.net/assetstoredev/video/raw/", "");
            var urlSplit = videoUrlWithoutHostAndFileSystem.split("/");
            var vmoId = urlSplit[0];
            videoMediaIds.push(mongo.ObjectId(vmoId));
        }
    });

    // console.log("videoMediaIds: ", videoMediaIds);

    collectVideoMediaObjectsFromDb(db, videoMediaIds, writeToFile, cb);
}

function collectVideoMediaObjectsFromDb(db, vmoIds, writeToFile, cb) {
    db.videomediaobjects.find({"_id": { "$in": vmoIds}}, function(err, vmos){
        if(err) {
            if(cb) {
                cb(true, null);
            } else {
                throw err;
            }
        }

        // console.log("vmos: ", vmos);

        if(writeToFile) {
            fs.writeFile('media-download-for-local/video-media-objects-for-download.json', JSON.stringify(vmos), 'utf8', function() {
                console.log("vmos - record file created");

                if(cb) {
                    cb(null, true);
                }
            });
        } else {
            cb(null, vmos);
        }
    });
}

module.exports = {
    processScene: processScene,
    processSceneWithCallback: processSceneWithCallback
};