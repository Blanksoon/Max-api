'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var OrderSchema = new Schema({
  userId: {
    type: String,
    required: 'userId is required',
  },
  productId: {
    type: String,
    required: 'itemId is required',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  versionKey: false,
})

module.exports = mongoose.model('Order', OrderSchema)
