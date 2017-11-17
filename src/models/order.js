'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var OrderSchema = new Schema({
  orderId: {
    type: String,
    required: 'orderId is required',
  },
  productId: {
    type: String,
    required: 'itemId is required',
  },
  userId: {
    type: String,
    required: 'userId is required',
  },
  price: {
    type: Number,
    required: 'price is required',
  },
  purchaseDate: {
    type: Date,
    required: 'purchaseDate',
  },
  platform: {
    type: String,
    required: 'platform is required',
  },
  cancelDate: {
    type: Date,
    default: null,
  },
  // startDate: {
  //   type: Date,
  //   default: Date.now,
  // },
  // endDate: {
  //   type: Date,
  // },
  versionKey: false,
})

module.exports = mongoose.model('Order', OrderSchema)
