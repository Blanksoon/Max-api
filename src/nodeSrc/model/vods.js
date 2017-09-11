// grab the things we need
var mongoose = require('mongoose');
var options = {
  useMongoClient: true
};

mongoose.connect('mongodb://mongo/max_api', options);

var Schema = mongoose.Schema;

// create a schema
var vodSchema = new Schema({
  title: { type: String, required: true, unique: true },
  duration : Number,
  on_air_date: Date,
  video_url : String,
  long_url : String
});

// the schema is useless so far
// we need to create a model using it
var Vods = mongoose.model('vods', vodSchema);

// make this available to our users in our Node applications
module.exports = Vods;