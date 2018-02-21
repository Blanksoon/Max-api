'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var NewsSchema = new Schema({
  heading_th: {
    type: String,
    required: 'heading_th is required',
  },
  heading_en: {
    type: String,
    required: 'heading_en is required',
  },
  article_en: {
    type: String,
    required: 'article_en is required',
  },
  article_th: {
    type: String,
    required: 'article_th is required',
  },
  programName: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  createDate: {
    type: Date,
  },
  versionKey: false,
})

module.exports = mongoose.model('News', NewsSchema)
