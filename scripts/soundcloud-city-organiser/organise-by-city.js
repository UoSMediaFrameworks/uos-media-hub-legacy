// Load config and create a folder per city
const fs = require('fs');
var fsExtra = require("fs-extra");
const fsPromise = require('fs').promises;
const _ = require('lodash');
const sha1 = require('sha1');

let gdcGroups = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];

let config = {
    cities: [{
            _groupdId: 101,
            name: "Chicago"
        },
        {
            _groupdId: 102,
            name: "Beijing"
        },
        {
            _groupdId: 103,
            name: "Dalian"
        },
        {
            _groupdId: 104,
            name: "KualaLumpur"
        },
        {
            _groupdId: 105,
            name: "Seoul"
        },
        {
            _groupdId: 106,
            name: "Manchester"
        },
        {
            _groupdId: 107,
            name: "Chengdu"
        },
        {
            _groupdId: 108,
            name: "HongKong"
        },
        {
            _groupdId: 109,
            name: "Shenyang"
        },
        {
            _groupdId: 110,
            name: "Panjin"
        },
    ],
    mongoUri: process.env.MONGO_URI,
    mongoDatabaseName: process.env.MONGO_DB
}

const citiesFolderPath = "./soundcloud-city-organiser/organised-downloaded"

let createCityFolders = () => {
    new Promise((resolve, reject) => {
        // check we are in the correct directory
        let folder = fs.existsSync(citiesFolderPath)

        if (!folder)
            return reject("missing directory");

        config.cities.forEach(city => {
            fs.mkdirSync(citiesFolderPath + "/" + city.name);
        });

        resolve();
    });
}

// Detect all folder names from downloaded folder
const downloadedFolder = "./soundcloud-city-organiser/downloaded";

let parseDownloadedFolder = function () {
    return new Promise((resolve, reject) => {
        fs.readdir(downloadedFolder, function (err, items) {
            if (err)
                return reject(err);

            resolve(items);
        });
    });
}

// Search MF Database for audio media object _id

const MongoClient = require('mongodb').MongoClient;

let getDatabaseConnection = function () {
    return new Promise((resolve, reject) => {
        MongoClient.connect(config.mongoUri, function (err, client) {
            if (err)
                return reject(err);

            const db = client.db(config.mongoDatabaseName);

            resolve(db);
        });
    });
}

let getSceneGroupId = function (amodId, scenes) {
    return new Promise((resolve, reject) => {
        let foundScenes = _.filter(scenes, scene => {
            //console.log(scene);

            let result = _.filter(scene.scene, mo => {

                if (mo.type !== 'audio')
                    return false;

                return sha1(mo.url) === amodId
            }).length > 0

            return result;
        });

        resolve(foundScenes);

    });
}

// Determine which city, if any it is part of
// Copy/Move folder to organised folder structure
let moveAudioDownloadToCity = (amoId, scenes) => {
    console.log(`amoId ${amoId} scenes ${scenes.length}`)
    scenes.forEach(scene => {
        let cities = _.filter(config.cities, (city) => city._groupdId === scene._groupID);

        cities.forEach(city => {
            console.log(`copying folder ${citiesFolderPath + "/" + amoId} to ${citiesFolderPath + "/" + city.name} `);
            fsExtra.copy(downloadedFolder + "/" + amoId, citiesFolderPath + "/" + city.name);
        });
    });
}

let getAllScenes = (db) => {

    return new Promise((resolve, reject) => {
        db.collection("mediaScenes").find({"_groupID": { "$in": gdcGroups}}).toArray(function(err, scenes) {
            if (err)
                return reject(err);


            resolve(scenes);
        });
    })
}

getDatabaseConnection()
    .then(db => {
        parseDownloadedFolder()
            .then(amoIds => {
                //console.log(amoIds);

                getAllScenes(db)
                    .then(scenes => {

                        amoIds.forEach(amoId => {
                            getSceneGroupId(amoId, scenes)
                                .then(foundScenes => {
                                    // console.log("4.n");
                                    moveAudioDownloadToCity(amoId, foundScenes);
                                })
                                .catch(err => {
                                    console.error("4.n", err);
                                })
                        })

                    })
                    .catch(err => {
                        console.error("3", err);
                    })
            })
            .catch(err => {
                console.error("2", err);
            });
    })
    .catch(err => {
        console.error("1", err);
    });



