/**
 * Created by aaronphillips on 06/12/2016.
 */
'use strict';
var _ = require('lodash');
var mongo = require('mongojs');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo.connect(config.mongo, ['mediaScenes']);

db.mediaScenes.find({}, function(err, scenes) {

    if(err) throw err;

    var scenesWithAtleastOneVimeo = 0;
    var sceneUrlsWithVimeoIn = 0;

    _.forEach(scenes, function(scene) {
        var videoMedia = _.filter(scene.scene, function(media){
            return media.type === "video" &&  ( media.url && media.url.indexOf('vimeo.com') !== -1 );
        });
        
        if(videoMedia.length > 0) {
            scenesWithAtleastOneVimeo++;
        }

         sceneUrlsWithVimeoIn += videoMedia.length;
    });

    console.log("sceneUrlsWithVimeoIn", sceneUrlsWithVimeoIn);
    console.log("scenesWithAtleastOneVimeo", scenesWithAtleastOneVimeo)
});





