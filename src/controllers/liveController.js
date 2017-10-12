var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var jwt = require('jsonwebtoken')
var mongoose = require('mongoose'),
  Order = mongoose.model('Order')
Live = mongoose.model('Live')

function setData(data, message) {
  var output = []
  var vodUrl = ''
  if (message == 'not-paid') {
    data.forEach(function(record) {
      var newData = {
        id: record._id,
        programName: record.programName,
        title_en: record.title_en,
        title_th: record.title_th,
        showOrder: record.showOrder,
        liveDateStr_en: record.liveDateStr_en,
        liveDateStr_th: record.liveDateStr_th,
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
      }
      output.push(newData)
    })
  } else {
    data.forEach(function(record) {
      var newData = {
        id: record._id,
        programName: record.programName,
        title_en: record.title_en,
        title_th: record.title_th,
        showOrder: record.showOrder,
        liveDateStr_en: record.liveDateStr_en,
        liveDateStr_th: record.liveDateStr_th,
        liveFromDate: record.liveFromDate,
        liveToDate: record.liveToDate,
        shortDesc1_en: record.shortDesc1_en,
        shortDesc1_th: record.shortDesc1_th,
        shortDesc2_en: record.shortDesc2_en,
        shortDesc2_th: record.shortDesc2_th,
        desc_en: record.desc_en,
        desc_th: record.desc_th,
        fightcardUrl: record.fightcardUrl,
        videoUrl: record.videoUrl,
        promoUrl: record.promoUrl,
        bannerUrl: record.bannerUrl,
        logoUrl: record.logoUrl,
      }
      output.push(newData)
    })
  }
  return output
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

exports.lives = function(req, res) {
  var decoded = {}
  var token = req.query.token
  //console.log('req', req.query.token)
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  if (token == undefined || token == 'undefined') {
    Live.find({}, function(err, lives) {
      if (err) {
        output.status.message = err.message
      } else if (lives) {
        responseLive = lives
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = setData(lives, 'not-paid')
      }
      return res.json(output)
    }).sort({ showOrder: 1 })
  } else {
    if (token) {
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
          }
          Order.findOne(queryParams, function(err, order) {
            if (err) {
              output.status.message = err.message
              return res.json(output)
            } else if (order) {
              Live.find({}, function(err, lives) {
                if (err) {
                  output.status.message = err.message
                  return res.json(output)
                } else if (lives) {
                  responseLive = lives
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(lives, 'paid')
                }
                return res.json(output)
              })
            } else {
              Live.find({}, function(err, lives) {
                if (err) {
                  output.status.message = err.message
                } else if (lives) {
                  responseLive = lives
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(lives, 'not-paid')
                }
                return res.json(output)
              }).sort({ showOrder: 1 })
            }
          })
        }
      })
    }
  }
}

exports.livesById = function(req, res) {
  var decoded = {}
  var token = req.query.token
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var queryParams = {
    _id: req.params.liveId,
  }
  if (token == undefined || token == 'undefined') {
    Live.find({ _id: `${req.params.liveId}` }, function(err, lives) {
      if (err) {
        output.status.message = err.message
      } else if (lives) {
        responseLive = lives
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = setData(lives, 'not-paid')
      }
      return res.json(output)
    })
  } else {
    if (token) {
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
          }
          Order.findOne(queryParams, function(err, order) {
            if (err) {
              output.status.message = err.message
              return res.json(output)
            } else if (order) {
              Live.find({ _id: `${req.params.liveId}` }, function(err, lives) {
                if (err) {
                  output.status.message = err.message
                  return res.json(output)
                } else if (lives) {
                  responseLive = lives
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(lives, 'paid')
                }
                return res.json(output)
              })
            } else {
              Live.find({ _id: `${req.params.liveId}` }, function(err, lives) {
                if (err) {
                  output.status.message = err.message
                } else if (lives) {
                  responseLive = lives
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(lives, 'not-paid')
                }
                return res.json(output)
              })
            }
          })
        }
      })
    }
  }
}
