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

console.log("Connecting to MongoDB");
console.log(config.mongo);
var db = mongo( config.mongo, ['mediaScenes', 'imagemediaobjects', 'videomediaobjects']); //TODO add a fail to connect handler

const BLOB_STORAGE_HOST = "uosassetstore.blob.core.windows.net";

var sceneId = "587f7ce1d145b604133db205";

console.log("Connected to MongoDB");

processScene();

console.log("Done");

//Call process.exit(); as a callback from processScene?



function processScene() {
    db.mediaScenes.findOne({"_id": mongo.ObjectId(sceneId)}, function(err, scene){
        if(err) throw err;

        var images = [];
        var videos = [];
        var audios = [];

        _.forEach(scene.scene, function(mo){
            if(mo.type === "video" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                videos.push(mo);
            } else if(mo.type === "image" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                images.push(mo);
            } else if(mo.type === "audio" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
                audios.push(mo);
            }
        });

        //So much reuse of code - refactor

        collectVideoMediaObjects(videos);
        collectImageMediaObjects(images);
        collectAudioMediaObjects(audios);
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

        fs.writeFile('image-media-objects-for-download.json', JSON.stringify(imos), 'utf8', function() {
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

        fs.writeFile('video-media-objects-for-download.json', JSON.stringify(vmos), 'utf8', function() {
            console.log("vmos - record file created");
        });
    });
}

function collectAudioMediaObjects(audios) {

    var audioMediaIds = [];
    _.forEach(audios, function(amo) {

        // APEP ensure that it is in the raw folder... some media seems to have gone in the wrong bucket, we really need to resolve this
        if(amo.url.indexOf("assetstoredev/audio/raw") !== -1) {
            var audioUrlWithoutHostAndFileSystem = amo.url.replace("https://uosassetstore.blob.core.windows.net/assetstoredev/audio/raw/", "");
            var urlSplit = audioUrlWithoutHostAndFileSystem.split("/");
            var amoId = urlSplit[0];
            audioMediaIds.push(mongo.ObjectId(amoId));
        }
    });

    console.log("audioMediaIds: ", audioMediaIds);

    collectAudioMediaObjectsFromDb(audioMediaIds);
}

function collectAudioMediaObjectsFromDb(amoIds) {
    db.audiomediaobjects.find({"_id": { "$in": amoIds}}, function(err, amos){
        if(err) throw err;

        console.log("amos: ", amos);

        fs.writeFile('audio-media-objects-for-download.json', JSON.stringify(amos), 'utf8', function() {
            console.log("amos - record file created");
        });
    });
}