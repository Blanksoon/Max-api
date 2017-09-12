'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VodSchema = new Schema({
  title: {
    type: String,
    required: 'title is required',
    unique: true
  },
  on_air_date: {
    type: Object,
    required: 'on_air_date is required'
  },
  duration: {
    type: Number,
    required: 'duration is required'
  },
  video_url: {
    type: String,
    required: 'video_url is required'
  },
  long_url: {
    type: String,
    required: 'video_url is required'
  },
  status: {
    type: [{
      type: String,
      enum: ['pending','active','inactive']
    }],
    default: 'pending'
  },
  versionKey: false
});

module.exports = mongoose.model('Vod', VodSchema);