var defaultSuccessMessage = 'success'
var fetch = require('isomorphic-unfetch')
var moment = require('moment-timezone')
var defaultErrorMessage = 'data_not_found'
var jwt = require('jsonwebtoken')
var mongoose = require('mongoose'),
  Order = mongoose.model('Order')
Live = mongoose.model('Live')

//function
const readJwt = (token, req) => {
  return new Promise((resolve, reject) => {
    const error = {
      statusJwt: '',
      err: '',
    }
    jwt.verify(token, req.app.get('secret'), async function(err, decoded) {
      //console.log('decoded', decoded.data.email)
      if (err) {
        error.statusJwt = 'Failed to authenticate token.'
        error.err = err
        resolve(error)
      }
      resolve(decoded)
    })
  })
}

const queryOrder = query => {
  return new Promise((resolve, reject) => {
    let statusOders = ''
    Order.find(query)
      .then(function(order) {
        if (Object.keys(order).length != 0) {
          statusOders = 'you have purchase'
          resolve(statusOders)
        } else {
          statusOders = `you have't purchase`
          resolve(statusOders)
        }
      })
      .catch(function(err) {
        resolve(err.message)
      })
  })
}

async function createToken() {
  const server = 'http://139.59.127.206:8008'
  const apiKey = 'badc87ee-3c81-486f-9e3e-fee583dbc9c8'
  try {
    const response = await fetch(`${server}?apiKey=${apiKey}`)
    const json = await response.json()
    return json.token
  } catch (err) {
    return ''
  }
}

async function prepareData(data, vodUrl) {
  var outputPrepareData = []
  var newData = {}
  if (vodUrl == 'null') {
    data.forEach(function(record) {
      newData = {
        id: record._id,
        productId: record.productId,
        programName: record.programName,
        title_en: record.title_en,
        title_th: record.title_th,
        showOrder: record.showOrder,
        liveDateStr_en: record.liveDateStr_en,
        liveDateStr_th: record.liveDateStr_th,
        startTime: record.startTime,
        endTime: record.endTime,
        liveDay: record.liveDay,
        liveFromDate: record.liveFromDate,
        liveToDate: record.liveToDate,
        shortDesc1_en: record.shortDesc1_en,
        shortDesc1_th: record.shortDesc1_th,
        shortDesc2_en: record.shortDesc2_en,
        shortDesc2_th: record.shortDesc2_th,
        desc_en: record.desc_en,
        desc_th: record.desc_th,
        fightcardUrl: record.fightcardUrl,
        videoUrl: '',
        promoUrl: record.promoUrl,
        bannerUrl: record.bannerUrl,
        logoUrl: record.logoUrl,
        price: record.price,
      }
      outputPrepareData.push(newData)
    })
    return outputPrepareData
  } else {
    const token = await createToken()
    data.forEach(function(record) {
      newData = {
        id: record._id,
        productId: record.productId,
        programName: record.programName,
        title_en: record.title_en,
        title_th: record.title_th,
        showOrder: record.showOrder,
        liveDateStr_en: record.liveDateStr_en,
        liveDateStr_th: record.liveDateStr_th,
        startTime: record.startTime,
        endTime: record.endTime,
        liveDay: record.liveDay,
        liveFromDate: record.liveFromDate,
        liveToDate: record.liveToDate,
        shortDesc1_en: record.shortDesc1_en,
        shortDesc1_th: record.shortDesc1_th,
        shortDesc2_en: record.shortDesc2_en,
        shortDesc2_th: record.shortDesc2_th,
        desc_en: record.desc_en,
        desc_th: record.desc_th,
        fightcardUrl: record.fightcardUrl,
        videoUrl: `${record.videoUrl}?hdnts=${token}`,
        promoUrl: record.promoUrl,
        bannerUrl: record.bannerUrl,
        logoUrl: record.logoUrl,
        price: record.price,
      }
      outputPrepareData.push(newData)
    })
    return outputPrepareData
  }
}

async function setData(data, message) {
  var outputJson = []
  if (message == 'not-paid') {
    outputJson = await prepareData(data, 'null')
    return outputJson
  } else {
    outputJson = await prepareData(data, data)
    return outputJson
  }
}

function setDataOutput(outputvods, output) {
  if (outputvods.error == 'none') {
    const liveData = checktime(outputvods.data)
    //console.log('liveData', liveData)
    output.status.code = 200
    output.status.success = true
    output.status.message = defaultSuccessMessage
    output.data = liveData
  } else {
    output.status.message = outputvods.error
  }
  return output
}

async function findLives(status, query) {
  var statusOrder = ''
  var dataLives = {
    error: 'none',
    data: [],
  }
  var returnVods = {}
  if (status == 'not-paid') {
    statusOrder = 'not-paid'
  } else {
    statusOrder = 'paid'
  }
  returnVods = await Live.find(query)
    .sort({ onAirDate: -1 })
    .then(async function(lives) {
      if (Object.keys(lives).length != 0) {
        dataLives.data = await setData(lives, statusOrder)
        return dataLives
      } else {
        dataLives.error = 'data not found'
        return dataLives
      }
    })
    .catch(function(err) {
      dataLives.error = err
      return dataLives
    })
  return returnVods
}

