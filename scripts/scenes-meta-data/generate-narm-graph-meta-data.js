'use strict';

// APEP : RUN SCRIPT WITHIN SCRIPTS DIRECTORY (ie cd /scripts)

var _ = require('lodash');
var fs = require('fs');
var mongo = require('mongojs');
var generateMediaListUtil = require('../media-download-for-local/generate-media-list-util');
var getScenesHelper = require('./get-scenes-from-group-id');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes', 'imagemediaobjects', 'videomediaobjects']);

// 58d14da54c2d4c5011223d46 58d14dd54c2d4c5011223d48 58d14d554c2d4c5011223d44
var sceneIds = [ new mongo.ObjectId("58d14da54c2d4c5011223d46"), new mongo.ObjectId("58d14dd54c2d4c5011223d48"), new mongo.ObjectId("58d14d554c2d4c5011223d44")];

var numberOfScenes = 0;
var numberOfTextMediaObjects = 0;
var numberOfAudioMediaObjects = 0;
var numberOfImageMediaObjects = 0;
var numberOfVideoMediaObjects = 0;
var numberOfThemes = 0;
var totalBytesForImages = 0;
var totalBytesForVideos = 0;
var totalJsonBytes = 0;

const BLOB_STORAGE_HOST = "uosassetstore.blob.core.windows.net";

function getBytes(string){
    return Buffer.byteLength(string, 'utf8');
}

getScenesHelper.getMediaScenesForIds(db, sceneIds, function(err, scenes){

    // console.log(err, scenes);

    _.forEach(scenes, function(scene) {

        numberOfScenes++;
        numberOfThemes += Object.keys(scene.themes).length;

        var vmos = _.filter(scene.scene, function(mo){
            return mo.type === "video";
        });
        numberOfVideoMediaObjects += vmos.length;

        var amos = _.filter(scene.scene, function(mo){
            return mo.type === "audio";
        });
        numberOfAudioMediaObjects += amos.length;

        var imos = _.filter(scene.scene, function(mo){
            return mo.type === "image";
        });
        numberOfImageMediaObjects += imos.length;

        var tmos = _.filter(scene.scene, function(mo){
            return mo.type === "text";
        });
        numberOfTextMediaObjects += tmos.length;

        // APEP add the JSON bytes size
        var serialisedJson = JSON.stringify(scene);
        totalJsonBytes += getBytes(serialisedJson);

        generateMediaListUtil.processSceneWithCallback(db, BLOB_STORAGE_HOST, scene._id, false, function(err, results) {
            var imoResults = results[1];
            console.log(imoResults);
            _.forEach(imoResults, function(imo){
                totalBytesForImages += imo.image.size;
            });
            var vmoResults = results[0];
            _.forEach(vmoResults, function(vmo){
                totalBytesForVideos += vmo.video.size;
            });

            var metaData = {
                numberOfScenes: numberOfScenes,
                numberOfTextMediaObjects: numberOfTextMediaObjects,
                numberOfAudioMediaObjects: numberOfAudioMediaObjects,
                numberOfImageMediaObjects: numberOfImageMediaObjects,
                numberOfVideoMediaObjects: numberOfVideoMediaObjects,
                numberOfThemes: numberOfThemes,
                totalBytesForImages: totalBytesForImages,
                totalBytesForVideos: totalBytesForVideos,
                totalJsonBytes: totalJsonBytes,
            };

            console.log("Scenes metadata: ", metaData);

            process.exit();
        });
    });


});




