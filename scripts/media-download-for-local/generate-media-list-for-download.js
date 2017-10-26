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

var gdcGroups = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];

processScene();

function processScene() {
    // db.mediaScenes.findOne({"_id": mongo.ObjectId(sceneId)}, function(err, scene){
    db.mediaScenes.find({"_groupID": { "$in": gdcGroups}}, function(err, scenes){
        if(err) throw err;

        var images = [];
        var videos = [];

        _.forEach(scenes, function(scene){
            _.forEach(scene.scene, function(mo){
                if((mo.type === "video" && mo.url) && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                    videos.push(mo);
                } else if((mo.type === "image" && mo.url) && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                    images.push(mo);
                }
            });
        });

        collectVideoMediaObjects(videos);
        collectImageMediaObjects(images);
    });
}

function collectImageMediaObjects(images) {
    var imageMediaUrls = [];

    console.log("images: ", images);

    _.forEach(images, function(imo) {
        imageMediaUrls.push(imo.url);
    });

    console.log("imageMediaUrls: ", imageMediaUrls);

    collectImageMediaObjectsFromDb(imageMediaUrls);
}

function collectImageMediaObjectsFromDb(imoUrls) {
    db.imagemediaobjects.find({"image.url": { "$in": imoUrls}}, function(err, imos){
        if(err) throw err;

        // console.log("imos: ", imos);

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

    // console.log("videoMediaIds: ", videoMediaIds);

    collectVideoMediaObjectsFromDb(videoMediaIds);
}

function collectVideoMediaObjectsFromDb(vmoIds) {
    db.videomediaobjects.find({"_id": { "$in": vmoIds}}, function(err, vmos){
        if(err) throw err;
        
        // console.log("vmos: ", vmos);

        fs.writeFile('media-download-for-local/video-media-objects-for-download.json', JSON.stringify(vmos), 'utf8', function() {
            console.log("vmos - record file created");
        });
    });
}