async function decodeJwt(token, req) {
  var status = ''
  try {
    const decode = await readJwt(token, req)
    if (decode.statusJwt == 'Failed to authenticate token.') {
      status = decode.statusJwt
    } else {
      const query = { userId: decode.data.email }
      const order = await queryOrder(query)
      //console.log(order)
      status = order
    }
  } catch (err) {
    console.log(err)
  }
  return status
}

function checktime(lives) {
  const newLives = lives.map(live => {
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

    liveFromTime = moment.tz(live.liveFromDate, 'Asia/Bangkok').format('HH:mm')
    liveToTime = moment.tz(live.liveToDate, 'Asia/Bangkok').format('HH:mm')
    // Sat. Oct, 21st, 2017
    live.liveDateStr_en = moment
      .tz(live.liveFromDate, 'Asia/Bangkok')
      .format('ddd. MMM Do, YYYY')
    live.liveDateStr_en += ` (${liveFromTime} - ${liveToTime} GMT+7)`
    //console.log('live', live)
    return live
  })
  return newLives
}

//controllers
exports.insertValue = function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var liveFromDate = new Date('2017-10-28T19:20:00')
  var liveToDate = new Date('2017-10-28T19:20:00')
  var Dates = new Date()
  Dates = Date.now()
  var value = {
    programName: 'The Champion Muay Thai',
    title_en: 'The Champion Muay Thai',
    title_th: 'เดอะแชมป์เปี้ยน มวยไทย ตัดเชือก',
    showOrder: 4,
    liveDateStr_en: 'Sat. Oct 28th, 2017 (19.20 - 22.00 GMT+7)',
    liveDateStr_th: 'เสาร์ 28 ตค 2560 (19.20 - 22.00 )',
    liveFromDate: liveFromDate,
    liveToDate: liveToDate,
    shortDesc1_en: '4 Man Enter But Only 1 Will Be Champion',
    shortDesc1_th: 'null',
    shortDesc2_en: 'live telecast every Saturday 19.20 - 22.00 GMT+7',
    shortDesc2_th: 'null',
    desc_en:
      'Watch the 69 KG Tournament Championship this Saturday. October 7th, 2017 4 Thai Fighter battling out for the ultimate prize of 50,000 Bath Cash and The Champion Belt + 4 Ultimate Fights',
    desc_th: 'null',
    fightcardUrl:
      'http://139.59.127.206:3001/images/CHAMPION/live/fightcard.jpg',
    videoUrl:
      'https://wittestvod-vh.akamaihd-staging.net/i/wittestvod/SampleVideo/luke_,3,6,11,000k.mp4.csmil/master.m3u8',
    promoUrl:
      'https://wittestvod-vh.akamaihd-staging.net/i/mmt_live_preview/TheChampion_,48,72,108,0p.mp4.csmil/master.m3u8',
    bannerUrl: 'http://139.59.127.206:3001/images/CHAMPION/live/banner.jpg',
    logoUrl: 'http://139.59.127.206:3001/images/CHAMPION/live/thumbnail.jpg',
  }
  var live = new Live(value)
  live.save(function(err, value) {
    if (err) {
      output.status.message = err.message
      return res.json(output)
    } else {
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = value
    }
    return res.json(output)
  })
}

exports.lives = async function(req, res) {
  //console.log('hi')
  var token = req.query.token
  var outputvods = {}
  var json = {}
  var order = ''
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  if (token == undefined || token == 'undefined' || token == '') {
    outputvods = await findLives('not-paid', {})
    //console.log('outputvods', outputvods)
    json = setDataOutput(outputvods, output)
    //console.log('json1', json)
    return res.json(json)
  } else {
    order = await decodeJwt(token, req)
    if (order == 'you have purchase') {
      outputvods = await findLives('paid', {})
      json = setDataOutput(outputvods, output)
    } else if (order == `you have't purchase`) {
      outputvods = await findLives('not-paid', {})
      json = setDataOutput(outputvods, output)
    } else {
      outputvods = { err: order }
      json = setDataOutput(outputvods, output)
    }
    //console.log('json2', json)
    return res.json(json)
  }
}

exports.livesById = async function(req, res) {
  var token = req.query.token
  var outputvods = {}
  var json = {}
  var order = ''
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  if (token == undefined || token == 'undefined' || token == '') {
    outputvods = await findLives('not-paid', { _id: `${req.params.liveId}` })
    //console.log('outputvods', outputvods)
    json = setDataOutput(outputvods, output)
    return res.json(json)
  } else {
    order = await decodeJwt(token, req)
    if (order == 'you have purchase') {
      outputvods = await findLives('paid', { _id: `${req.params.liveId}` })
      json = setDataOutput(outputvods, output)
      //console.log(json)
    } else if (order == `you have't purchase`) {
      outputvods = await findLives('not-paid', { _id: `${req.params.liveId}` })
      json = setDataOutput(outputvods, output)
    } else {
      outputvods = { err: order }
      json = setDataOutput(outputvods, output)
    }
    return res.json(json)
  }
}
