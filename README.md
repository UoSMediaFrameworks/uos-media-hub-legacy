MediaHub [![Build Status](https://travis-ci.org/Colum-SMA-Dev/MediaHub.svg?branch=master)](https://travis-ci.org/Colum-SMA-Dev/MediaHub)
========

Implementation of MediaHub API

Media Hub Client
--------

The hub serves a javascript library to be used for connecting back to the hub.  It is reachable at `http://<domain>:<port>/hub-api.js`.  

##### HubClient(url, password, socketIoOpts, callback)

Creates and returns a new instance of a HubClient.  

* `url` hosted location of hub
* `password` configured password on the Hub
* `socketIoOpts` object that will be passed to [socket.io client constructor](http://socket.io/docs/client-api/)
* `callback` function that accepts a single argument.  Will be called with a boolean value of true or false for successful authentication with the hub
