/**
 * Created by aaronphillips on 06/12/2016.
 */
/**
 * Created by aaronphillips on 06/12/2016.
 */
'use strict';
var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo.connect(config.mongo, ['mediaScenes']);

db.mediaScenes.find({}, function(err, scenes) {

    if(err) throw err;

    var sceneVimeoRecords = "";

    _.forEach(scenes, function(scene) {
        var videoMedia = _.filter(scene.scene, function(media){
            return media.type === "video" &&  ( media.url && media.url.indexOf('vimeo.com') !== -1 );
        });

        _.forEach(videoMedia, function(vmob) {
           sceneVimeoRecords += vmob.url + " "; 
        });
    });

    //console.log("create-vimeo-urls-in-scenes-index - sceneVimeoRecords ", sceneVimeoRecords);

    fs.writeFile('vimeo-to-transcoded/scene_vimeo_records.txt', sceneVimeoRecords, 'utf8', function(){
        console.log("create-vimeo-url-whitespace-list - sceneVimeoRecords index file created");
    });
});





