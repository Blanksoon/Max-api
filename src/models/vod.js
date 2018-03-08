import mongoose from 'mongoose'
import moment from 'moment-timezone'
import { jwplayerUrl } from '../utils/jwplayer'

const Schema = mongoose.Schema

const vodSchema = new Schema({
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
  },
  promoToTime: {
    type: String,
  },
  free: {
    type: String,
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
    //required: 'promoUrl is required',
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
  },
  onAirDateStr_th: {
    type: String,
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

vodSchema.post('findOne', vod => {
  if (vod === null) {
  } else {
    vod.promoUrl = jwplayerUrl(vod.promoUrl)
    vod.videoUrl = jwplayerUrl(vod.videoUrl)
    vod.onAirDateStr_en = moment(vod.onAirDate).format('ddd. MMM Do, YYYY')
    vod.onAirDateStr_th = moment(vod.onAirDate)
      .locale('th')
      .format('ddd. MMM Do, YYYY')
  }
})
vodSchema.post('find', vods => {
  if (vods === null) {
  } else {
    vods.forEach(vod => {
      vod.promoUrl = jwplayerUrl(vod.promoUrl)
      vod.videoUrl = jwplayerUrl(vod.videoUrl)
      vod.onAirDateStr_en = moment(vod.onAirDate).format('ddd. MMM Do, YYYY')
      vod.onAirDateStr_th = moment(vod.onAirDate)
        .locale('th')
        .format('ddd. MMM Do, YYYY')
    })
  }
})
module.exports = mongoose.model('Vod', vodSchema)
