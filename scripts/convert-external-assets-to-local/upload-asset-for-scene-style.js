"use strict";

var _ = require('lodash');
var fs = require('fs');
var path = require("path");
var async = require('async');
var request = require('request');

const imagesForStyle = require('../external-scene-style-deps-to-download/processed_external_deps.json').valid;
const downloadsDirectory = "../scripts/external-scene-style-deps-downloads/";
const assetStoreUrlAndPort = "http://mediaframework:4000";
const assetStoreUploadAPI = "/upload/media";

var upload = function(asset, cb) {

    var localDownloadFolderForURL = asset.urlHash;
    var downloadedAssetFolder = downloadsDirectory + localDownloadFolderForURL;

    console.log(asset);
    console.log(downloadedAssetFolder);
    console.log(path.resolve(downloadedAssetFolder));
    console.log("-------------------------");
    console.log("-");

    fs.readdir(path.resolve(downloadedAssetFolder), function(err, files){
        var mediaAsset = files[0]; // APEP use the file name given to use during the download process

        var formData = {
            mediaType: "image",
            filename: mediaAsset,
            image: fs.createReadStream(path.resolve(downloadedAssetFolder) + "/" + mediaAsset)
        };

        request.post({
            url: assetStoreUrlAndPort + assetStoreUploadAPI,
            formData: formData
        }, function(err, http, body) {
            cb(err, {
                assetStoreResult: body,
                asset: asset
            });
        });
    });
};

var tasks = _.map(imagesForStyle, function(validAssetToDownload){
    return upload.bind(null, validAssetToDownload);
});

// APEP allow 5 downloads at a time
async.parallelLimit(tasks, 1, function(err, results) {
    if(err) throw err;

    fs.writeFile('./external-scene-style-deps-to-download/processed_and_downloaded_external_deps.json', JSON.stringify(results), 'utf8', function() {
        console.log("processed_and_downloaded_external_deps.json file created");
        process.exit(1);
    });
});