/**
 * Created by ajf on 21/09/2017.
 */
'use strict';
var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes']);

db.mediaScenes.find({}, function(err, scenes) {

    if(err) throw err;

    var soundCloudObjectCount = 0;

    var sceneSoundCloudString = "";

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
        }

        _.forEach(audioMedia, function(amob) {
            sceneSoundCloudString += amob.url + " ";
            soundCloudObjectCount++;
        });


    });

    //console.log("create-soundcloud-urls-in-scenes-index - sceneSoundCloudRecords ", sceneSoundCloudRecords);
    console.log("soundCloudObjectCount: ", soundCloudObjectCount);
    fs.writeFile('soundcloud-to-download/scene_soundcloud_records.txt', sceneSoundCloudString, 'utf8', function(){
        console.log("scene_soundcloud_records.txt file created");
    });

    //console.log("create-vimeo-urls-in-scenes-index - sceneSoundCloudRecords ", sceneSoundCloudRecords);
    fs.writeFile('soundcloud-to-download/scene_soundcloud_records.json', JSON.stringify(sceneSoundCloudRecords), 'utf8', function(){
        console.log("scene_soundcloud_records.json file created");
    });
});