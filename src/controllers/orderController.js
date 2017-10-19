'use strict'

var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  jwt = require('jsonwebtoken'),
  fetch = require('node-fetch')

var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var moment = require('moment')

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

exports.checkSubScribe = function(req, res) {
  //console.log('userId', req.decoded.data)
  //console.log('1')
  var queryParams = {
    userId: req.decoded.data.email,
    //productId: 1002,
  }
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  Order.findOne(queryParams, function(err, order) {
    if (order) {
      //console.log('hiiii', order)
      output.status.code = 403
      output.status.success = false
      output.status.message = 'you have purchase'
      //console.log('hiiii', output)
      return res.json(output)
    } else {
      output.status.code = 200
      output.status.success = true
      output.status.message = 'you do not have ticket'
      return res.json(output)
    }
  })
}

exports.subscribe = function(req, res) {
  //console.log('22')
  var queryParams = {
    userId: req.decoded.data.email,
    productId: req.body.promocode,
  }
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  // if (req.body.promocode == '1001') {
  //   Order.findOne(queryParams, function(err, order) {
  //     if (order) {
  //       //console.log('hiiii', order)
  //       output.status.code = 403
  //       output.status.success = false
  //       output.status.message = 'you have purchase'
  //       return res.json(output)
  //     }
  //     var dateNow = new Date()
  //     var endDate = moment(dateNow).add(3, 'days')
  //     var order = {
  //       userId: req.decoded.data.email,
  //       productId: req.body.promocode,
  //       endDate: endDate,
  //     }
  //     var newOrder = new Order(order)
  //     newOrder.save(function(err, order) {
  //       if (err) {
  //         output.status.message = err.message
  //         return res.json(output)
  //       } else {
  //         output.status.code = 200
  //         output.status.success = true
  //         output.status.message = defaultSuccessMessage
  //         output.data = order
  //       }
  //       return res.json(output)
  //     })
  //   })
  // } else if (req.body.promocode == 'MWC2016') {  // if (req.body.promocode == '1001') {
  //   Order.findOne(queryParams, function(err, order) {
  //     if (order) {
  //       //console.log('hiiii', order)
  //       output.status.code = 403
  //       output.status.success = false
  //       output.status.message = 'you have purchase'
  //       return res.json(output)
  //     }
  //     var dateNow = new Date()
  //     var endDate = moment(dateNow).add(3, 'days')
  //     var order = {
  //       userId: req.decoded.data.email,
  //       productId: req.body.promocode,
  //       endDate: endDate,
  //     }
  //     var newOrder = new Order(order)
  //     newOrder.save(function(err, order) {
  //       if (err) {
  //         output.status.message = err.message
  //         return res.json(output)
  //       } else {
  //         output.status.code = 200
  //         output.status.success = true
  //         output.status.message = defaultSuccessMessage
  //         output.data = order
  //       }
  //       return res.json(output)
  //     })
  //   })
  // } else if (req.body.promocode == 'MWC2016') {
  if (req.body.promocode == 'MWC2016') {
    Order.findOne(queryParams, function(err, order) {
      if (order) {
        output.status.code = 403
        output.status.success = false
        output.status.message = 'you have purchase'
        return res.json(output)
      }
      var dateNow = new Date()
      var endDate = moment(dateNow).add(1, 'months')
      var order = {
        userId: req.decoded.data.email,
        productId: req.body.promocode,
        endDate: endDate,
      }
      var newOrder = new Order(order)
      newOrder.save(function(err, order) {
        if (err) {
          output.status.message = err.message
          return res.json(output)
        } else {
          output.status.code = 200
          output.status.success = true
          output.status.message = defaultSuccessMessage
          output.data = order
        }
        return res.json(output)
      })
    })
  } else {
    //console.log('output', output)
    output.status.message = 'invalid promocode'
    res.json(output)
  }
}
