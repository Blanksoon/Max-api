'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var NoticeSchema = new Schema({
  userId: {
    type: String,
    required: 'userId is required',
  },
  notificationTopic: {
    type: String,
    required: 'notificationTopic is required',
  },
  notificationContent: {
    type: String,
    required: 'notificationContent is required',
  },
  notificationDate: {
    type: Date,
    required: 'notificationDate is required',
  },
  isRead: {
    type: String,
    required: 'isRead is required',
  },
  isActive: {
    type: String,
    required: 'isActive is required',
  },
  versionKey: false,
})

module.exports = mongoose.model('Notifications', NoticeSchema)
