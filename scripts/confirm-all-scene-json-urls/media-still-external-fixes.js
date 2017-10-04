// APEP suspected schema validation save errors for images with shit IDs somewhere in Scene JSON data
var async = require('async');
var mongo = require('mongojs');
var fs = require('fs');
var request = require('request');

var config = {
    mongo: process.env.HUB_MONGO,
};

// 1. Given all missing assets
var existingMediaStillExternal = require('./media-still-external.json');

var db = mongo(config.mongo, ['mediaScenes', 'imagemediaobjects', 'audiomediaobjects', 'videomediaobjects']);

const mediaTypeToMongoCollectionTable = {
    "image": "imagemediaobjects",
    "audio": "audiomediaobjects",
    "video": "videomediaobjects"
};

const OLD_CDN_BASE_URL = "https://uosassetstore.blob.core.windows.net/assetstoredev/";
const NEW_CDN_BASE_URL = "http://mediaframework:8090/";

function searchDatabase(mo, url, cb) {
    var fieldForQuery = mo.type + ".url";
    var findQuery = {};
    findQuery[fieldForQuery] = url;
    db[mediaTypeToMongoCollectionTable[mo.type]].findOne(findQuery, function(err, mediaObject){
        cb(err, {mo: mo, mediaObject: mediaObject});
    });
}

const assetStoreUrlAndPort = "http://mediaframework:4000";
const assetStoreSwitchURLAPI = "/upload/convert";

function assetStoreSwitchUrl(oldUrl, newUrl, callback){
    var formData = {
        oldUrl: oldUrl,
        newUrl: newUrl
    };
    request.post({
        url: assetStoreUrlAndPort + assetStoreSwitchURLAPI,
        formData: formData
    }, function(err, http, body) {
        callback(err, {
            statusCode: http.statusCode,
            body: body,
        });
    });
}

var mediaObjectsThatHaveExternalUrlInCollection = [];
var mediaObjectsThatHaveCorrectLocalUrlInCollection = [];

async.everyLimit(existingMediaStillExternal, 1, function(mo, moMongoInvestigationCallback){

    var externalUrl = mo.url;
    var internalUrl = mo.url.replace(OLD_CDN_BASE_URL, NEW_CDN_BASE_URL);

    // 2. Given type, check if they exist in database with correct or incorrect URL

    async.parallel({
        externalUrlLookup: searchDatabase.bind(null, mo, externalUrl),
        internalUrlLookup: searchDatabase.bind(null, mo, internalUrl)
    }, function(err, mongoLookupResults){

        if(err) throw err;

        // 2.1 Incorrect URL dump to a file TODO // expecting array of [0] err and [1] mo or null
        mediaObjectsThatHaveExternalUrlInCollection.push(mongoLookupResults.externalUrlLookup);

        // 2.2 Correct URL dump to a  TODO // expecting array of [0] err and [1] mo or null
        mediaObjectsThatHaveCorrectLocalUrlInCollection.push(mongoLookupResults.internalUrlLookup);

        moMongoInvestigationCallback(null, true); // APEP TODO must pass through some params here
    });

}, function(err, moInvestigationResults){
    async.parallel([
        function(cb) {
            fs.writeFile('./confirm-all-scene-json-urls/external-urls-in-collections.json', JSON.stringify(mediaObjectsThatHaveExternalUrlInCollection), 'utf8', function(){
                console.log("external-urls-in-collections.json file created");
                cb();
            });
        },
        function(cb) {
            fs.writeFile('./confirm-all-scene-json-urls/internal-urls-in-collections.json', JSON.stringify(mediaObjectsThatHaveCorrectLocalUrlInCollection), 'utf8', function(){
                console.log("internal-urls-in-collections.json file created");
                cb();
            });
        }
    ], function(err, results) {
        // 3. For correct URL in collection but not scene JSON
        async.everyLimit(mediaObjectsThatHaveCorrectLocalUrlInCollection, 1, function(data, switchSceneJsonUrlCb) {

            if(!data.mediaObject) {
                return switchSceneJsonUrlCb(null, false);
            }

            var oldUrl = data.mo.url;
            var newUrl = data.mediaObject[data.mo.type].url;

            // 4. Run the switch URL code and inspect error.
            assetStoreSwitchUrl(oldUrl, newUrl, function(err, assetStoreResponse){

                // 4.1 With error identified calculate avoidance strategy and run.
                if(err) throw err;

                console.log(assetStoreResponse.statusCode);
                console.log(assetStoreResponse.body);

                switchSceneJsonUrlCb(null, true);
            });
        }, function(err, results) {
            console.log("DONE");
            process.exit(1);
        });
    });
});




