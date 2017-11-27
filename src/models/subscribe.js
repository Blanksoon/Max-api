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
  status: {
    type: String,
    default: 'enable',
  },
  billingPlanId: {
    type: String,
    default: null,
  },
  billingPlanIdBraintree: {
    type: String,
    default: null,
  },
  title_en: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  versionKey: false,
})

module.exports = mongoose.model('Subscribe', SubscribeSchema)
