var config      = require('./config')();
    app         = require('express')();
    mongoose    = require('mongoose');
    Vod         = require('./models/vod');
    User        = require('./models/user');
    bodyParser  = require('body-parser');

mongoose.connect('mongodb://localhost/max_api',{
  useMongoClient : true
}); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('secret', config.secret);
app.set('tokenLifetime', config.tokenLifetime);

var routes = require('./config/route');
routes(app);

app.listen(config.port, function(){
  console.log('Express server listening on port ' + config.port);
});