"use strict";

var _ = require('lodash');
var sha1 = require('sha1');
var fs = require('fs');
var path = require("path");
var async = require('async');
var request = require('request');

// APEP Here we have every single unique** soundcloud URL along with it's count of occurrences across the scenes it has been included in.
const soundcloudRecords = require('../soundcloud-to-download/scene_soundcloud_records_duplicates.json');
const downloadsDirectory = "../soundcloud-to-download/downloads";


//AP I have added an image folder containing a visual for the file format created by soundcloud
const assetStoreUrlAndPort = "http://localhost:4999";
const assetStoreUploadAPI = "/upload/media";
const assetStoreSwitchURLAPI = "/upload/convert";

var tasks = [];
//AP: with the soundcloud downloader providing us with a json file, we can use it to match the assets


//AP: we can use this function to remove all those soundcloud id's that were added to the name of the files;
function stripUserIDFromURLS() {
    // console.log(files);
    fs.readdir(downloadsDirectory, function (err, files) {
        _.each(files, function (fil) {
            var filename = fil.substring(0, fil.lastIndexOf('-'));
            var ext = fil.substring(fil.lastIndexOf('.') + 1);
            console.log(filename, ext);
            fs.rename(downloadsDirectory + "/" + fil, downloadsDirectory + "/" + filename + "." + ext, function (err, res) {
                console.log(err, res);
            });
        });
    });
}

var analyseSoundCloudJson = function (cb) {
    var fileJsonObjects = [];
    fs.readdir(downloadsDirectory, function (err, files) {
        console.log("download dir", downloadsDirectory, files.length)

        if (files.length > 0) {
            async.each(files, function (file, callback) {
                var ext = file.substring(file.lastIndexOf('.') + 1);
                if (ext === "json") {
                    fs.readFile(downloadsDirectory + "/" + file, "utf-8", function (err, data) {
                        if (err) {
                            console.log("error", err);
                            return callback();
                        } else {
                            var obj = JSON.parse(data);
                            //    console.log("Object", obj.webpage_url);
                            fileJsonObjects.push({title: obj.title, url: obj.webpage_url, ext: obj.ext});
                            return callback();
                        }
                    });
                } else {

                    return callback();
                }
            }, function (err, data) {
                return cb(null, fileJsonObjects, "finished analyseSoundCloudJson");
            });

        } else {
            console.log("The download folder is empty");
            return cb("The download folder is empty");
        }
    });
}


var createTasks = function (data, message, cb) {
    var tasks = [];
    console.log(data.length, message, Object.keys(soundcloudRecords).length)
    if (data.length > 0) {
        async.each(Object.keys(soundcloudRecords), function (assetUrl, callback) {
            var t = assetUrl.lastIndexOf('?');
            var isFileUrlPartOfPlayList = assetUrl.substring(0, assetUrl.lastIndexOf('?'));

            var obj = _.find(data, function (o) {
                var bool;
                if (t === -1) {
                    bool = (o.url === assetUrl);
                } else {
                    //console.log(isFileUrlPartOfPlayList,o)
                    bool = (o.url === isFileUrlPartOfPlayList);
                }
                return bool;
            });

            if (obj !== undefined) {
                const assetOccurrencesCount = soundcloudRecords[assetUrl];
                _.assign(obj, {assetOccurrencesCount: assetOccurrencesCount, type: "Valid"});
                //console.log("extended object", obj);
                tasks.push(obj);
            } else {
                // console.log(assetUrl,isFileUrlPartOfPlayList)
            }
            return callback();

        }, function (err, data) {
            return cb(null, tasks, "Creating tasks finished");
        });

    } else {
        return cb("No files exit");
    }
};

