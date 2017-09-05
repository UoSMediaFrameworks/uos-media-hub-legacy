'use strict';

var mongo = require('mongojs');
var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var path = require('path');
var download = require('download-file');
var ffprobe = require('ffprobe'),
    ffprobeStatic = require('ffprobe-static');

var getScenesHelper = require('../scenes-meta-data/get-scenes-from-group-id');
var generateMediaListUtils = require('../media-download-for-local/generate-media-list-util');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes', 'imagemediaobjects', 'videomediaobjects']);

const BLOB_STORAGE_HOST = "uosassetstore.blob.core.windows.net";

const NARM_GROUPID = 112;

// 58d14da54c2d4c5011223d46 58d14dd54c2d4c5011223d48 58d14d554c2d4c5011223d44
var sceneIds = [ new mongo.ObjectId("58d14da54c2d4c5011223d46"), new mongo.ObjectId("58d14dd54c2d4c5011223d48"), new mongo.ObjectId("58d14d554c2d4c5011223d44")];

var imoFileName = "image-media-objects-for-download.json";
var vmoFileName = "video-media-objects-for-download.json";

var imoSourceFile = "../media-download-for-local/" + imoFileName;
imoSourceFile = path.resolve(__dirname, imoSourceFile);
var vmoSourceFile = "../media-download-for-local/" + vmoFileName;
vmoSourceFile = path.resolve(__dirname, vmoSourceFile);

class MediaObjectProbeCSVWriter {
    constructor(header) {
        this.header = header;
        this.csvLines = [];
        this.addedAssets = [];
    }

    addRecord(assetId, record) {
        if(this.addedAssets.indexOf(assetId) === -1) {
            this.addedAssets.push(assetId);
            this.csvLines.push(record);
        }
    }

    writeToFile(filepath, cb) {
        var stream = fs.createWriteStream(filepath);
        var self = this;
        stream.once('open', function(fd) {
            stream.write(self.header + "\n");
            _.forEach(self.csvLines, function(line){
                stream.write(line + "\n");
            });
            stream.end(function() {
                cb();
            });
        });
    }
}

getScenesHelper.getMediaScenesForIds(db, sceneIds, function(err, scenes) {

    if(err) throw err;

    function analyseScene(scene, cb) {
        generateMediaListUtils.processSceneWithCallback(db, BLOB_STORAGE_HOST, scene._id, true, function() {

            var dbImos = require(imoSourceFile);
            var dbVmos = require(vmoSourceFile);

            function attachMediaData(previousErr, action, filepath, mo, url, cb) {
                ffprobe(filepath, { path: ffprobeStatic.path }, function (err, info) {
                    if (err) {
                        cb(err, null, filepath);
                    }

                    cb(previousErr, action, filepath, info, mo, url);
                });
            }

            // APEP TODO we should really store the media id asset with the folder, incase duplicate names
            function downloadMediaFile(url, fileSize, mo, folder, options, cb) {
                var id = mo._id;

                var filename = url.split('/').pop();
                var filepath = path.resolve(__dirname, "../downloaded_media/" + folder + "/" + filename);
                var doesFileExistAlready = fs.existsSync(filepath);
                const stats = doesFileExistAlready ? fs.statSync(filepath) : {size: 0};
                const fileSizeInBytes = stats.size;

                // APEP TODO we should make this smart and check if we have the file downloaded
                if(fileSizeInBytes !== fileSize) {
                    download(url, options, function(err){
                        attachMediaData(err, true, filepath, mo, url, cb);
                    });
                } else {
                    attachMediaData(false, "Already downloaded", filepath, mo, url, cb);
                }
            }

            var taskObject = [];

            _.forEach(dbVmos, function(mo) {
                var options = {
                    directory: "./downloaded_media/videos"
                };
                taskObject.push(downloadMediaFile.bind(null, mo.video.url, mo.video.size, mo, "videos", options));
            });

            _.forEach(dbImos, function(mo) {
                var options = {
                    directory: "./downloaded_media/images"
                };
                taskObject.push(downloadMediaFile.bind(null, mo.image.url, mo.image.size, mo, "images", options));
            });

            async.parallel(taskObject, function(err, results) {
                // console.log(err, results);
                _.forEach(results, function(result, index){
                    var action = result[0];
                    var savedFilePath = result[1];
                    var fileInfo = result[2];
                    var mo = result[3];
                });

                // APEP we are then done for the scene
                console.log("We analysed scene id: ", scene._id);
                cb(err, results);
            });
        });
    }

    var taskObject = [];

    _.forEach(scenes, function(scene, index){
        taskObject.push(analyseScene.bind(null, scene));
    });

    console.log(taskObject.length);

    async.series(taskObject, function(err, results) {

        // APEP create a CSV writer ready to process results, synchronously, one by one
        var csvWriter = new MediaObjectProbeCSVWriter("url, id, file size (bytes), w x h");

        // APEP results is an array of an array.  High level array is the results array per scene
        _.forEach(results, function(sceneResults) {

            // APEP for each media object result.  The result specifies, media that are stored by us.
           _.forEach(sceneResults, function(moResults) {
               var fileInfo = moResults[2];
               var mo = moResults[3];
               var moFileSize = mo.hasOwnProperty("video") ? mo.video.size : mo.image.size;
               var moUrl = moResults[4];
               var data = {};

               // APEP if the streams.length is greater than 1, we need to filter codec_type === video
               // APEP videos are processed into multiple streams, audio and data types are added into this object from ffprobe
               if(fileInfo.streams.length > 1) {
                   data = _.find(fileInfo.streams, function(stream){
                       return stream.codec_type === "video";
                   });
               } else {
                   data = fileInfo.streams[0];
               }
               csvWriter.addRecord(mo._id, moUrl + ", " + mo._id + ", " + moFileSize + ", " + data.width + "-" + data.height);
           });
        });

        csvWriter.writeToFile("media-asset-analysing/output.csv", function() {
            process.exit();
        });
    });

});