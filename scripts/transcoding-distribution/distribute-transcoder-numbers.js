/**
 * Created by aaronphillips on 16/11/2016.
 */
'use strict';
var _ = require('lodash');
var mongo = require('mongojs');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes', 'videomediaobjects']);

var bucketCache = {
    "bucket1": 0,
    "bucket2": 0,
    "bucket3": 0,
    "bucket4": 0,
    "bucket5": 0,
    "bucket6": 0,
    "bucket7": 0,
    "bucket8": 0
};

var getTranscoderNumberFromBucketId = function(bID) {
    var bucketId = bID.replace('bucket', '');

    if(bucketId > 0 && bucketId < 5) { //1 - 3
        return 1;
    } else if (bucketId > 4 && bucketId < 9) { // 6-8
        return 4;
    }
};

var getTranscoderNumber = function(fileSize) {
    
    var buckets = [ 
        { id: "bucket1", value: bucketCache.bucket1 }, 
        { id: "bucket2", value: bucketCache.bucket2 }, 
        { id: "bucket3", value: bucketCache.bucket3 },
        { id: "bucket4", value: bucketCache.bucket4 },
        { id: "bucket5", value: bucketCache.bucket5 },
        { id: "bucket6", value: bucketCache.bucket6 },
        { id: "bucket7", value: bucketCache.bucket7 },
        { id: "bucket8", value: bucketCache.bucket8 },
    ];
    
    var sortedBuckets = _.sortBy(buckets, function(bucket){
        return bucket.value
    });
    
    console.log("sortedBuckets: ", sortedBuckets);

    var smallestBucket = sortedBuckets[0];
    
    bucketCache[smallestBucket.id] = bucketCache[smallestBucket.id] + fileSize;
    
    return getTranscoderNumberFromBucketId(smallestBucket.id);
};

//A way to set bucketN to a transcoder

var applyChangeToDB = true;

db.videomediaobjects.find({ hasTranscoded: false }, function(err, vmobs){
    
    
    _.forEach(vmobs, function(vmob){
        
        var transcoderNo = getTranscoderNumber(vmob.video.size);

        console.log("transcoderNo: ", transcoderNo);

        if(applyChangeToDB) {
            db.videomediaobjects.update({_id: vmob._id}, { $set: { transcoder: transcoderNo}}, function(err, done) {
                if(!err) {
                    console.log("Updated vmod done: ", done);
                }
            });
        }
    });

});