var processTasks = function (data, message, cb) {
    console.log(data.length, message);

    var resultsToSkip = _.filter(data, function (result) {
        return result.type === 'Error' || result.type === 'Skip';
    });
    console.log("resultsToSkip: ", resultsToSkip);

    var validResults = _.filter(data, function (result) {
        return result.type === 'Valid';
    });
    if(validResults.length < 1){
        cb("No valid tasks")
    }
    cb(null,validResults,"FInished processing tasks");
};
var uploadAssets = function (data, message, cb) {
    console.log(data.length, message)

    var uploadValidAssetTasks = [];
    /*    console.log(tasks);*/
    //AP part 1
    async.each(data, function (mediaAssetResource, validCb) {

        // console.log("asserResource", mediaAssetResource);
        fs.readdir(path.resolve(downloadsDirectory), function (err, files) {
            // APEP use the file name given to use during the download process
            // APEP TODO confirm if this is what we want.
            //console.log(downloadsDirectory + "/" + mediaAssetResource.title+ "."+mediaAssetResource.ext);
            var formData = {
                mediaType: "audio",
                filename: mediaAssetResource.title,
                audio: fs.createReadStream(downloadsDirectory + "/" + mediaAssetResource.title + "." + mediaAssetResource.ext)
            };

            request.post({
                url: assetStoreUrlAndPort + assetStoreUploadAPI,
                formData: formData
            }, function (err, http, body) {
                if (err) {
                    console.log(err);
                    return validCb();
                }
                uploadValidAssetTasks.push({
                    assetStoreResult: body,
                    assetResource: mediaAssetResource
                });
                return validCb();
            });
        });
    }, function (err, data) {

        return cb(null, uploadValidAssetTasks, "Finished uploading assets ");
    });
}
var switchSceneJSONUrl = function (data, message, cb) {
    console.log(data, message)

    var switchSceneJsonUrlTasks = [];
    async.each(data, function (result, callbackValidTasks) {
        var assetStoreResult = result.assetStoreResult;
        var assetResource = result.assetResource;

        var formData = {
            oldUrl: assetResource.url,
            newUrl: JSON.parse(assetStoreResult).url
        };
        request.post({
            url: assetStoreUrlAndPort + assetStoreSwitchURLAPI,
            formData: formData
        }, function (err, http, body) {
            console.log(err, body)
            switchSceneJsonUrlTasks.push({
                statusCode: http.statusCode,
                body: body,
                assetResource: assetResource,
                newUrl:formData.newUrl
            });

            callbackValidTasks();
        });
    }, function (err, data) {
        return cb(null, switchSceneJsonUrlTasks, "Finished switching asset json url's ");
    });
};

var finalizeResults = function(data,message,cb){
    console.log(data.length, message)

    _.each(data, function(switchUrlResult) {
        console.log(data)
    /*    if(switchUrlResult.statusCode !== 200) {
            console.log("FAILED REQUEST TO ASSET STORE");
            console.log(switchUrlResult.assetResource);
            console.log(switchUrlResult.body);
        } else {
            var assetStoreUrlSwitchResult = JSON.parse(switchUrlResult.body); // APEP Here we have nModified by DB

            var assetResource = switchUrlResult.assetResource; // APEP Here we have occurence from script

            var matching = assetStoreUrlSwitchResult.nModified === assetResource.assetOccurrencesCount;

            // APEP TODO we should probably build up an output file so we have a record of fail cases.
            // Given a correct database import I expect none.

            if(!matching) {
                console.log(`MISMATCH 
                        nModified ${assetStoreUrlSwitchResult.nModified}
                        assetResource.assetOccurrencesCount ${assetResource.assetOccurrencesCount}
                        assetResource ${assetResource}
                        assetResource.assetUrl ${assetResource.assetUrl}
                    `);
            }
        }*/
    });
}


async.waterfall([
        analyseSoundCloudJson,
        createTasks,
        processTasks,
        uploadAssets,
        switchSceneJSONUrl,
        finalizeResults
    ], function (error, data) {
        if (error) {
            console.log("end of waterfall e", error);
        } else {
            console.log("end of waterfall d", data);
        }
    }
)