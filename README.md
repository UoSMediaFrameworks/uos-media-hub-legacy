MediaHub [![Build Status](https://travis-ci.org/Colum-SMA-Dev/MediaHub.svg?branch=master)](https://travis-ci.org/Colum-SMA-Dev/MediaHub)
========

## Development

After cloning the repository, install the dependencies:

```
npm install
```

Copy the example environment file and edit as you'd like.  

```
cp env-example.sh env.sh
```

Start up the server like so

```
./env.sh node app.js
```

## Deployment

Run as you would any node application.  You'll need to set the appropriate environment variables that are listed in [env-example.sh](env-example.sh)

## API


What follows is a higher level description of the API that a Hub makes available to clients.  This API is meant to be implemented on top of the [Socket.io protocol](https://github.com/Automattic/socket.io-protocol), so it will be defined in terms of the Socket.io client.  Socket.io solves many of the issues that would be faced in attempting to implement our own WebSocket solution, and can be substituted out in the future if needed.

A word on security:

If you don't want the hub password intercepted, make sure to run the hub over https/wss.

Most Web Applications will run their authentication through HTTPS, with the server generating some type of token for the client.  The client then makes a seperate WebSocket connection and passes the token with each communication sent through the WebSocket.  This process requires respecting [Same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy), remembering to allow for [CORS](https://en.wikipedia.org/wiki/Same-origin_policy#Cross-Origin_Resource_Sharing) when we want to allow grant access to clients not hosted on the same domain as the Hub.  Although this project is starting with browser based clients, it does not plan on being limited to them.  Therefore utilizing browser based security methods seems to be bad idea.  WebSockets are not subject to Same-origin policy and therefore restricting/authenticating clients will be done within the socket.  All sockets should be opened under wss:// so as to mask the password sent from the client during the "auth" event.


### Authenticating

All connected sockets must be authenticated immediately (within 10secs) of connection.  If not, the hub will close the socket.  Here's an example of making a connection:

```
var socket = io('https://mediahub.myurl.com');
socket.on('connect', function() {
    socket.emit('auth', {password: 'somepassword'}, function (error) {
        if (error) {
            // handle it somehow
        } else {
            // you're authenticated, so now you're free to emit() whatever messages you'd like
        }
    });
});
```

### Client Initiated Messages

#### auth

`"auth", {password: "<password>", token: "<token from previous session>"}, callback(error, token)`

Upon connection of the socket, the client should emit an `"auth"` event.  The authentication object can either have the `password` key or the `token` key.  If either are valid the hub will respond with a token (will be same token if `token` was sent), otherwise the socket is closed.  If 10 seconds has elapsed and no `"auth"` event has been recieved, then the Hub will close the socket connection.

#### saveScene

`"saveScene", <Scene Object>, callback(error, scene)`

Save a Scene to the database.

##### loadScene

`"loadScene", "<id of scene>", callback(error, scene)`

Get contents of a scene.  Server will reply with json object representing the scene.

`"loadScene", "<name of scene>", callback(error, scene)`

Get contents of a scene.  Server will reply with json object representing the scene. If more than one scene exists with that name, it'll return the first one.  


##### deleteScene 

`"deleteScene", "<id of scene>", optionalCallback(error)`

Delete specified scene from the database.

##### listScenes

`"listScenes", callback(error, scenes)`

Return a list of Scenes that can be subscribed to.  Will be an array of strings.

##### subScene

`"subScene", "<id of scene>", optionalCallback(error, scene)`

Subscribe to a Scene.  Server will reply with the current Scene object.  Additionally this will subscribe the client to updates to the Scene as it changes. 

##### unsubScene

`"unsubScene", "<id of scene>", optionalCallback(error)`

Unsubscribe from a Scene.

##### register

`"register", "<room id>"`

Register the client to recieve commands from other clients in that same room.

##### sendCommand

`"sendCommand", "<room id>", "<commandName>", <command object>`

Will dispatch the "command" messages to any other clients that are registered in the same room.



### Hub Initiated Messages

These are messages that you'll have to listen for on the socket. 

##### sceneUpdate

`"sceneUpdate"`

If you have previously subscribed to the scene using "subScene", your client will be sent update messages.  Listen for them like so:

```
socket.on('sceneUpdate', function(scene) {
    // do something with the scene
});
```

##### command

`"command"`

If a client triggers a "sendCommand" to a room, any client registered in that room will recieve the command.

```
socket.on('command', function(commandData) {
    // do something with commandData
});
```


## Scene Schema

Included is a [JSON Schema](http://json-schema.org/) for a validation purposes and understanding the format of a media scene: [media-scene-schema.json](docs/media-scene-schema.json).
