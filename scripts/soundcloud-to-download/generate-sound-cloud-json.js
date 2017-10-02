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

    var soundCloudObjectCount = 0;
    var uniqueCount = 0;

    var sceneSoundCloudString = "";

    var sceneSoundCloudRecords = [];

    var audioUrlDuplicateDetector = {};

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

            if (audioUrlDuplicateDetector.hasOwnProperty(amob.url)) {
                audioUrlDuplicateDetector[amob.url] += 1;
            } else {
                audioUrlDuplicateDetector[amob.url] = 1;
                uniqueCount++;
            }
        });

    });

    async.parallel([
        function(cb) {
            //console.log("create-soundcloud-urls-in-scenes-index - sceneSoundCloudRecords ", sceneSoundCloudRecords);
            console.log("soundCloudObjectCount: ", soundCloudObjectCount);
            fs.writeFile('../soundcloud-to-download/scene_soundcloud_records.txt', sceneSoundCloudString, 'utf8', function(){
                console.log("scene_soundcloud_records.txt file created");
                cb();
            });
        },
        function(cb) {
            //console.log("create-vimeo-urls-in-scenes-index - sceneSoundCloudRecords ", sceneSoundCloudRecords);
            fs.writeFile('../soundcloud-to-download/scene_soundcloud_records.json', JSON.stringify(sceneSoundCloudRecords), 'utf8', function(){
                console.log("scene_soundcloud_records.json file created");
                cb();
            });
        },
        function(cb) {
            console.log("uniqueCount: ", uniqueCount);
            fs.writeFile('../soundcloud-to-download/scene_soundcloud_records_duplicates.json', JSON.stringify(audioUrlDuplicateDetector), 'utf8', function(){
                console.log("scene_soundcloud_records_duplicates.json file created");
                cb();
            });
        }
    ], function(err, results) {

        return;

        var tasks = [];

        var spawnYoutubeDl = function(url, cb) {

            var urlHash = sha1(url);
            var dir = "./" + urlHash;

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }

            var absoluteDir = path.resolve(dir) + "/%(title)s-%(id)s.%(ext)s";

            // APEP -w do not allow overwrite, ie if we've already downloaded, don't redownload
            // -o specify output folder
            var child = spawn('youtube-dl', ["-w", "-o", absoluteDir, url]);

            var childLogs = [];

            child.stdout.on('data', function(data){
                childLogs.push(data.toString());
            });

            child.on('exit', function(code, signal) {

                fs.readdir("./", function (err, files) {

                    var jobReport = {
                        urlHash: urlHash,
                        dir: dir,
                        absoluteDir: absoluteDir,
                        url: url,
                        jobLogs: childLogs
                    };

                    fs.appendFile('../soundcloud-to-download/job.log', "DONE jobReport: " + JSON.stringify(jobReport) + "\n", 'utf8', function (err) {
                        cb();
                    });
                });

            });

            child.on('error', function(code, signal) {
                console.log("ERROR url: ", url);
                cb();
            });
        };

        for(var audioMediaUrl in audioUrlDuplicateDetector) {
            if(audioUrlDuplicateDetector.hasOwnProperty(audioMediaUrl)) {
                tasks.push(spawnYoutubeDl.bind(null, audioMediaUrl));
            }
        }

        // APEP allow 5 downloads at a time
        async.parallelLimit(tasks, 5, function(err, results){
            console.log("DONE");
            process.exit(1);
        });
    });
});