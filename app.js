var express = require('express'),
    app = express();

app.get('/', function (req, res) {
    res.send('Hello World');
});

var server = app.listen(process.env.PORT || 3000, function() {
   console.log('listening at http://%s:%s', server.address().address, server.address().port); 
});
