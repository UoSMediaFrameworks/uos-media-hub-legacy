MediaHub [![Build Status](https://travis-ci.org/Colum-SMA-Dev/MediaHub.svg?branch=master)](https://travis-ci.org/Colum-SMA-Dev/MediaHub)
========

## Development

After cloning the repository, install the dependencies:

```
npm install
```

Copy the example config file and edit as you'd like.  

```
cp config-example.js config.js
```

Start up the server

```
node app.js
```

## Deployment

Run as you would any node application.  Note that you'll either have to create a config.js where you deploy, or set the appropriate environment variables that are read in [app.js](app.js)