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
  name: {
    type: String,
    default: 'undefiend',
  },
  lastname: {
    type: String,
    default: 'undefiend',
  },
  gender: {
    type: String,
    default: 'undefined',
  },
  date_birth: {
    type: String,
    default: 'undefined',
  },
  country: {
    type: String,
    default: 'undefined',
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
