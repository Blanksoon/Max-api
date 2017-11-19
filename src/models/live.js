import mongoose from 'mongoose'
import moment from 'moment-timezone'

const Schema = mongoose.Schema

const liveSchema = new Schema({
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

  // Auto calculated fields
  liveFromDate: Date,
  liveToDate: Date,
  liveDateStr_en: String,
})

// Method to auto caculate following fields
// - liveFromDate
// - liveToDate
// - liveDateStr_en
function addLiveDate(live) {
  if (live) {
    const curDate = new Date()
    // Calculate this live liveDate for this week
    const liveDate = new Date()
    liveDate.setDate(
      curDate.getDate() + (7 + live.liveDay - curDate.getDay()) % 7
    )
    // Covert liveDate to ISO string
    const dateStr = `${liveDate.getFullYear()}-${liveDate.getMonth() +
      1}-${liveDate.getDate()}`
    // Concat liveDate with startTime and endTime
    live.liveFromDate = new Date(`${dateStr}T${live.startTime}+0700`)
    live.liveToDate = new Date(`${dateStr}T${live.endTime}+0700`)

    // The live for current week has already ended
    if (curDate.getTime() > live.liveToDate.getTime()) {
      live.liveFromDate.setDate(live.liveFromDate.getDate() + 7)
      live.liveToDate.setDate(live.liveToDate.getDate() + 7)
    }

    const liveFromTime = moment
      .tz(live.liveFromDate, 'Asia/Bangkok')
      .format('HH:mm')
    const liveToTime = moment
      .tz(live.liveToDate, 'Asia/Bangkok')
      .format('HH:mm')
    // Sat. Oct, 21st, 2017
    live.liveDateStr_en = moment
      .tz(live.liveFromDate, 'Asia/Bangkok')
      .format('ddd. MMM Do, YYYY')

    live.liveDateStr_en += ` (${liveFromTime} - ${liveToTime} GMT+7)`
  }
}

liveSchema.post('findOne', live => {
  addLiveDate(live)
})
liveSchema.post('find', lives => {
  lives.forEach(live => {
    addLiveDate(live)
  })
})
module.exports = mongoose.model('Live', liveSchema)
