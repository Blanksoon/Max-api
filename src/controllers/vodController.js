'use strict'
var vods = require('../../data/vods/vods')
var vodslogin = require('../../data/vods/buyVods')
var mongoose = require('mongoose'),
  Vod = mongoose.model('Vod')
Order = mongoose.model('Order')
var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var jwt = require('jsonwebtoken')
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

function dateTime2Obj(dateTime) {
  var date = new Date(dateTime)
  var year = parseInt(date.getFullYear())
  var month = parseInt(date.getMonth()) + 1

  return {
    date: date,
    month: month,
    year: year,
  }
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

  if (params.search) queryParams.title = new RegExp(params.search, 'i')

  if (params.month) queryParams['on_air_date.month'] = parseInt(params.month)

  if (params.year) queryParams['on_air_date.year'] = parseInt(params.year)

  return queryParams
}

// function setData(data) {
//   var output = []

//   data.forEach(function(record) {
//     var newData = {
//       id: record._id,
//       title: record.title,
//       duration: record.duration,
//       on_air_date: record.on_air_date.date,
//       video_url: record.video_url,
//       long_url: record.long_url,
//     }

//     output.push(newData)
//   })

//   return output
// }

function setData(data, message) {
  var output = []
  var vodUrl = ''
  if (message == 'not-paid') {
    if (data.vods == undefined) {
      data.vodslogin.forEach(function(record) {
        var newData = {
          id: record.id,
          title: record.title,
          duration: record.duration,
          videoUrl: record.videoUrl,
          thumbnail: record.thumbnail,
          channel: record.channel,
          feature: record.feature,
          promoUrl: record.promoUrl,
          onAirDate: record.onAirDate,
          status: record.status,
          descriptionEn: record.descriptionEn,
          descriptionTh: record.descriptionTh,
          cadlogo: record.cadlogo,
          programName: record.programName,
        }
        output.push(newData)
      })
    } else {
      data.vods.forEach(function(record) {
        var newData = {
          id: record.id,
          title: record.title,
          duration: record.duration,
          videoUrl: '',
          thumbnail: record.thumbnail,
          channel: record.channel,
          feature: record.feature,
          promoUrl: record.promoUrl,
          onAirDate: record.onAirDate,
          status: record.status,
          descriptionEn: record.descriptionEn,
          descriptionTh: record.descriptionTh,
          cadlogo: record.cadlogo,
          programName: record.programName,
        }
        output.push(newData)
      })
    }
  } else {
    if (data.vods == undefined) {
      data.vodslogin.forEach(function(record) {
        var newData = {
          id: record.id,
          title: record.title,
          duration: record.duration,
          videoUrl: record.videoUrl,
          thumbnail: record.thumbnail,
          channel: record.channel,
          feature: record.feature,
          promoUrl: record.promoUrl,
          onAirDate: record.onAirDate,
          status: record.status,
          descriptionEn: record.descriptionEn,
          descriptionTh: record.descriptionTh,
          cadlogo: record.cadlogo,
          programName: record.programName,
        }
        output.push(newData)
      })
    } else {
      data.vods.forEach(function(record) {
        var newData = {
          id: record.id,
          title: record.title,
          duration: record.duration,
          videoUrl: '',
          thumbnail: record.thumbnail,
          channel: record.channel,
          feature: record.feature,
          promoUrl: record.promoUrl,
          onAirDate: record.onAirDate,
          status: record.status,
          descriptionEn: record.descriptionEn,
          descriptionTh: record.descriptionTh,
          cadlogo: record.cadlogo,
          programName: record.programName,
        }
        output.push(newData)
      })
    }
  }
  return output
}

exports.search = function(req, res) {
  var queryParams = setQueryParams(req.query)
  var paginationParams = setPaginationParams(req.query)

  Vod.count(queryParams).exec(function(err, count) {
    paginationParams.total_records = count
  })

  Vod.find(queryParams, function(err, vod) {
    var output = {
      status: {
        code: 400,
        success: false,
        message: defaultErrorMessage,
      },
      data: {
        pagination: paginationParams,
        records: [],
      },
    }

    if (err) {
      output.status.message = err.message
    } else if (vod) {
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data.records = setData(vod, not - paid)
    }

    res.json(output)
  })
    .limit(paginationParams.limit)
    .skip(paginationParams.offset)
}

exports.vods = function(req, res) {
  var decoded = {}
  var token = req.body.token
  //console.log('test', req.body)
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  if (token == undefined) {
    //console.log('1')
    output.status.code = 200
    output.status.success = true
    output.status.message = defaultSuccessMessage
    output.data = setData(vods, 'not-paid')
    return res.json(output)
  } else {
    jwt.verify(token, req.app.get('secret'), function(err, decoded) {
      if (err) {
        return res.json({
          status: {
            code: 403,
            success: false,
            message: 'Failed to authenticate token.',
          },
          data: [],
        })
      } else {
        decoded = decoded
        var queryParams = {
          userId: decoded.data.email,
          productId: '1002',
        }
        Order.findOne(queryParams, function(err, order) {
          if (err) {
            output.status.message = err.message
            return res.json(output)
          } else if (order) {
            output.status.code = 200
            output.status.success = true
            output.status.message = defaultSuccessMessage
            output.data = setData(vodslogin, 'paid')
            return res.json(output)
          } else {
            output.status.code = 200
            output.status.success = true
            output.status.message = defaultSuccessMessage
            output.data = setData(vods, 'not-paid')
            return res.json(output)
          }
        })
      }
    })
  }
}

exports.create = function(req, res) {
  var createObject = req.body
  createObject.on_air_date = dateTime2Obj(createObject.on_air_date)

  var new_vod = new Vod(req.body)

  new_vod.save(function(err, vod) {
    var output = {
      status: {
        code: 400,
        success: false,
        message: '',
      },
      data: [],
    }

    if (err) {
      output.status.message = err.message
    } else if (vod) {
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = setData([vod])
    }

    res.json(output)
  })
}

exports.get = function(req, res) {
  Vod.findById(req.params.vodId, function(err, vod) {
    var output = {
      status: {
        code: 400,
        success: false,
        message: defaultErrorMessage,
      },
      data: [],
    }

    if (err) {
      output.status.message = err.message
    } else if (vod) {
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = setData([vod])
    }

    res.json(output)
  })
}

exports.update = function(req, res) {
  var updateObject = req.body
  updateObject.on_air_date = dateTime2Obj(updateObject.on_air_date)

  Vod.findOneAndUpdate(
    { _id: req.params.vodId },
    updateObject,
    { new: true },
    function(err, vod) {
      var output = {
        status: {
          code: 400,
          success: false,
          message: defaultErrorMessage,
        },
        data: [],
      }

      if (err) {
        output.status.message = err.message
      } else if (vod) {
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = setData([vod])
      }

      res.json(output)
    }
  )
}

exports.delete = function(req, res) {
  Vod.remove(
    {
      _id: req.params.vodId,
    },
    function(err, vod) {
      var output = {
        status: {
          code: 400,
          success: false,
          message: defaultErrorMessage,
        },
        data: {
          id: req.params.vodId,
        },
      }

      if (err) {
        output.status.message = err.message
      } else if (vod) {
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
      }

      res.json(output)
    }
  )
}
