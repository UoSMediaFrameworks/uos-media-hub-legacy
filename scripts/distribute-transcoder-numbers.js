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


var transcoderNumber = 1;

const MAX_TRANS_NUMBER = 4;

var getTranscoderNumber = function() {

    if(transcoderNumber < MAX_TRANS_NUMBER) {
        transcoderNumber ++;
        return transcoderNumber;
    }

    transcoderNumber = 1;
    return transcoderNumber;

};

var applyChangeToDB = true;

db.videomediaobjects.find({ hasTranscoded: false, ignore: false}, function(err, vmobs){
    
    
    _.forEach(vmobs, function(vmob){
        //var transcoderNo = getTranscoderNumber();

        //console.log("transcoderNo: ", transcoderNo);

        if(applyChangeToDB) {
            db.videomediaobjects.update({_id: vmob._id}, { $set: { transcoder: 1/*transcoderNo*/}}, function(err, done) {
                if(!err) {
                    console.log("Updated vmod done: ", done);
                }
            });
        }
    });

});