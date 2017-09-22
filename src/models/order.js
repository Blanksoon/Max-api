'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var OrderSchema = new Schema({
  userId: {
    type: String,
    required: 'userId is required',
    unique: true,
  },
  itemId: {
    type: String,
    required: 'itemId is required',
  },
  startDate: {
    type: String,
    default: 'startDate is required',
  },
  endDate: {
    type: String,
    default: 'endDate is required',
  },
  versionKey: false,
})

module.exports = mongoose.model('Order', OrderSchema)
