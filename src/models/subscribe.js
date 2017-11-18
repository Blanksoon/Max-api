'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var SubscribeSchema = new Schema({
  productId: {
    type: String,
    required: 'itemId is required',
  },
  price: {
    type: Number,
    required: 'price is required',
  },
  versionKey: false,
})

module.exports = mongoose.model('Subscribe', SubscribeSchema)