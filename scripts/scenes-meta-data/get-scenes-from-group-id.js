"use strict";


function getMediaScenesForGroups(db, groupIds, callback) {
    db.mediaScenes.find({"_groupID": { $in: groupIds }}, callback);
}

function getMediaScenesForIds(db, ids, callback){
    db.mediaScenes.find({"_id": { $in: ids }}, callback);
}

function getMediaScenesForGroup(db, group, callback) {
    getMediaScenesForGroups(db, [group], callback);
}

module.exports = {
    getMediaScenesForGroups: getMediaScenesForGroups,
    getMediaScenesForGroup: getMediaScenesForGroup,
    getMediaScenesForIds: getMediaScenesForIds
};