'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var NoticeSchema = new Schema({
  userId: {
    type: String,
    required: 'userId is required',
  },
  notificationTopicEn: {
    type: String,
    required: 'notificationTopic is required',
  },
  notificationContentEn: {
    type: String,
    required: 'notificationContent is required',
  },
  notificationTopicTh: {
    type: String,
    required: 'notificationTopicTh is required',
  },
  notificationContentTh: {
    type: String,
    required: 'notificationContentTh is required',
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
  notificationType: {
    type: String,
    default: null,
  },
  versionKey: false,
})

module.exports = mongoose.model('Notifications', NoticeSchema)
