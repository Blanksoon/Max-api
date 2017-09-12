'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  email: {
    type: String,
    required: 'email is required'
  },
  password: {
    type: String,
    required: 'password is required'
  },
  fb_info: {
    type: Object,
    default: null
  },
  status: {
    type: [{
      type: String,
      enum: ['active', 'inactive']
    }],
    default: 'active'
  },
  versionKey: false
});

module.exports = mongoose.model('User', UserSchema);