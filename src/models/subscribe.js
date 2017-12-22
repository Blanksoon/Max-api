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
  billingPlanStaging: {
    billingPlanId: String,
  },
  billingPlanProd: {
    billingPlanId: String,
  },
  billingPlanDev: {
    billingPlanId: String,
  },
  billingPlanBraintreeStaging: {
    billingPlanIdBraintree: String,
  },
  billingPlanBraintreeProd: {
    billingPlanIdBraintree: String,
  },
  billingPlanBraintreeDev: {
    billingPlanIdBraintree: String,
  },
  stripePlanId: {
    planId: String,
  },
  versionKey: false,
})

module.exports = mongoose.model('Subscribe', SubscribeSchema)
