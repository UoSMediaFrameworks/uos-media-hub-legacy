'use strict';

var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');
var async = require('async');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require("path");
var sha1 = require('sha1');
var recursive = require("recursive-readdir");

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes']);


var gdcGroups = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
var narmGroups = [112];

db.mediaScenes.find({"_groupID": { "$in": gdcGroups}}, function(err, scenes) {

    if(err) throw err;

    var sceneSoundCloudRecords = [];

    _.forEach(scenes, function(scene) {
        var audioMedia = _.filter(scene.scene, function(media){
            return media.type === "audio" &&  ( media.url && media.url.indexOf('soundcloud.com') !== -1 );
        });

        if(audioMedia.length > 0) {
            var sceneWithSoundCloudRecord = {
                sceneId: scene._id,
                sceneGroupId: scene._groupID,
                sceneSoundCloudMediaObjects: audioMedia
            };

            sceneSoundCloudRecords.push(sceneWithSoundCloudRecord);

            var message = "sceneId: " + scene._id + ", url: ";

            _.forEach(audioMedia, function(m) {
                message += m.url + ", ";
            });

            console.log(message);
        }
    });

    console.log(sceneSoundCloudRecords);

    fs.writeFile('./scripts/soundcloud-to-download/check-remaining-soundcloud-links.json', JSON.stringify(sceneSoundCloudRecords), 'utf8', function(){
        console.log("check-remaining-soundcloud-links.json file created");
        process.exit(1);
    });
});