import mongoose, { version } from 'mongoose'

const Schema = mongoose.Schema

const settingSchema = new Schema({
  android_version: {
    type: String,
    required: 'android_version is required',
  },
  android_link: {
    type: String,
    required: 'android_link is required',
  },
  ios_version: {
    type: String,
    required: 'ios_version is required',
  },
  ios_link: {
    type: String,
    required: 'ios_link is required',
  },
  versionKey: false,
})

module.exports = mongoose.model('Setting', settingSchema)
