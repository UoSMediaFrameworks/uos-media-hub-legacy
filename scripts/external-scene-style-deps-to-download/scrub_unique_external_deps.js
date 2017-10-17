"use strict";

var uniqueExternalDepsMap = require('./unique_external_deps.json');
var async = require('async');
var urlExists = require('url-exists');
var fs = require('fs');
var sha1 = require('sha1');

var missingOrErrorUrls = [];
var validUrls = [];

var uniqueExternalDeps = Object.keys(uniqueExternalDepsMap);

async.every(uniqueExternalDeps, function(url, cb){
    urlExists(url, function(err, exists) {
        if(err || !exists) {
            uniqueExternalDepsMap[url].url = url;
            missingOrErrorUrls.push(uniqueExternalDepsMap[url]);
        } else {
            uniqueExternalDepsMap[url].url = url;
            uniqueExternalDepsMap[url].urlHash = sha1(url);
            validUrls.push(uniqueExternalDepsMap[url]);
        }
        cb(null, true);
    });
}, function(err, results){
    var writeToFileResults = {
        missingOrErrors: missingOrErrorUrls,
        valid: validUrls
    };
    fs.writeFile('./external-scene-style-deps-to-download/processed_external_deps.json', JSON.stringify(writeToFileResults), 'utf8', function(){
        console.log("processed_external_deps.json file created");
        process.exit(1);
    });
});