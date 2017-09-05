'use strict';

// APEP : RUN SCRIPT WITHIN SCRIPTS DIRECTORY (ie cd /scripts)

var _ = require('lodash');
var fs = require('fs');
var mongo = require('mongojs');
var Buffer = require('Buffer');
var getScenesFromGroupId = require('./get-scenes-from-group-id');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes']);

const GDC_GROUPS = [101,102,103,104,105,106,107,108,109,110];

getScenesFromGroupId.getMediaScenesForGroups(db, GDC_GROUPS, function(err, scenes){

    if(err) throw err;

    var numberOfScenes = 0;
    var numberOfTextMediaObjects = 0;
    var numberOfAudioMediaObjects = 0;
    var numberOfImageMediaObjects = 0;
    var numberOfVideoMediaObjects = 0;
    var numberOfThemes = 0;

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
    });


    var metaData = {
        numberOfScenes: numberOfScenes,
        numberOfTextMediaObjects: numberOfTextMediaObjects,
        numberOfAudioMediaObjects: numberOfAudioMediaObjects,
        numberOfImageMediaObjects: numberOfImageMediaObjects,
        numberOfVideoMediaObjects: numberOfVideoMediaObjects,
        numberOfThemes: numberOfThemes
    };

    console.log("Scenes metadata: ", metaData);

});
