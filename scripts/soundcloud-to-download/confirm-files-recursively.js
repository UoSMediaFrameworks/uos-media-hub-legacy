"use strict";

// APEP simple script for looking at a downloaded set of files for the soundcloud process.
// this script is one to simply run and that's it, no other script can use it.
// Was used to confirm how many assets were downloaded per unique soundcloud URL.

var recursive = require("recursive-readdir");
var path = require("path");
var fs = require('fs');

var p = "../soundcloud-downloads";
// var absolutePath = path.resolve(p);

recursive(p, function (err, files) {
    // `files` is an array of absolute file paths
    console.log(files.length);
});

fs.readdir(p, function (err, files) {
    if (err) {
        throw err;
    }

    files.map(function (file) {
        return path.join(p, file);
    }).filter(function (file) {
        return fs.statSync(file).isDirectory();
    }).forEach(function (directory) {
        recursive(directory, function (err, files) {
            if(files.length !== 1)
                console.log("%s [files: %s] (%s)", directory, files.length, path.resolve(directory));
        });
    });
});