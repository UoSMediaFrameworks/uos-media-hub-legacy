"use strict";

var _ = require('lodash');
var sha1 = require('sha1');
var fs = require('fs');
var path = require("path");
var async = require('async');
var request = require('request');

// APEP Here we have every single unique** soundcloud URL along with it's count of occurrences across the scenes it has been included in.
const soundcloudRecords = require('../soundcloud-to-download/scene_soundcloud_records_duplicates.json');
const downloadsDirectory = "./scripts/soundcloud-downloads/";

const assetStoreUrlAndPort = "http://mediaframework:4000";
const assetStoreUploadAPI = "/upload/media";
const assetStoreSwitchURLAPI = "/upload/convert";

function generateAssetResource(assetUrl, downloadedAssetFolder, type, assetOccurrencesCount) {
    return {
        assetUrl: assetUrl,
        downloadedAssetFolder: downloadedAssetFolder,
        type: type,
        assetOccurrencesCount: assetOccurrencesCount
    };
}

// APEP given an asset URL and it's download folder, we check to see if we have the 'expected' amount of media assets in the directory.
// Given a unique soundcloud track URL, we should only have one per folder.
function processDownloadedAssetFolder(assetUrl, downloadedAssetFolder, callback) {
    // APEP found files inside the directory.  0 = missing on soundcloud, gt 1 = soundcloud URL was not for a single track (skip in both cases)
    fs.readdir(downloadedAssetFolder, function (err, files) {
        if(err) {
            // console.log(`ERROR - No downloaded folder - assetUrl: ${assetUrl}, downloadedAssetFolder: ${downloadedAssetFolder}`);
            callback(null, generateAssetResource(assetUrl, downloadedAssetFolder, 'Error'));
        } else {
            var numberOfAssetsInDirectory = files.length;

            if(numberOfAssetsInDirectory <= 0 ) {
                // console.log(`SKIP - Missing Downloaded Asset - assetUrl: ${assetUrl}`);
                callback(null, generateAssetResource(assetUrl, downloadedAssetFolder, 'Skip'));
            } else if (numberOfAssetsInDirectory > 1) {
                // console.log(`SKIP - Too many assets - URL not pointing at a single track - assetUrl: ${assetUrl}`);
                callback(null, generateAssetResource(assetUrl, downloadedAssetFolder, 'Skip'));
            } else {
                const assetOccurrencesCount = soundcloudRecords[assetUrl];
                callback(null, generateAssetResource(assetUrl, downloadedAssetFolder, 'Valid', assetOccurrencesCount));
            }
        }
    });
}

// APEP Upload an asset to the asset store
function uploadMediaAsset(assetResource, callback) {
    fs.readdir(path.resolve(assetResource.downloadedAssetFolder), function(err, files){
        var mediaAsset = files[0]; // APEP use the file name given to use during the download process
        // APEP TODO confirm if this is what we want.
        var formData = {
            mediaType: "audio",
            filename: mediaAsset,
            audio: fs.createReadStream(assetResource.downloadedAssetFolder + "/" + mediaAsset)
        };

        request.post({
            url: assetStoreUrlAndPort + assetStoreUploadAPI,
            formData: formData
        }, function(err, http, body){
            callback(err, {
                assetStoreResult: body,
                assetResource: assetResource
            });
        });
    });
}

// APEP After successful upload of an asset, we need to switch the URLs in scene json
function replaceSceneAssetUrlsForNewlyConvertedMediaAsset(assetResource, assetStoreResult, callback) {
    var formData = {
        oldUrl: assetResource.assetUrl,
        newUrl: JSON.parse(assetStoreResult).url
    };
    request.post({
        url: assetStoreUrlAndPort + assetStoreSwitchURLAPI,
        formData: formData
    }, function(err, http, body) {
        callback(err, {
            statusCode: http.statusCode,
            body: body,
            assetResource: assetResource
        });
    });
}

// APEP generate the initial task list to work out which resources that are part of our soundcloud index file can be progressed
var tasks = [];
for(const assetUrl in soundcloudRecords) {
    if(soundcloudRecords.hasOwnProperty(assetUrl)) {
        // APEP TODO we may have to store the query for how this list was generated, otherwise how do we know we are acting on the correct scenes?
        var localDownloadFolderForURL = sha1(assetUrl);
        var downloadedAssetFolder = downloadsDirectory + localDownloadFolderForURL;
        tasks.push(processDownloadedAssetFolder.bind(null, assetUrl, downloadedAssetFolder));
    }
}

// APEP Run the tasks in parallel to calculate which of the assets we can proceed to upload to our asset store.
async.parallelLimit(tasks, 3, function(err, results) {

    var resultsToSkip = _.filter(results, function(result) {
        return result.type === 'Error' || result.type === 'Skip';
    });
    console.log("resultsToSkip: ", resultsToSkip);

    var validResults = _.filter(results, function(result) {
        return result.type === 'Valid';
    });
    // console.log("validResults: ", validResults);

    var uploadValidAssetTasks = [];
    _.forEach(validResults, function(mediaAssetResource){
        uploadValidAssetTasks.push(uploadMediaAsset.bind(null, mediaAssetResource));
    });

    async.parallelLimit(uploadValidAssetTasks, 1, function(err, results){
        if(err) {
            console.log(`err: ${err}`);
        }

        // APEP TODO for each successful upload, we need to switch the URLS and ensure occurances match.
        var switchSceneJsonUrlTasks = [];
        _.forEach(results, function(result) {
            var assetStoreResult = result.assetStoreResult;
            var assetResource = result.assetResource;
            switchSceneJsonUrlTasks.push(replaceSceneAssetUrlsForNewlyConvertedMediaAsset.bind(null, assetResource, assetStoreResult));
        });

        async.parallelLimit(switchSceneJsonUrlTasks, 1, function(err, switchUrlResults) {

            _.forEach(switchUrlResults, function(switchUrlResult) {

                if(switchUrlResult.statusCode !== 200) {
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
                }
            });
        });
    });
});