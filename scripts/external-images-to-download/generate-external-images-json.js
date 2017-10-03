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
var request = require('request');
var urlExists = require('url-exists');
var Url = require('url');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes']);


var gdcGroups = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
var narmGroups = [112];

function generateImageNameFromUrl(url) {
    // APEP get after trailing
    var result = url.substring(url.lastIndexOf("/") + 1);

    // APEP strip any #
    if(result.charAt(0) === '#') {
        result = result.substr(1);
    }

    return result;
}

function doesHaveValidFileExtension(url) {
    var extension = path.extname(Url.parse(url).pathname);

    // APEP use JS if to auto convert string to bool
    if (extension) {
        return true;
    } else {
        return false;
    }
}

function downloadImage(uri, filename, callback) {
    request.head(uri, function(err, res, body){
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}

db.mediaScenes.find({"_groupID": { "$in": gdcGroups}}, function(err, scenes) {

    if(err) throw err;

    var externalImagesCount = 0;
    var uniqueCount = 0;
    var urlMissingCount = 0;
    var externalImagesMap = {};
    var errorUrls = [];

    async.every(scenes, function(scene, callback) {

        var imageMedia = _.filter(scene.scene, function(media){
            return media.type === "image" &&  ( media.url && media.url.indexOf('blob.core.windows.net') === -1 );
        });

        async.every(imageMedia, function(imob, cb) {
            externalImagesCount++;
            urlExists(imob.url, function(err, exists) {
                if(err || !exists) {
                    // APEP TODO FAIL CASE
                    urlMissingCount++;
                    errorUrls.push({
                        sceneId: scene._id,
                        imoId: imob._id,
                        url: imob.url,
                        type: "MISSING"
                    });
                } else {
                    if(doesHaveValidFileExtension(imob.url)) {
                        if (externalImagesMap.hasOwnProperty(imob.url)) {
                            externalImagesMap[imob.url] += 1;
                        } else {
                            externalImagesMap[imob.url] = 1;
                            uniqueCount++;
                        }
                    } else {
                        urlMissingCount++;
                        errorUrls.push({
                            sceneId: scene._id,
                            imoId: imob._id,
                            url: imob.url,
                            type: "MISSING FILE EXTENSION"
                        });
                    }
                }
                cb(err, true);
            });
        }, function(err, results) {
            callback(err, results);
        });
    }, function(err, results){
        async.parallel([
            function(cb) {
                console.log("uniqueCount: ", uniqueCount);
                console.log("urlMissingCount: ", urlMissingCount);
                console.log("urlGoodCount: ", uniqueCount - urlMissingCount);
                fs.writeFile('./external-images-to-download/scene_external_images_records_duplicates.json', JSON.stringify(externalImagesMap), 'utf8', function(){
                    console.log("scene_external_images_records_duplicates.json file created");
                    cb();
                });
            },
            function(cb) {
                fs.writeFile('./external-images-to-download/scene_external_images_records_missing.json', JSON.stringify(errorUrls), 'utf8', function(){
                    console.log("scene_external_images_records_missing.json file created");
                    cb();
                });
            }
        ], function(err, results) {

            var tasks = [];

            var download = function(url, cb) {

                var urlHash = sha1(url);

                var dir = "./external-images-downloads/" + urlHash;

                if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                }

                var imageName = generateImageNameFromUrl(url);

                var absoluteDir = path.resolve(dir) + "/" + imageName;

                downloadImage(url, absoluteDir, cb);
            };

            for(var imageMediaUrl in externalImagesMap) {
                if(externalImagesMap.hasOwnProperty(imageMediaUrl)) {
                    tasks.push(download.bind(null, imageMediaUrl));
                }
            }

            // APEP allow 5 downloads at a time
            async.parallelLimit(tasks, 5, function(err, results){
                console.log("DONE");
                process.exit(1);
            });
        });
    });
});