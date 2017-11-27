import env from '../config/env'

var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  Live = mongoose.model('Live'),
  Subscribe = mongoose.model('Subscribe'),
  jwt = require('jsonwebtoken'),
  fetch = require('node-fetch')

var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var moment = require('moment')

//function
const findOrders = (query, output) => {
  return new Promise((resolve, reject) => {
    Order.find(query)
      .then(function(order) {
        if (Object.keys(order).length != 0) {
          output.status.code = 403
          output.status.success = false
          output.status.message = 'you have purchase'
          resolve('you have purchase')
        } else {
          output.status.code = 200
          output.status.success = true
          output.status.message = `you don't have ticket`
          resolve(`you don't have ticket`)
        }
      })
      .catch(function(err) {
        console.log('err', err)
        resolve(err.message)
      })
  })
}

const creatOrders = (newOrder, output) => {
  return new Promise((resolve, reject) => {
    newOrder
      .save(function(order) {
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = order
        resolve('success')
      })
      .catch(function(err) {
        output.status.message = err.message
        resolve(err.message)
      })
  })
}

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
    //console.log('query', query)
    let statusOders = ''
    Order.find(query)
      .then(function(order) {
        //console.log('order', Object.keys(order).length)
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

function genNextQueryParams(params) {
  var nextQueryParams = ''

  Object.keys(params).forEach(function(key) {
    if (key == 'offset')
      nextQueryParams +=
        'offset=' + (parseInt(params.offset) + parseInt(params.limit)) + '&'
    else nextQueryParams += key + '=' + params[key] + '&'
  })

  return nextQueryParams
}

function setPaginationParams(params) {
  var paginationParams = {
    limit: parseInt(params.limit),
    offset: parseInt(params.offset),
    next_query_param: genNextQueryParams(params),
  }

  return paginationParams
}

function setQueryParams(params) {
  var queryParams = {}

  if (params.search) queryParams.email = new RegExp(params.search, 'i')

  return queryParams
}

function setData(data) {
  var output = []

  data.forEach(function(record) {
    var newData = {
      id: record._id,
      email: record.email,
    }

    output.push(newData)
  })

  return output
}

async function decodeJwt(token, req, type) {
  var status = {}
  var today = new Date()
  try {
    const decode = await readJwt(token, req)
    //console.log(decode.data._id)
    let query = {
      userId: decode.data._id,
      expiredDate: { $gte: today },
      status: 'approved',
    }
    if (type == 'purchase') {
      let query = {
        userId: decode.data._id,
        expiredDate: { $gte: today },
      }
    }
    if (decode.statusJwt == 'Failed to authenticate token.') {
      status = decode.statusJwt
    } else {
      const order = await queryOrder(query)
      //console.log(order)
      status = order
    }
  } catch (err) {
    console.log(err)
  }
  return status
}

//Live
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
        dataLives.data = await setDataLive(lives, statusOrder)
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

async function setDataLive(data, message) {
  var outputJson = []
  if (message == 'not-paid') {
    outputJson = await prepareData(data, 'null')
    return outputJson
  } else {
    outputJson = await prepareData(data, data)
    return outputJson
  }
}

async function prepareData(data, vodUrl) {
  var outputPrepareData = []
  var newData = {}
  data.forEach(function(record) {
    newData = {
      _id: record._id,
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
      promoUrl: record.promoUrl,
      bannerUrl: record.bannerUrl,
      logoUrl: record.logoUrl,
      price: record.price,
      status: record.status,
    }
    outputPrepareData.push(newData)
  })
  return outputPrepareData
}

function setDate(notPaidLive) {
  let i = 0
  while (i < notPaidLive.length) {
    //console.log('a')
    if (i == 0) {
      notPaidLive[i].startTime = '19.20'
      notPaidLive[i].endTime = '22.00'
    }
    if (i == 1) {
      notPaidLive[i].startTime = '20.00'
      notPaidLive[i].endTime = '22.00'
    }
    if (i == 2) {
      notPaidLive[i].startTime = '14.00'
      notPaidLive[i].endTime = '16.00'
    }
    if (i == 3) {
      notPaidLive[i].startTime = '19.20'
      notPaidLive[i].endTime = '22.00'
    }
    i++
  }
}
const setDataProduct = (data, exceptionData, type) => {
  return new Promise((resolve, reject) => {
    //console.log('data', data)
    try {
      //if (type == 'lives') {
      let i = 0
      while (i < data.length) {
        //const result = data.filter(product => product.productId != exceptionData)
        if (data[i] == null) {
        } else if (data[i]._id == exceptionData) {
          data[i].status = 'unenable'
        }
        i++
      }
      resolve('hi')
      // } else {
      //   let i = 0
      //   while (i < data.length) {
      //     //const result = data.filter(product => product.productId != exceptionData)
      //     if (data[i] == null) {
      //     } else if (data[i].productId == exceptionData) {
      //       data[i].status = 'unenable'
      //     }
      //     i++
      //   }
      //   resolve('hi')
      // }
    } catch (err) {
      resolve(err)
    }
  })
}

//controllers
exports.search = function(req, res) {
  var output = {
    status: {
      code: 400,
      message: '',
    },
    data: [],
  }
  if (req.body.promocode == 'live1') {
    var startDate = Date.now()
    startDate = moment(startDate).format('MMMM DD YYYY H:mm:ss')
    var endDate = moment(startDate)
      .add(3, 'days')
      .format('MMMM DD YYYY H:mm:ss')
    var order = {
      userId: req.body.email,
      itemId: 'Muay-Thai-Fri',
      startDate: startDate,
      endDate: endDate,
    }
    var newOrder = new Order(order)
    newOrder.save(function(err, order) {
      if (err) {
        output.status.message = err.message
      } else {
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = order
      }
      res.json(output)
    })
    //console.log(`it'equal`, newOrder)
  } else {
    //console.log('output', output)
    output.status.message = 'invalid promocode'
    res.json(output)
  }
}

exports.checkSubScribe = async function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  await findOrders({ userId: req.decoded.data.email }, output)
  return res.json(output)
}

// exports.subscribe = async function(req, res) {
//   var statusOrders = ''
//   var output = {
//     status: {
//       code: 400,
//       success: false,
//       message: defaultErrorMessage,
//     },
//     data: [],
//   }
//   //console.log('req.decoded.data.email', req.decoded.data.email)
//   //console.log(req.body.promocode)
//   if (req.body.promocode == 'MWC2016') {
//     statusOrders = await findOrders(
//       {
//         userId: req.decoded.data.email,
//         productId: req.body.promocode,
//       },
//       output
//     )
//     //console.log('hi', statusOrders)
//     if (statusOrders == `you don't have ticket`) {
//       var dateNow = new Date()
//       var endDate = moment(dateNow).add(1, 'months')
//       var order = {
//         userId: req.decoded.data.email,
//         productId: req.body.promocode,
//         endDate: endDate,
//       }
//       var newOrder = new Order(order)
//       await creatOrders(newOrder, output)
//     }
//     return res.json(output)
//   } else {
//     output.status.message = 'invalid promocode'
//     return res.json(output)
//   }
// }

exports.products = async function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: {
      lives: [],
      subscribe: [],
    },
  }
  const token = req.query.token
  let outputvods = await findLives('not-paid', {})
  let subscribes = await Subscribe.find(
    {},
    { productId: 1, price: 1, status: 1 }
  )
    .then(async function(subscribe) {
      if (Object.keys(subscribe).length != 0) {
        return subscribe
      } else {
        return []
      }
    })
    .catch(function(err) {
      return err
    })
  if (token == undefined || token == 'undefined') {
    await setDate(outputvods.data)
    output.status.code = 200
    output.status.success = true
    output.status.message = 'success'
    output.data.lives = outputvods.data
    output.data.subscribe = subscribes
  } else {
    const decoded = await decodeJwt(token, req)
    if (decoded == `you have't purchase`) {
      console.log('hisx')
      output.status.code = 200
      output.status.success = true
      output.status.message = 'success'
      await setDate(outputvods.data)
      output.data.lives = outputvods.data
      output.data.subscribe = subscribes
    } else if (decoded == `Failed to authenticate token.`) {
      output.status.message = 'Failed to authenticate token.'
    } else {
      //console.log('gik')
      const product = []
      let i = 0
      while (i < decoded.length) {
        product[i] = decoded[i].productId
        i++
      }
      console.log(product)
      i = 0
      const notPaidLive = outputvods.data
      //console.log('ff', notPaidLive[1].productId)
      while (i < product.length) {
        await setDataProduct(notPaidLive, product[i], 'lives')
        i++
      }
      await setDate(notPaidLive)

      //const resultLive = notPaidLive.filter(product => product != null)
      output.data.lives = notPaidLive
      const notPaidSubscribe = subscribes
      i = 0
      //console.log(product)
      while (i < product.length) {
        await setDataProduct(notPaidSubscribe, product[i], 'subscribe')
        i++
      }
      i = 0
      // const resultSubscribe = notPaidSubscribe.filter(
      //   product => product != null
      // )
      output.status.code = 200
      output.status.success = true
      output.status.message = 'success'
      output.data.subscribe = notPaidSubscribe
    }
  }
  res.send(output)
}

