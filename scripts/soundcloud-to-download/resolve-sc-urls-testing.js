"use strict";
var request = require("request");

const CLIENT_ID = "ccf95ea3542bd418ae5f510ef272d551";

const URL = "https://soundcloud.com/snakehips-1/snakehips-all-my-friends-ft-tinashe-chance-the-rapper-wave-racer-remix";
// const URL = "http://soundcloud.com/matas/hobnotropic";
// http://api.soundcloud.com/resolve?url=https://soundcloud.com/snakehips-1/snakehips-all-my-friends-ft-tinashe-chance-the-rapper-wave-racer-remix&client_id=ccf95ea3542bd418ae5f510ef272d551
// http://api.soundcloud.com/resolve?url=http://soundcloud.com/matas/hobnotropic&client_id=ccf95ea3542bd418ae5f510ef272d551

const SC_BASE = "http://api.soundcloud.com/resolve?url=";
const SC_PARAM = "&client_id=";

request.get(SC_BASE + URL + SC_PARAM + CLIENT_ID, function(err, http, body){
   console.log("err: ", err);
   console.log("http.statusCode: ", http.statusCode);
   console.log("body: ", body);
});