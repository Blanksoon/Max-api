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
    default: null,
  },
  lastname: {
    type: String,
    default: null,
  },
  gender: {
    type: String,
    default: null,
  },
  date_birth: {
    type: Date,
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
  fb_info: {
    type: Object,
    default: null,
  },
  status: {
    type: String,
    default: 'active',
  },
  braintree: {
    paymentMethod: String,
  },
  stripe: {
    customerId: String,
  },
  createDate: {
    type: Date,
    default: Date.now(),
  },
  deviceToken: {
    type: String,
  },
  versionKey: false,
})

module.exports = mongoose.model('User', UserSchema)
