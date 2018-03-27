'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var PostersSchema = new Schema({
  posterTh: {
    type: String,
  },
  posterEn: {
    type: String,
  },
  createDate: {
    type: Date,
  },
  versionKey: false,
})

module.exports = mongoose.model('Posters', PostersSchema)
