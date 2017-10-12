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
  //console.log('data', data)
  var output = []
  var vodUrl = ''
  if (message == 'not-paid') {
    data.forEach(function(record) {
      var newData = {
        id: record._id,
        programName_en: record.programName_en,
        programName_th: record.programName_th,
        promoFromTime: record.promoFromTime,
        promoToTime: record.promoToTime,
        free: record.free,
        logoUrl: record.logoUrl,
        videoUrl: 'null',
        promoUrl: record.promoUrl,
        thumbnailUrl: record.thumbnailUrl,
        title_en: record.title_en,
        title_th: record.title_th,
        onAirDateStr_en: record.onAirDateStr_en,
        onAirDateStr_th: record.onAirDateStr_th,
        onAirDate: record.onAirDate,
        desc_en: record.desc_en,
        desc_th: record.desc_th,
        duration: record.duration,
        feature: record.feature,
      }
      output.push(newData)
    })
  } else if (message == 'feature-vod') {
    var newData = {
      id: data._id,
      programName_en: data.programName_en,
      programName_th: data.programName_th,
      promoFromTime: data.promoFromTime,
      promoToTime: data.promoToTime,
      free: data.free,
      logoUrl: data.logoUrl,
      videoUrl: '',
      promoUrl: data.promoUrl,
      thumbnailUrl: data.thumbnailUrl,
      title_en: data.title_en,
      title_th: data.title_th,
      onAirDateStr_en: data.onAirDateStr_en,
      onAirDateStr_th: data.onAirDateStr_th,
      onAirDate: data.onAirDate,
      desc_en: data.desc_en,
      desc_th: data.desc_th,
      duration: data.duration,
      feature: data.feature,
    }
    output.push(newData)
  } else {
    data.forEach(function(record) {
      var newData = {
        id: record._id,
        programName_en: record.programName_en,
        programName_th: record.programName_th,
        promoFromTime: record.promoFromTime,
        promoToTime: record.promoToTime,
        free: record.free,
        logoUrl: record.logoUrl,
        videoUrl: record.videoUrl,
        promoUrl: record.promoUrl,
        thumbnailUrl: record.thumbnailUrl,
        title_en: record.title_en,
        title_th: record.title_th,
        onAirDateStr_en: record.onAirDateStr_en,
        onAirDateStr_th: record.onAirDateStr_th,
        onAirDate: record.onAirDate,
        desc_en: record.desc_en,
        desc_th: record.desc_th,
        duration: record.duration,
        feature: record.feature,
      }
      output.push(newData)
    })
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
  var token = req.query.token
  var progName = req.query.progname
  //console.log('progName', progName)
  //console.log('test', req.query.token)
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  if (progName != 'undefined' && progName != '') {
    console.log('hi1', progName)
    if (token == undefined || token == '' || token == 'undefined') {
      Vod.find({ programName_en: progName }, function(err, vods) {
        if (err) {
          output.status.message = err.message
        } else if (vods) {
          output.status.code = 200
          output.status.success = true
          output.status.message = defaultSuccessMessage
          if (token == 'undefined') {
            output.data = setData(vods, 'not-paid')
          } else {
            output.data = setData(vods, 'not-paid')
          }
        }
        return res.json(output)
      }).sort({ onAirDate: 1 })
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
            //productId: '1002',
          }
          Order.findOne(queryParams, function(err, order) {
            if (err) {
              Vod.find({ programName_en: progName }, function(err, vods) {
                if (err) {
                  output.status.message = err.message
                } else if (vods) {
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(vods, 'not-paid')
                }
                return res.json(output)
              }).sort({ onAirDate: 1 })
            } else if (order) {
              Vod.find({ programName_en: progName }, function(err, vods) {
                if (err) {
                  output.status.message = err.message
                } else if (vods) {
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(vods, 'paid')
                }
                return res.json(output)
              }).sort({ onAirDate: 1 })
            } else {
              Vod.find({ programName_en: progName }, function(err, vods) {
                if (err) {
                  output.status.message = err.message
                } else if (vods) {
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(vods, 'not-paid')
                }
                return res.json(output)
              }).sort({ onAirDate: 1 })
            }
          })
        }
      })
    }
  } else if (token == undefined || token == '' || token == 'undefined') {
    console.log('hi2')
    Vod.find({}, function(err, vods) {
      if (err) {
        output.status.message = err.message
      } else if (vods) {
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = setData(vods, 'not-paid')
      }
      return res.json(output)
    }).sort({ onAirDate: 1 })
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
            Vod.find({}, function(err, vods) {
              if (err) {
                output.status.message = err.message
              } else if (vods) {
                output.status.code = 200
                output.status.success = true
                output.status.message = defaultSuccessMessage
                output.data = setData(vods, 'paid')
              }
              return res.json(output)
            }).sort({ onAirDate: 1 })
          } else {
            Vod.find({}, function(err, vods) {
              if (err) {
                output.status.message = err.message
              } else if (vods) {
                output.status.code = 200
                output.status.success = true
                output.status.message = defaultSuccessMessage
                output.data = setData(vods, 'not-paid')
              }
              return res.json(output)
            }).sort({ onAirDate: 1 })
          }
        })
      }
    })
  }
}

