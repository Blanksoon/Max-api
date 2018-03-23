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
    type: String,
    required: 'notificationDate is required',
  },
  isRead: {
    type: String,
  },
  isActive: {
    type: String,
  },
  sendDate: {
    type: Date,
  },
  versionKey: false,
})

module.exports = mongoose.model('Notifications', NoticeSchema)
