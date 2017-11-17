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
  expiredDate: {
    type: Date,
    required: 'expiredDate is required',
    //default: null,
  },
  status: {
    type: String,
    required: 'status is required',
  },
  // endDate: {
  //   type: Date,
  // },
  versionKey: false,
})

module.exports = mongoose.model('Order', OrderSchema)
