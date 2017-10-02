"use strict";

// APEP simple helper script, given a list of URLS, check to see any sha1 hash of the URLs matches a candidate.
// Source: soundcloud conversion work - this is a helper script only.

var _ = require('lodash');
var sha1 = require('sha1');


/*
Four SC that need removing

 0acf0c79218b5defcd3301edc0c9f266c5d40ab9 = https://soundcloud.com/pedro-noe/game-of-thrones-main-title
 3e77a30fdcf72c3552df4ac50c14cc536f0f1097 = https://soundcloud.com/itsmelvv/glide?in=olivia-huo/sets/9dpfdasunlnc
 7ffa5b000725fefa1ea83fda91fb90048365bfcd = https://soundcloud.com/kini-noise/guzheng-song?in=joragupra/sets/guzheng
 be265d57b1e4c5b498dabee92c5ef466a8b08192 = https://soundcloud.com/falcantar32/rob-tone-chill-bill-bass-boosted
 e686074f4551408280800302840a91aed01e432a = https://soundcloud.com/live-happy-1
 */

var urlHash = "be265d57b1e4c5b498dabee92c5ef466a8b08192";

var records = require('./old/scene_soundcloud_records.json');

_.forEach(records, function(sceneRecord) {
    _.forEach(sceneRecord.sceneSoundCloudMediaObjects, function(amob){
        if(sha1(amob.url) === urlHash) {
            console.log(amob.url);
        }
    });
});