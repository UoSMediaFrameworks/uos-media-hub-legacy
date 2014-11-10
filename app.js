var hub = require('./src/hub').createHub();
    
hub.listen(process.env.PORT || 3000);