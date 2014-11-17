MediaHub [![Build Status](https://travis-ci.org/Colum-SMA-Dev/MediaHub.svg?branch=master)](https://travis-ci.org/Colum-SMA-Dev/MediaHub)
========

Implementation of MediaHub API

Media Hub Client
--------

The hub serves a javascript library to be used for connecting back to the hub.  It is reachable at `http://<domain>:<port>/hub-api.js`.  

##### `HubClient(url, socketIoOpts)`

Creates and returns a new instance of a HubClient.  

* `url` hosted location of hub
* `socketIoOpts` object that will be passed to [socket.io client constructor](http://socket.io/docs/client-api/)

##### `authenticate(password)`

Returns a promise that is fulfilled on succesful authentication, and rejected on failed.

* `password` configured password on the Hub

##### `saveScene(mediaScene)`

Returns a promise that is fulfilled on succesful saving of scene to the database.  Promise is rejected if saving fails.

* `mediaScene` Object that represents a MediaScene
