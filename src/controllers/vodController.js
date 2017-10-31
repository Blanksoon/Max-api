'use strict'
var vods = require('../../data/vods/vods')
var vodslogin = require('../../data/vods/buyVods')
var mongoose = require('mongoose'),
  Vod = mongoose.model('Vod')
Order = mongoose.model('Order')
var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var jwt = require('jsonwebtoken')

//functions
const readJwt = (token, req) => {
  return new Promise((resolve, reject) => {
    const error = {
      statusJwt: '',
      err: '',
    }
    jwt.verify(token, req.app.get('secret'), async function(err, decoded) {
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

function prepareData(data, vodUrl) {
  //console.log('vodUrl', vodUrl)
  var outputPrepareData = []
  var newData = {}
  if (vodUrl == null) {
    data.forEach(function(record) {
      newData = {
        id: record._id,
        programName_en: record.programName_en,
        programName_th: record.programName_th,
        promoFromTime: record.promoFromTime,
        promoToTime: record.promoToTime,
        free: record.free,
        logoUrl: record.logoUrl,
        videoUrl: vodUrl,
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
      outputPrepareData.push(newData)
    })
    return outputPrepareData
  } else {
    data.forEach(function(record) {
      newData = {
        id: record._id,
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
      outputPrepareData.push(newData)
    })
    return outputPrepareData
  }
}

function setData(data, message) {
  var outputJson = []
  if (message == 'not-paid') {
    outputJson = prepareData(data, null)
    return outputJson
  } else if (message == 'feature-vod') {
    outputJson = prepareData(data, null)
    return outputJson
  } else if (message == 'feature-vod-paid') {
    outputJson = prepareData(data, data[0].videoUrl)
    return outputJson
  } else {
    outputJson = prepareData(data, data)
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

async function findVods(status, query) {
  // console.log('status', status)
  // console.log('query', query)
  if (query == null) {
    query = {}
  }
  var statusOrder = ''
  var dataVods = {
    error: 'none',
    data: [],
  }
  var returnVods = {}
  if (status == 'not-paid') {
    statusOrder = 'not-paid'
  } else if (status == 'feature-vod') {
    statusOrder = 'feature-vod'
  } else if (status == 'feature-vod-paid') {
    statusOrder = 'feature-vod-paid'
  } else {
    statusOrder = 'paid'
  }
  returnVods = await Vod.find(query)
    .sort({ onAirDate: -1 })
    .then(function(vods) {
      if (Object.keys(vods).length != 0) {
        dataVods.data = setData(vods, statusOrder)
        return dataVods
      } else {
        dataVods.error = 'data not found'
        //dataVods.data = setData(vods, statusOrder)
        return dataVods
      }
    })
    .catch(function(err) {
      dataVods.error = err
      return dataVods
    })
  // returnVods = await Vod.find(query),function(err,vods){
  //   if(err){
  //     dataVods.error = err
  //     return dataVods
  //   }
  //   else if (Object.keys(vods).length != 0) {
  //           dataVods.data = setData(vods, statusOrder)
  //           return dataVods
  //         } else {
  //           dataVods.error = 'data not found'
  //           dataVods.data = setData(vods, statusOrder)
  //           return dataVods
  //         }
  // }
  //console.log('returnVods', returnVods)
  return returnVods
}

async function decodeJwt(token, req) {
  var status = ''
  try {
    const decode = await readJwt(token, req)
    if (decode.statusJwt == 'Failed to authenticate token.') {
      //console.log('decode', decode)
      status = decode.statusJwt
    } else {
      //console.log('decode', decode)
      const query = { userId: decode.data.email }
      const order = await queryOrder(query)
      //console.log('ordersss', ordersss)
      status = order
    }
  } catch (err) {
    console.log(err)
  }
  return status
}

//controllers
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

exports.vods = async function(req, res) {
  var token = req.query.token
  var searchName = req.query.search
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
  var progName = req.query.progname
  if (
    searchName != 'undefined' &&
    searchName != '' &&
    searchName != undefined
  ) {
    if (token == undefined || token == '' || token == 'undefined') {
      outputvods = await findVods('not-paid', {
        programName_en: { $regex: '.*' + searchName + '.*' },
      })
      json = setDataOutput(outputvods, output)
      return res.json(json)
    } else {
      order = await decodeJwt(token, req)
      if (order == 'you have purchase') {
        outputvods = await findVods('paid', {
          programName_en: { $regex: '.*' + searchName + '.*' },
        })
        json = setDataOutput(outputvods, output)
      } else if (order == `you have't purchase`) {
        outputvods = await findVods('not-paid', {
          programName_en: { $regex: '.*' + searchName + '.*' },
        })
        json = setDataOutput(outputvods, output)
      } else {
        outputvods = { err: order }
        json = setDataOutput(outputvods, output)
      }
      return res.json(json)
    }
  } else if (
    progName != 'undefined' &&
    progName != '' &&
    progName != undefined
  ) {
    if (token == undefined || token == '' || token == 'undefined') {
      outputvods = await findVods('not-paid', {
        programName_en: progName,
      })
      json = setDataOutput(outputvods, output)
      return res.json(json)
    } else {
      order = await decodeJwt(token, req)
      if (order == 'you have purchase') {
        outputvods = await findVods('paid', {
          programName_en: progName,
        })
        json = setDataOutput(outputvods, output)
      } else if (order == `you have't purchase`) {
        outputvods = await findVods('not-paid', {
          programName_en: progName,
        })
        json = setDataOutput(outputvods, output)
      } else {
        outputvods = { err: order }
        json = setDataOutput(outputvods, output)
      }
      return res.json(json)
    }
  } else if (token == undefined || token == '' || token == 'undefined') {
    //console.log('hi')
    outputvods = await findVods('not-paid', {})
    json = setDataOutput(outputvods, output)
    return res.json(json)
  } else {
    order = await decodeJwt(token, req)
    if (order == 'you have purchase') {
      outputvods = await findVods('paid', {})
      json = setDataOutput(outputvods, output)
    } else if (order == `you have't purchase`) {
      outputvods = await findVods('not-paid', {})
      json = setDataOutput(outputvods, output)
    } else {
      outputvods = { err: order }
      json = setDataOutput(outputvods, output)
    }
    return res.json(json)
  }
}

exports.featureVods = async function(req, res) {
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
  if (token == 'undefined' || token == '' || token == undefined) {
    outputvods = await findVods('feature-vod', { feature: 'active' })
    json = setDataOutput(outputvods, output)
    return res.json(json)
  } else {
    order = await decodeJwt(token, req)
    if (order == 'you have purchase') {
      outputvods = await findVods('feature-vod-paid', { feature: 'active' })
      json = setDataOutput(outputvods, output)
    } else if (order == `you have't purchase`) {
      outputvods = await findVods('feature-vod', { feature: 'active' })
      json = setDataOutput(outputvods, output)
    } else {
      outputvods = { err: order }
      json = setDataOutput(outputvods, output)
    }
    return res.json(json)
  }
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
