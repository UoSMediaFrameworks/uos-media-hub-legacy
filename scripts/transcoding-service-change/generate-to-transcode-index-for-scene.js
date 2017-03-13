/**
 * Created by aaronphillips on 13/03/2017.
 */
'use strict';

// APEP : RUN SCRIPT WITHIN SCRIPTS DIRECTORY (ie cd /scripts)

var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes']);

const BLOB_STORAGE_HOST = "uosassetstore.blob.core.windows.net";

var sceneIdForIndexCreation = "58654a5537a227ac168c66ac";

// APEP : function taken from VideoUtils from the Framework project
var getTranscodedUrl = function (mediaObjectUrl) {
    var dashUrl = mediaObjectUrl.replace("raw", "transcoded/dash");
    var trailingSlash = dashUrl.lastIndexOf("/");
    dashUrl = dashUrl.substring(0, trailingSlash);
    dashUrl += '/video_manifest.mpd';
    return dashUrl;
};

// APEP : function to find video media object id
var getVideoMediaObjectId = function(mediaObjectUrl) {
    var urlSplit = mediaObjectUrl.split("/");
    var videoMediaObjectId = urlSplit[urlSplit.length - 2];

    // APEP : TODO a better improvement to the script would be to go to the DB and ensure that this exists really

    return videoMediaObjectId;
};

// APEP : function to find asset name
var getMediaAssetName = function(mediaObjectUrl) {
    var urlSplit = mediaObjectUrl.split("/");
    var assetName = urlSplit[urlSplit.length - 1];
    return assetName;
};

db.mediaScenes.findOne({"_id": mongo.ObjectId(sceneIdForIndexCreation)}, function(err, scene){
    if(err) throw err;

    var record = {
        fromScene: scene._id,
        transcodingRequiredRecords: []
    };

    _.forEach(scene.scene, function(mo){

        // APEP : if the media object URL is pointing at our blob storage and type video,
        // we can consider this as something that is going to require replacement
        if(mo.type === "video" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1) {
            var transcodingRequiredRecord = {
                rawUrl: mo.url,
                generatedManifestUrl: getTranscodedUrl(mo.url),
                vmoAssetId: getVideoMediaObjectId(mo.url),
                vmoAssetName: getMediaAssetName(mo.url)
            };
            record.transcodingRequiredRecords.push(transcodingRequiredRecord)
        }
    });

    fs.writeFile('transcoding-service-change/scene-' + scene._id + '-media-urls.json', JSON.stringify(record), 'utf8', function(){
        console.log("record file created");
    });
});

