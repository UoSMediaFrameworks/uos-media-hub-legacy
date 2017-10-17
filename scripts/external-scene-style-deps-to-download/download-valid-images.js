"use strict";

var async = require('async');
var fs = require('fs');
var request = require('request');
var sha1 = require('sha1');
var path = require("path");
var _ = require('lodash');

var cleanedExternalDeps = require('./processed_external_deps.json').valid;

function generateImageNameFromUrl(url) {
    // APEP get after trailing
    var result = url.substring(url.lastIndexOf("/") + 1);

    // APEP strip any #
    if(result.charAt(0) === '#') {
        result = result.substr(1);
    }

    return result;
}

function downloadImage(validAsset, filename, callback) {
    request.head(validAsset.url, function(err, res, body){
        request(validAsset.url).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}

var download = function(validAssetToDownload, cb) {

    var url = validAssetToDownload.url;

    var urlHash = sha1(url);

    var dir = "./external-scene-style-deps-downloads/" + urlHash;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    var imageName = generateImageNameFromUrl(url);

    var absoluteDir = path.resolve(dir) + "/" + imageName;

    downloadImage(validAssetToDownload, absoluteDir, cb);
};

var tasks = _.map(cleanedExternalDeps, function(validAssetToDownload){
    return download.bind(null, validAssetToDownload);
});

// APEP allow 5 downloads at a time
async.parallelLimit(tasks, 5, function(err, results){
    console.log("DONE");
    process.exit(1);
});