
// APEP Script TODOs
// APEP find all vmo, amo, imo that have the old CDN url
// APEP take old CDN url and replace with new CDN url

// APEP we then need to update all scene JSON urls (we have an API built for this)
var _ = require('lodash');
var mongo = require('mongojs');
var async = require('async');
var request = require('request');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo(config.mongo, ['imagemediaobjects', 'audiomediaobjects', 'videomediaobjects']);

const OLD_CDN_BASE_URL = "https://uosassetstore.blob.core.windows.net/assetstoredev/";
const NEW_CDN_BASE_URL = "http://mediaframework:8090/";

const assetStoreUrlAndPort = "http://mediaframework:4000";
const assetStoreSwitchURLAPI = "/upload/convert";

function moNeedsUrlSwitch(mo, type) {
    if(type === "video"){
        console.log("mo[type].url: ", mo[type].url);
    }
    return mo[type].url.indexOf(OLD_CDN_BASE_URL) !== -1;
}

function assetStoreSwitchUrl(oldUrl, newUrl, callback){
    var formData = {
        oldUrl: oldUrl,
        newUrl: newUrl
    };
    console.log("assetStoreSwitchUrl - formData: ", formData);

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

async.parallel({
    images: function(cb) {
        db.imagemediaobjects.find({}, function (err, mos) {
            if (err) cb(err, null);

            console.log("imos.length: ", mos.length);

            cb(null, _.filter(mos, function(mo){
                return moNeedsUrlSwitch(mo, "image");
            }));
        });
    },
    audios: function(cb) {
        db.audiomediaobjects.find({}, function (err, mos) {
            if (err) cb(err, null);

            console.log("amos.length: ", mos.length);

            cb(null, _.filter(mos, function(mo){
                return moNeedsUrlSwitch(mo, "audio");
            }));
        });
    },
    videos: function(cb) {
        db.videomediaobjects.find({}, function (err, mos) {
            if (err) cb(err, null);

            console.log("vmos.length: ", mos.length);

            cb(null, _.filter(mos, function(mo){
                return moNeedsUrlSwitch(mo, "video");
            }));
        });
    }
}, function(err, databaseValues){
    // APEP now we have all the vmo, amo and imos

    if(err) throw err;

    console.log("databaseValues.images.length", databaseValues.images.length);
    console.log("databaseValues.videos.length", databaseValues.videos.length);
    console.log("databaseValues.audios.length", databaseValues.audios.length);

    async.parallelLimit([
        function(cb){
            async.every(databaseValues.images, function(imo, callback) {
                var query = {'image.url': imo.image.url};
                var update = {$set: {'image.url': imo.image.url.replace(OLD_CDN_BASE_URL, NEW_CDN_BASE_URL)}};
                db.imagemediaobjects.update(query, update, function(err, result){
                    callback(err, result);
                });
            }, function(err,results){
               cb(err, results);
            });
        },
        function(cb){
            async.every(databaseValues.audios, function(amo, callback) {
                var query = {'audio.url': amo.audio.url};
                var update = {$set: {'audio.url': amo.audio.url.replace(OLD_CDN_BASE_URL, NEW_CDN_BASE_URL)}};
                db.audiomediaobjects.update(query, update, function(err, result){
                    callback(err, result);
                });
            }, function(err,results){
                cb(err, results);
            });
        },
        function(cb){
            async.every(databaseValues.videos, function(vmo, callback) {
                var query = {'video.url': vmo.video.url};
                var update = {$set: {'video.url': vmo.video.url.replace(OLD_CDN_BASE_URL, NEW_CDN_BASE_URL)}};
                db.videomediaobjects.update(query, update, function(err, result){
                    callback(err, result);
                });
            }, function(err,results){
                cb(err, results);
            });
        },
    ], 1, function(err, results){
        if(err) throw err;

        async.parallelLimit([
            function(cb){
                async.every(databaseValues.images, function(imo, callback) {
                    assetStoreSwitchUrl(imo.image.url, imo.image.url.replace(OLD_CDN_BASE_URL, NEW_CDN_BASE_URL), callback);
                }, function(err,results){
                    cb(err, results);
                });
            },
            function(cb){
                async.every(databaseValues.audios, function(amo, callback) {
                    assetStoreSwitchUrl(amo.audio.url, amo.audio.url.replace(OLD_CDN_BASE_URL, NEW_CDN_BASE_URL), callback);
                }, function(err,results){
                    cb(err, results);
                });
            },
            function(cb){
                async.every(databaseValues.videos, function(vmo, callback) {
                    assetStoreSwitchUrl(vmo.video.url, vmo.video.url.replace(OLD_CDN_BASE_URL, NEW_CDN_BASE_URL), callback);
                }, function(err,results){
                    cb(err, results);
                });
            },
        ], 1, function(err, results){
            if(err) throw err;

            console.log("ALL updates complete");
            process.exit(1);
        });
    });
});