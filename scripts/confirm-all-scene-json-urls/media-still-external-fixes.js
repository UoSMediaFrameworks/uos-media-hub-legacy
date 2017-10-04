// APEP suspected schema validation save errors for images with shit IDs somewhere in Scene JSON data
var async = require('async');
var mongo = require('mongojs');
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
    db[mediaTypeToMongoCollectionTable[mo.type]].findOne(findQuery, cb);
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
        console.log(mongoLookupResults.externalUrlLookup);
        mediaObjectsThatHaveExternalUrlInCollection.push(mongoLookupResults.externalUrlLookup);

        // 2.2 Correct URL dump to a  TODO // expecting array of [0] err and [1] mo or null
        console.log(mongoLookupResults.internalUrlLookup);
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
        console.log("DONE");
        process.exit(1);
    });
});



// 3. For correct URL in collection but not scene JSON

// 4. Run the switch URL code and inspect error.

// 4.1 With error identified calculate avoidance strategy and run.