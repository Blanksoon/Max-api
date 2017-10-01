'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var LiveSchema = new Schema({
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
  OnAirDate: {
    type: String,
    required: 'OnAirDate is required',
  },
  promoUrl: {
    type: String,
    required: 'promoUrl is required',
  },
  fightcardUrl: {
    type: String,
    required: 'fightcardUrl is required',
  },
  videoUrl: {
    type: String,
    required: 'videoUrl is required',
  },
  description_en: {
    type: String,
    required: 'description_en is required',
  },
  description_th: {
    type: String,
    required: 'description_th is required',
  },
  bannerUrl: {
    type: String,
    required: 'bannerUrl is required',
  },
  thumbnailUrl: {
    type: String,
    required: 'thumbnailUrl is required',
  },
  shortDescription_en: {
    type: String,
    required: 'shortDescription_en is required',
  },
  shortDescription_th: {
    type: String,
    required: 'shortDescription_th is required',
  },
  channel: {
    type: String,
    required: 'channel is required',
  },
  versionKey: false,
})

module.exports = mongoose.model('Live', LiveSchema)
