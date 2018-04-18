import env from '../config/env'
import fs from 'fs'
import xl from 'excel4node'
var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  Setting = mongoose.model('Setting'),
  Live = mongoose.model('Live'),
  Subscribe = mongoose.model('Subscribe'),
  Package = mongoose.model('Package'),
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

const checkUserCms = (username, password) => {
  let i = 0
  const content = fs.readFileSync(env.ADMINPATH)
  let users = JSON.parse(content)
  while (i < users.length) {
    if (users[i].username === username && users[i].password === password) {
      return true
    }
    i++
  }
  return false
}

const readJwtCms = token => {
  return new Promise((resolve, reject) => {
    const error = {
      statusJwt: '',
      err: '',
    }
    jwt.verify(token, env.JWT_SECRET, async function(err, decoded) {
      if (err) {
        error.statusJwt = 'Failed to authenticate token.'
        error.err = err
        reject(error.statusJwt)
      } else {
        if (checkUserCms(decoded.data.email, decoded.data.password)) {
          resolve(decoded)
        }
        reject('User not found')
      }
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
  let query = {}
  try {
    const decode = await readJwt(token, req)
    //console.log(decode.data._id)
    query = {
      userId: decode.data._id,
      expiredDate: { $gte: today },
      status: 'approved',
    }
    if (type === 'purchase') {
      query = {
        userId: decode.data._id,
        expiredDate: { $gte: today },
        status: { $ne: 'created' },
      }
    }
    if (decode.statusJwt == 'Failed to authenticate token.') {
      status = decode.statusJwt
    } else {
      //console.log('1111111111', query)
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
  //console.log(query)
  returnVods = await Live.find(query)
    .sort({ onAirDate: -1 })
    .then(async function(lives) {
      if (Object.keys(lives).length != 0) {
        //console.log(lives)
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
    notPaidLive[i].startTime = notPaidLive[i].startTime.substring(0, 5)
    notPaidLive[i].endTime = notPaidLive[i].endTime.substring(0, 5)
    i++
  }
}

const setDataProduct = (data, exceptionData) => {
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
      package: [],
    },
  }
  const token = req.query.token
  let packageProduct = await Package.find({})
    .then(async function(packageList) {
      //console.log('11111', packageList)
      if (Object.keys(packageList).length != 0) {
        return packageList
      } else {
        return []
      }
    })
    .catch(function(err) {
      return err
    })
  let outputvods = await findLives('not-paid', {
    $and: [
      { title_en: { $ne: 'Max Sunday Afternoon' } },
      { title_en: { $ne: 'Octa Fight Monday' } },
      { title_en: { $ne: 'Octa Fight Tuesday' } },
    ],
  })
  let subscribes = await Subscribe.find(
    {},
    { productId: 1, price: 1, status: 1, description: 1, title_en: 1 }
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
    output.data.package = packageProduct
  } else {
    const decoded = await decodeJwt(token, req)
    if (decoded == `you have't purchase`) {
      //console.log('hisx')
      output.status.code = 200
      output.status.success = true
      output.status.message = 'success'
      await setDate(outputvods.data)
      output.data.lives = outputvods.data
      output.data.subscribe = subscribes
      output.data.package = packageProduct
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
      //console.log(product)
      i = 0
      const notPaidLive = outputvods.data
      //console.log('ff', notPaidLive[1].productId)
      while (i < product.length) {
        await setDataProduct(notPaidLive, product[i])
        i++
      }
      await setDate(notPaidLive)

      //const resultLive = notPaidLive.filter(product => product != null)
      output.data.lives = notPaidLive
      i = 0
      const notPaidSubscribe = subscribes
      //console.log(product)
      while (i < product.length) {
        await setDataProduct(notPaidSubscribe, product[i])
        i++
      }
      output.data.subscribe = notPaidSubscribe
      i = 0
      const notPaidPackage = packageProduct
      while (i < product.length) {
        await setDataProduct(notPaidPackage, product[i])
        i++
      }
      // const resultSubscribe = notPaidSubscribe.filter(
      //   product => product != null
      // )
      output.data.package = notPaidPackage
      output.status.code = 200
      output.status.success = true
      output.status.message = 'success'
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
  if (!decoded.data) {
    output.status.message = decoded.statusJwt
    res.status(200).send(output)
  }

  let today = Date.now()
  const order = await Order.find({
    userId: decoded.data._id,
    $or: [
      { productId: '5a0c040eb29318da40e335ef' },
      { productId: '5a0c0450b29318da40e335f0' },
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

exports.fetchVersion = async function(req, res) {
  try {
    const allVersion = await Setting.find({})
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch version',
      },
      data: allVersion[0],
    })
  } catch (error) {
    console.log(error)
    res.status(200).send('error')
  }
}

exports.fetchAmountCustomerFree = async function(req, res) {
  let startDate = new Date(req.body.startDate + 'T00:00:00.000Z')
  let endDate = new Date(req.body.endDate + 'T00:00:00.000Z')
  const secretKey = req.body.key
  const output = {}
  //console.log('startDate', startDate)
  //console.log('endDate', endDate)
  try {
    if (secretKey === env.PROMOTIONKEY) {
      const listOfCustomer = await Order.find(
        {
          purchaseDate: {
            $gt: startDate,
            $lte: endDate,
          },
          status: 'approved',
          orderType: 'free',
        },
        { purchaseDate: 1, status: 1, email: 1, productName: 1, expiredDate: 1 }
      )
      if (listOfCustomer.length === 0) {
        throw 'No customer sign up'
      }
      output.amountOfCustomer = listOfCustomer.length
      output.listOfCustomer = listOfCustomer
      res.status(200).send(output)
    } else {
      throw `Key isn't match`
    }
  } catch (err) {
    console.log(err)
    res.status(200).send(err)
  }
}

exports.ordersInCms = async function(req, res) {
  const token = req.query.token
  const limit = parseInt(req.query.limit)
  const index = parseInt(req.query.offset)
  try {
    const decodeToken = await readJwtCms(token)
    const data = await Order.find({})
    const result = await Order.find({})
      .limit(limit)
      .skip(index)
    const dataResult = result.map(item => ({
      ...item['_doc'],
      cancelDate: moment(item['_doc'].cancelDate).format('DD/MM/YYYY'),
      expiredDate: moment(item['_doc'].expiredDate).format('DD/MM/YYYY'),
      purchaseDate: moment(item['_doc'].purchaseDate).format('DD/MM/YYYY'),
      //promoUrl: item['_doc'].promoUrl.substring(41, 49),
    }))
    let i = 0
    while (i < result.length) {
      if (dataResult[i].cancelDate === 'Invalid date') {
        dataResult[i].cancelDate = 'null'
      } else {
        dataResult[i].cancelDate = dataResult[i].cancelDate
      }
      i++
    }
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch orders',
      },
      data: dataResult,
      dataLength: data.length,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.orderExportExcel = async function(req, res) {
  const token = req.query.token
  try {
    const decodeToken = await readJwtCms(token)
    const wb = new xl.Workbook()
    const ws = wb.addWorksheet('Sheet 1')
    let i = 0
    let row = 2
    const order = await Order.find({})
    // console.log('user: ', user.length)
    const headerStyle = wb.createStyle({
      font: {
        color: '#FF0800',
        size: 16,
      },
    })

    ws
      .cell(1, 1)
      .string('productId')
      .style(headerStyle)
    ws
      .cell(1, 2)
      .string('productName')
      .style(headerStyle)
    ws
      .cell(1, 3)
      .string('userId')
      .style(headerStyle)
    ws
      .cell(1, 4)
      .string('email')
      .style(headerStyle)
    ws
      .cell(1, 5)
      .string('price')
      .style(headerStyle)
    ws
      .cell(1, 6)
      .string('platform')
      .style(headerStyle)
    ws
      .cell(1, 7)
      .string('cancelDate')
      .style(headerStyle)
    ws
      .cell(1, 8)
      .string('expiredDate')
      .style(headerStyle)
    ws
      .cell(1, 9)
      .string('status')
      .style(headerStyle)
    ws
      .cell(1, 10)
      .string('paypal-payerId')
      .style(headerStyle)
    ws
      .cell(1, 11)
      .string('paypal-paymentId')
      .style(headerStyle)
    ws
      .cell(1, 12)
      .string('paypal-tokenSubscribe')
      .style(headerStyle)
    ws
      .cell(1, 13)
      .string('paypal-SubscribtionId')
      .style(headerStyle)
    ws
      .cell(1, 14)
      .string('paymentIos-transactionId')
      .style(headerStyle)
    ws
      .cell(1, 15)
      .string('paymentAndroid-transactionId')
      .style(headerStyle)
    ws
      .cell(1, 16)
      .string('stripe-paymentId')
      .style(headerStyle)
    ws
      .cell(1, 17)
      .string('wechat-paymentId')
      .style(headerStyle)
    ws
      .cell(1, 18)
      .string('orderType')
      .style(headerStyle)
    ws
      .cell(1, 19)
      .string('purchaseDate')
      .style(headerStyle)

    while (i < order.length) {
      ws.cell(row, 1).string(`${order[i].productId}`)
      ws.cell(row, 2).string(`${order[i].productName}`)
      ws.cell(row, 3).string(`${order[i].userId}`)
      ws.cell(row, 4).string(`${order[i].email}`)
      ws.cell(row, 5).string(`${order[i].price}`)
      ws.cell(row, 6).string(`${order[i].platform}`)
      ws.cell(row, 7).string(`${order[i].cancelDate}`)
      ws.cell(row, 8).string(`${order[i].expiredDate}`)
      ws.cell(row, 9).string(`${order[i].status}`)
      ws.cell(row, 10).string(`${order[i].paypal.payerId}`)
      ws.cell(row, 11).string(`${order[i].paypal.paymentId}`)
      ws.cell(row, 12).string(`${order[i].paypal.tokenSubscribe}`)
      ws.cell(row, 13).string(`${order[i].paypal.SubscribtionId}`)
      ws.cell(row, 14).string(`${order[i].paymentIos.transactionId}`)
      ws.cell(row, 15).string(`${order[i].paymentAndroid.transactionId}`)
      ws.cell(row, 16).string(`${order[i].stripe.paymentId}`)
      ws.cell(row, 17).string(`${order[i].wechat.paymentId}`)
      ws.cell(row, 18).string(`${order[i].orderType.type}`)
      ws.cell(row, 19).string(`${order[i].purchaseDate}`)
      row++
      i++
    }
    wb.write('ExcelFile.xlsx', res)
  } catch (err) {
    console.log('err: ', err)
  }
}
