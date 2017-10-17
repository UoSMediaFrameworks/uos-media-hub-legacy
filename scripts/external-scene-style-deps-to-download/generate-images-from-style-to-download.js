'use strict';

var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');
var async = require('async');
var getUrls = require('get-urls');
var path = require("path");
var parseCssUrls = require('css-url-parser');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['mediaScenes']);


var gdcGroups = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
var narmGroups = [112];

db.mediaScenes.find({"_groupID": { "$in": gdcGroups}}, function(err, scenes) {

    if (err) throw err;

    var stylesWithUrls = [];
    var externalImagesMap = {};

    var sceneId = null;

    function processUrlAndRecordDuplicates(url){
        if (externalImagesMap.hasOwnProperty(url)) {
            externalImagesMap[url].count += 1;
            externalImagesMap[url].sceneIds.push(sceneId);
        } else {
            externalImagesMap[url] = {};
            externalImagesMap[url].count = 1;
            externalImagesMap[url].sceneIds = [sceneId];
        }
    }

    _.each(scenes, function(scene) {
        sceneId = scene._id;
        var styleTag = scene.style;
        for (var styleKey in styleTag) {
            if(styleTag.hasOwnProperty(styleKey)) {

                var css = ".css {" + styleKey + ": " + styleTag[styleKey] + "}";
                var cssUrls = parseCssUrls(css);

                if(cssUrls.length > 0) {
                    _.forEach(cssUrls, processUrlAndRecordDuplicates);
                    styleTag.found = cssUrls;
                    stylesWithUrls.push(styleTag);
                }

            }
        }
    });

    fs.writeFile('./external-scene-style-deps-to-download/styles_with_external_deps.json', JSON.stringify(stylesWithUrls), 'utf8', function(){
        console.log("styles_with_external_deps.json file created");

        fs.writeFile('./external-scene-style-deps-to-download/unique_external_deps.json', JSON.stringify(externalImagesMap), 'utf8', function(){
            console.log("unique_external_deps.json file created");
            process.exit(1);
        });
    });
});