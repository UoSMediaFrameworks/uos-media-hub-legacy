/**
 * Created by aaronphillips on 14/03/2017.
 */
'use strict';

// APEP : RUN SCRIPT WITHIN SCRIPTS DIRECTORY (ie cd /scripts)

var _ = require('lodash');
var mongo = require('mongojs');
var fs = require('fs');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes']);

const BLOB_STORAGE_HOST = "uosassetstore.blob.core.windows.net";

const NARM_GROUP_ID = 112;

var tagDistribution = {
    
};

db.mediaScenes.find({"_groupID": NARM_GROUP_ID}, function(err, scenes){

    if(err) throw err;

    _.forEach(scenes, function(scene){

        _.forEach(scene.scene, function(mo){
            if (mo.tags.length > 0) {
                var tags = mo.tags.split(",");

                _.forEach(tags, function(tag){
                    
                    tag = tag.trim();
                    
                    if(tagDistribution.hasOwnProperty(tag)) {
                        // if(tagDistribution[tag].hasOwnProperty(scene._id)) {
                        if(tagDistribution[tag].hasOwnProperty(scene.name)) {
                            // tagDistribution[tag][scene._id]++;
                            tagDistribution[tag][scene.name]++;
                        } else {
                            // tagDistribution[tag][scene._id] = 1;
                            tagDistribution[tag][scene.name] = 1;
                        }
                    } else {
                        tagDistribution[tag] = {
                        };
                        // tagDistribution[tag][scene._id] = 1;
                        tagDistribution[tag][scene.name] = 1;
                    }
                });
            } 
        });

    });
    

    fs.writeFile('tag-distribution/tag-distribution.json', JSON.stringify(tagDistribution), 'utf8', function(){
        console.log("tagDistribution record file created");
    });

});