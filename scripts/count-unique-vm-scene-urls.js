/**
 * Created by aaronphillips on 15/11/2016.
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

    var urls = [];

    _.forEach(scenes, function(scene) {
        var videoMedia = _.filter(scene.scene, function(media){
            return media.type === "video" &&  ( media.url && media.url.indexOf('vimeo') === -1 );
        });

        _.forEach(videoMedia, function(videoMedia){
            urls.push(videoMedia.url);
        });
    });

    var uniqueUrls = _.uniq(urls);

    console.log("UNIQUE URLS: ", uniqueUrls);

    console.log("COUNT: ", uniqueUrls.length);
});





