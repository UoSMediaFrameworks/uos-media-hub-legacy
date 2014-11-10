var hub = require('./src/hub').createHub();
    
hub.start(process.env.PORT || 3000);