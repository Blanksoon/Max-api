import env from '../config/env'

const defaultSuccessMessage = 'success'
const fetch = require('isomorphic-unfetch')
const defaultErrorMessage = 'data_not_found'
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Order = mongoose.model('Order')
const Live = mongoose.model('Live')

//function
const readJwt = (token, req) => {
  return new Promise((resolve, reject) => {
    const error = {
      statusJwt: '',
      err: '',
    }
    jwt.verify(token, env.JWT_SECRET, async function(err, decoded) {
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
          resolve(order)
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

const setDataProduct = (data, exceptionData, buyLives) => {
  return new Promise((resolve, reject) => {
    try {
      let i = 0
      // console.log('set', exceptionData)
      // console.log('id', data.data[0])
      while (i < data.data.length) {
        //const result = data.filter(product => product.productId != exceptionData)
        if (data.data[i].id == exceptionData) {
          //console.log('hi')
          //data[i].status = 'unenable'
          data.data[i].videoUrl = buyLives.data[i].videoUrl
        }
        i++
      }
      resolve('hi')
    } catch (err) {
      resolve(err)
    }
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
    output.status.code = 200
    output.status.success = true
    output.status.message = defaultSuccessMessage
    output.data = outputvods.data
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
  var today = Date.now()
  try {
    const decode = await readJwt(token, req)
    if (decode.statusJwt == 'Failed to authenticate token.') {
      status = decode.statusJwt
    } else {
      const query = {
        userId: decode.data._id,
        expiredDate: { $gte: today },
        $or: [
          { productId: '59dc6d2786595e42a27635c4' }, //Max Muay Thai
          { productId: '59dc6d66af142842d0bc2551' }, //Muay Thai Battle
          { productId: '59dc6da4ab8a7442f58390f4' }, //Muay Thai Fighter
          { productId: '59dc6dcb61490e430a0d6ec8' }, //The champion Muay Thai
          { productId: '5a43eb3fe356ed0f196c434a' }, //Global Fight Wednesday
          { productId: '5a43ec7ce356ed0f196c434b' }, //Global Fight Thursday
          { productId: '5a43ed6be356ed0f196c434c' }, //Octa Fight Monday
          { productId: '5a43ee30e356ed0f196c434d' }, //Octa Fight Tuesday
          { productId: '5a43eea8e356ed0f196c4350' }, //Max Sunday Afternoon
          { productId: '5a5c2ed0e356edd4d27f88ab' }, //Package Lives And Vods
        ],
        status: 'approved',
      }

      const querySub = {
        userId: decode.data._id,
        expiredDate: { $gte: today },
        $or: [
          { productId: '5a0c0450b29318da40e335f0' }, //Subscribe Live And Vods
        ],
        status: { $ne: 'created', $ne: 'expired' },
      }
      const order = await queryOrder(query)
      const orderSub = await queryOrder(querySub)
      //console.log('1111111111111 ', order)
      //console.log('2222222222222 ', orderSub)
      if (orderSub !== `you have't purchase`) {
        //console.log('11111111111111', order)
        status = orderSub
      } else if (order !== `you have't purchase`) {
        status = order
      } else {
        status = order
      }
      //console.log('11111111111111', order)
      //console.log('33333333333 ', status)
      //status = order
    }
  } catch (err) {
    console.log(err)
  }
  return status
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
    //outputvods = await findLives('paid', {})
    json = setDataOutput(outputvods, output)
    return res.json(json)
  } else {
    order = await decodeJwt(token, req)
    //console.log('order', order)
    if (order == `you have't purchase`) {
      outputvods = await findLives('not-paid', {})
      //outputvods = await findLives('paid', {})
      json = setDataOutput(outputvods, output)
    } else if (order.length != 0) {
      //console.log('op')
      outputvods = await findLives('not-paid', {})
      //outputvods = await findLives('paid', {})
      const buyLives = await findLives('paid', {})
      const lives = outputvods
      let i = 0
      let subscribe = false
      while (i < order.length) {
        if (
          order[i].productId === '5a0c0450b29318da40e335f0' ||
          order[i].productId === '5a5c2ed0e356edd4d27f88ab'
        ) {
          subscribe = true
        }
        i++
      }
      if (subscribe === false) {
        i = 0
        while (i < order.length) {
          await setDataProduct(lives, order[i].productId, buyLives)
          i++
        }
        json = setDataOutput(lives, output)
      } else {
        outputvods = await findLives('paid', {})
        json = setDataOutput(outputvods, output)
      }
    } else {
      outputvods = { err: order }
      json = setDataOutput(outputvods, output)
    }
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
    json = setDataOutput(outputvods, output)
    return res.json(json)
  } else {
    order = await decodeJwt(token, req)
    //console.log(order)
    if (order == `you have't purchase`) {
      outputvods = await findLives('not-paid', { _id: `${req.params.liveId}` })
      json = setDataOutput(outputvods, output)
    } else if (order.length != 0) {
      outputvods = await findLives('not-paid', { _id: `${req.params.liveId}` })
      const buyLives = await findLives('paid', { _id: `${req.params.liveId}` })
      const lives = outputvods
      let i = 0
      let subscribe = false
      while (i < order.length) {
        if (
          order[i].productName === 'subscribe lives and vods' ||
          order[i].productName === 'package lives and vods'
        ) {
          subscribe = true
        }
        i++
      }
      if (subscribe == false) {
        i = 0
        while (i < order.length) {
          await setDataProduct(lives, order[i].productId, buyLives)
          i++
        }
        json = setDataOutput(lives, output)
      } else {
        outputvods = await findLives('paid', { _id: `${req.params.liveId}` })
        console.log(outputvods)
        json = setDataOutput(outputvods, output)
      }
    } else {
      outputvods = { err: order }
      json = setDataOutput(outputvods, output)
    }
    return res.json(json)
  }
}
