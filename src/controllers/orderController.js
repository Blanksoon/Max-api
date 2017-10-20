'use strict'

var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  jwt = require('jsonwebtoken'),
  fetch = require('node-fetch')

var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var moment = require('moment')

//global variable
var output = {
  status: {
    code: 400,
    success: false,
    message: defaultErrorMessage,
  },
  data: [],
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
//function
const findOrders = (query, output) =>
  new Promise((resolve, reject) => {
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

const creatOrders = (newOrder, output) =>
  new Promise((resolve, reject) => {
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

//controllers
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

exports.subscribe = async function(req, res) {
  var statusOrders = ''
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  console.log('req.decoded.data.email', req.decoded.data.email)
  //console.log(req.body.promocode)
  if (req.body.promocode == 'MWC2016') {
    statusOrders = await findOrders(
      {
        userId: req.decoded.data.email,
        productId: req.body.promocode,
      },
      output
    )
    console.log('hi', statusOrders)
    if (statusOrders == `you don't have ticket`) {
      var dateNow = new Date()
      var endDate = moment(dateNow).add(1, 'months')
      var order = {
        userId: req.decoded.data.email,
        productId: req.body.promocode,
        endDate: endDate,
      }
      var newOrder = new Order(order)
      await creatOrders(newOrder, output)
    }
    return res.json(output)
  } else {
    output.status.message = 'invalid promocode'
    return res.json(output)
  }
}
