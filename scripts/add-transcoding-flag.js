/**
 * Created by aaronphillips on 15/11/2016.
 */
'use strict';
var _ = require('lodash');
var mongo = require('mongojs');

var config = {
    mongo: process.env.HUB_MONGO,
};

var db = mongo.connect(config.mongo, ['mediaScenes', 'videomediaobjects']);

db.videomediaobjects.find({}, function(err, vmobs){

    _.forEach(vmobs, function(vmob){

        db.mediaScenes.findOne({"scene.url": { $regex: '.*' + vmob._id + '.*'}}, function(err, data){
            if(!err) {
                db.videomediaobjects.update({_id: vmob._id}, { $set: { ignore: data ? false : true}}, function(err, done) {
                    if(!err) {
                        console.log("Updated vmod");
                    }
                });
            }

        });
    });
});







