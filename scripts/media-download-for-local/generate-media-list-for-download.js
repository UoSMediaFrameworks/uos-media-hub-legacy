/**
 * Created by aaronphillips on 24/03/2017.
 */
'use strict';

// APEP : RUN SCRIPT WITHIN SCRIPTS DIRECTORY (ie cd /scripts)

var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes', 'imagemediaobjects', 'videomediaobjects']);

const BLOB_STORAGE_HOST = "uosassetstore.blob.core.windows.net";

var sceneId = "58d2e9a5595a37c8a76cdfe8";

processScene();

function processScene() {
    db.mediaScenes.findOne({"_id": mongo.ObjectId(sceneId)}, function(err, scene){
        if(err) throw err;

        var images = [];
        var videos = [];

        _.forEach(scene.scene, function(mo){
            if(mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {

                if(mo.type === "video") {
                    videos.push(mo);
                } else if(mo.type === "image") {
                    images.push(mo);
                }
            }
        });

        collectVideoMediaObjects(videos);
        collectImageMediaObjects(images);
    });
}

function collectImageMediaObjects(images) {
    var imageMediaIds = [];
    _.forEach(images, function(imo) {

        console.log("mo: ", imo);
        
        var partUrlForImage = imo.url.replace("https://uosassetstore.blob.core.windows.net/assetstoredev/", "");
        var urlSplit = partUrlForImage.split("/");
        var imoId = urlSplit[0];
        imageMediaIds.push(mongo.ObjectId(imoId));
    });

    collectImageMediaObjectsFromDb(imageMediaIds);
}

function collectImageMediaObjectsFromDb(imoIds) {
    db.imagemediaobjects.find({"_id": { "$in": imoIds}}, function(err, imos){
        if(err) throw err;

        console.log("imos: ", imos);

        fs.writeFile('media-download-for-local/image-media-objects-for-download.json', JSON.stringify(imos), 'utf8', function() {
            console.log("imos - record file created");
        });
    });
}

function collectVideoMediaObjects(videos) {

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

    console.log("videoMediaIds: ", videoMediaIds);

    collectVideoMediaObjectsFromDb(videoMediaIds);
}

function collectVideoMediaObjectsFromDb(vmoIds) {
    db.videomediaobjects.find({"_id": { "$in": vmoIds}}, function(err, vmos){
        if(err) throw err;
        
        console.log("vmos: ", vmos);

        fs.writeFile('media-download-for-local/video-media-objects-for-download.json', JSON.stringify(vmos), 'utf8', function() {
            console.log("vmos - record file created");
        });
    });
}




