/**
 * Created by aaronphillips on 14/03/2017.
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

const MEMOIR_GROUP_ID = 111;


var sceneRecords = {
    records: []
};

db.mediaScenes.find({"_groupID": MEMOIR_GROUP_ID}, function(err, scenes){

    if(err) throw err;

    _.forEach(scenes, function(scene){


        var transcodedAssets = _.filter(scene.scene, function(mo){
            return mo.type === "video" && mo.url.indexOf(BLOB_STORAGE_HOST) !== -1;
        });
        
        if(transcodedAssets.length > 0) {
            sceneRecords.records.push({sceneId: scene._id, numOfTranscodedAssets: transcodedAssets.length});
        }

    });


    fs.writeFile('transcoding-service-change/scenes-for-script-aws-transcode.json', JSON.stringify(sceneRecords), 'utf8', function(){
        console.log("record file created");
    });

});