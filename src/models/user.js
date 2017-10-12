'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserSchema = new Schema({
  email: {
    type: String,
    required: 'email is required',
    unique: true,
  },
  password: {
    type: String,
    required: 'password is required',
  },
  fb_info: {
    type: Object,
    default: null,
  },
  status: {
    type: String,
    default: 'active',
  },
  versionKey: false,
})

module.exports = mongoose.model('User', UserSchema)