exports.featureVods = function(req, res) {
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  Vod.findOne({ feature: 'active' }, function(err, vods) {
    if (err) {
      output.status.message = err.message
    } else if (vods) {
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = setData(vods, 'feature-vod')
    }
    return res.json(output)
  })
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
  var liveFromDate = new Date('2017-10-28T19:20:00')
  var liveToDate = new Date('2017-10-28T19:20:00')
  var Dates = new Date()
  Dates = Date.now()
  var value = {
    programName_en: 'Battle Muay Thai',
    programName_th: 'มวยไทย แบทเทิล',
    promoFromTime: '1.14.40',
    promoToTime: '1.15.00',
    free: '0',
    thumbnailUrl: 'http://139.59.127.206:3001/images/BATTLE/vod/22-09-17.jpg',
    logoUrl: '01-10-17.jpg',
    videoUrl: 'null',
    title_en: 'Muay Thai Battle',
    title_th: 'มวยไทย แบทเทิล',
    onAirDateStr_en: 'Fri. Sep 22th, 2017',
    onAirDateStr_th: 'null',
    onAirDate: Dates,
    desc_en: 'The No.1 Rated Live Fighting TV Show in Thailand',
    desc_th: 'null',
    duration: '1.52.33',
    feature: 'unactive',
  }
  // var i = 0
  // var obj = {}
  // console.log(value.length)
  // while (i < value.length) {
  //   obj = value[i]
  //   console.log(obj)
  var vod = new Vod(value)
  vod.save(function(err, value) {
    if (err) {
      output.status.message = err.message
      return res.json(output)
    } else {
      return res.sendStatus(200)
      // console.log(i)
      // output.status.code = 200
      // output.status.success = true
      // output.status.message = defaultSuccessMessage
      // output.data = value
      //i = i + 1
    }
  })
  // }

  //return res.sendStatus(200)
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

exports.getProgramName = function(req, res) {
  var output = {
    status: {
      code: 200,
      success: true,
      message: defaultSuccessMessage,
    },
    data: [
      {
        title_en: 'Max Muay Thai',
        title_th: 'แม็กซ์มวยไทย',
      },
      {
        title_en: 'The Champion Muay Thai',
        title_th: 'เดอะแชมป์เปี้ยน มวยไทย ตัดเชือก',
      },
      {
        title_en: 'Muay Thai Fighter',
        title_th: 'มวยไทย ไฟต์เตอร์',
      },
      {
        title_en: 'Battle Muay Thai',
        title_th: 'มวยไทย แบทเทิล',
      },
    ],
  }
  return res.json(output)
}
