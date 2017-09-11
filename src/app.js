var config = require('./config')();
var app = require('express')();
var mongoose = require('mongoose');
var Vod = require('./models/vod');
var bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost/max_api',{
  useMongoClient : true
}); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./config/route');
routes(app);

app.listen(config.port, function(){
  console.log('Express server listening on port ' + config.port);
});