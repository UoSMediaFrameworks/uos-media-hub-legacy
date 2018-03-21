'use strict';

var bcrypt = require('bcrypt-nodejs');
var _ = require('lodash');

var user = {
    username: null,
    password: null,
    groupID: null,
    groupName: null
};

function generateUser(username, password, groupID, groupName) {
    // bcrypt.hashSync("test0101")

    var newUser = _.cloneDeep(user);

    newUser.username = username;
    newUser.password = bcrypt.hashSync(password);

    newUser.groupID = groupID;
    newUser.groupName = groupName;

    return newUser;
}

console.log(generateUser("admin2", "kittens", 0, "admin"));