exports.getTokenPaypal = async function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: {
      lives: [],
      subscribe: [],
    },
  }
}

exports.createPaymentPaypal = async function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: {
      lives: [],
      subscribe: [],
    },
  }
  const token = req.query.token
}

exports.insertValue = function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var value = {
    productId: 3,
    price: 1,
  }
  var subscribe = new Subscribe(value)
  subscribe.save(function(err, value) {
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

exports.insertOrder = function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var Dates = new Date()
  Dates = Date.now()
  var value = {
    orderId: '1',
    productId: '1002',
    userId: 'farm1771@gmail.com',
    price: 0.99,
    purchaseDate: Dates,
    platform: 'ios',
  }
  var order = new Order(value)
  order.save(function(err, value) {
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

exports.purchaseHistory = async function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  const token = req.query.token
  const decoded = await decodeJwt(token, req, 'purchase')
  output.status.code = 200
  output.status.success = true
  output.status.message = 'success'
  output.data = decoded
  res.send(output)
}

exports.fetchSubscribe = async function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  const token = req.query.token
  let decoded = await readJwt(token, req)
  let today = Date.now()
  const order = await Order.find({
    userId: decoded.data._id,
    $or: [
      { productId: '5a0c040eb29318da40e335ef' },
      { productId: '59dc6d66af142842d0bc2551' },
    ],
    status: 'approved',
    expiredDate: { $gte: today },
  })
  //console.log(order)
  output.status.code = 200
  output.status.success = true
  output.status.message = 'success'
  output.data = order
  res.status(200).send(output)
}
