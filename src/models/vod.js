'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var VodSchema = new Schema({
  programName_en: {
    type: String,
    required: 'programName_en is required',
  },
  programName_th: {
    type: String,
    required: 'programName_th is required',
  },
  promoFromTime: {
    type: String,
    required: 'promoFromTime is required',
  },
  promoToTime: {
    type: String,
    required: 'promoToTime is required',
  },
  free: {
    type: String,
    required: 'free is required',
  },
  thumbnailUrl: {
    type: String,
    required: 'thumbnailUrl is required',
  },
  logoUrl: {
    type: String,
    required: 'logoUrl is required',
  },
  videoUrl: {
    type: String,
    required: 'videoUrl is required',
  },
  promoUrl: {
    type: String,
    required: 'promoUrl is required',
  },
  title_en: {
    type: String,
    required: 'title_en is required',
  },
  title_th: {
    type: String,
    required: 'title_th is required',
  },
  onAirDateStr_en: {
    type: String,
    required: 'onAirDateStr_en is required',
  },
  onAirDateStr_th: {
    type: String,
    required: 'onAirDateStr_th is required',
  },
  onAirDate: {
    type: Date,
    required: 'onAirDate is required',
  },
  desc_en: {
    type: String,
    required: 'desc_en is required',
  },
  desc_th: {
    type: String,
    required: 'desc_th is required',
  },
  duration: {
    type: String,
    required: 'duration is required',
  },
  feature: {
    type: String,
    required: 'feature is required',
  },
  versionKey: false,
})

module.exports = mongoose.model('Vod', VodSchema)
