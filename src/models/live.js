'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var LiveSchema = new Schema({
  productId: {
    type: String,
    required: 'productId is required',
  },
  programName: {
    type: String,
    required: 'programName is required',
  },
  title_en: {
    type: String,
    required: 'title_en is required',
  },
  title_th: {
    type: String,
    required: 'title_th is required',
  },
  showOrder: {
    type: Number,
    required: 'showOrder is required',
  },
  startTime: {
    type: String,
    required: 'startTime is required',
  },
  endTime: {
    type: String,
    required: 'endTime is required',
  },
  liveDay: {
    type: String, // 0 - Sunday, 6 - Saturday
    required: 'liveDay is required',
  },
  shortDesc1_en: {
    type: String,
    required: 'shortDesc1_en is required',
  },
  shortDesc1_th: {
    type: String,
    required: 'shortDesc1_th is required',
  },
  shortDesc2_en: {
    type: String,
    required: 'shortDesc2_en is required',
  },
  shortDesc2_th: {
    type: String,
    required: 'shortDesc1_th is required',
  },
  desc_en: {
    type: String,
    required: 'desc_en is required',
  },
  desc_th: {
    type: String,
    required: 'desc_th is required',
  },
  fightcardUrl: {
    type: String,
    required: 'fightcardUrl is required',
  },
  videoUrl: {
    type: String,
    required: 'videoUrl is required',
  },
  promoUrl: {
    type: String,
    required: 'promoUrl is required',
  },
  bannerUrl: {
    type: String,
    required: 'bannerUrl is required',
  },
  logoUrl: {
    type: String,
    required: 'logoUrl is required',
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

module.exports = mongoose.model('Live', LiveSchema)
