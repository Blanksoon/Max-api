'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var PackageSchema = new Schema({
  description: {
    type: String,
    required: 'description is required',
  },
  title_en: {
    type: String,
    default: null,
  },
  price: {
    type: Number,
    required: 'price is required',
  },
  status: {
    type: String,
    default: 'enable',
  },
  versionKey: false,
})

module.exports = mongoose.model('Package', PackageSchema)
