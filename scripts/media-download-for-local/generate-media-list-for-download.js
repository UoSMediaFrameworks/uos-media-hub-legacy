'use strict';

// APEP : RUN SCRIPT WITHIN SCRIPTS DIRECTORY (ie cd /scripts)

var mongo = require('mongojs');
var generateMediaListUtils = require('./generate-media-list-util');

var config = {
    mongo: process.env.HUB_MONGO
};

var db = mongo.connect(config.mongo, ['mediaScenes', 'imagemediaobjects', 'videomediaobjects']);

const BLOB_STORAGE_HOST = "uosassetstore.blob.core.windows.net";

var sceneId = "58d2e9a5595a37c8a76cdfe8";

generateMediaListUtils.processScene(db, BLOB_STORAGE_HOST, sceneId);




