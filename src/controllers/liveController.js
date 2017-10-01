var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var jwt = require('jsonwebtoken')
var mongoose = require('mongoose'),
  Order = mongoose.model('Order')
Live = mongoose.model('Live')
// var live = require('../../data/live/live')
// var buyLive = require('../../data/live/buyLive')

// exports.lives = function(req, res) {
//   var decoded = {}
//   var token = req.body.token
//   if (req.body.token == null) {
//     res.json(live)
//   } else {
//     if (token) {
//       jwt.verify(token, req.app.get('secret'), function(err, decoded) {
//         if (err) {
//           return res.json({
//             status: {
//               code: 403,
//               success: false,
//               message: 'Failed to authenticate token.',
//             },
//             data: [],
//           })
//         } else {
//           decoded = decoded
//           var queryParams = {
//             userId: decoded.data.email,
//             productId: '1001',
//           }
//           Order.findOne(queryParams, function(err, order) {
//             var output = {
//               status: {
//                 code: 400,
//                 success: false,
//                 message: defaultErrorMessage,
//               },
//               data: [],
//             }
//             if (err) {
//               output.status.message = err.message
//             } else if (order) {
//               output.status.code = 200
//               output.status.success = true
//               output.status.message = defaultSuccessMessage
//               output.data = buyLive
//             }
//             return res.json(output)
//           })
//         }
//       })
//     }
//   }
// }

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
        OnAirDate: record.OnAirDate,
        promoUrl: record.promoUrl,
        fightcardUrl: record.fightcardUrl,
        videoUrl: '',
        description_en: record.description_en,
        description_th: record.description_th,
        bannerUrl: record.bannerUrl,
        thumbnailUrl: record.thumbnailUrl,
        shortDescription_en: record.shortDescription_en,
        shortDescription_th: record.shortDescription_th,
        channel: record.channel,
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
        OnAirDate: record.OnAirDate,
        promoUrl: record.promoUrl,
        fightcardUrl: record.fightcardUrl,
        videoUrl: record.videoUrl,
        description_en: record.description_en,
        description_th: record.description_th,
        bannerUrl: record.bannerUrl,
        thumbnailUrl: record.thumbnailUrl,
        shortDescription_en: record.shortDescription_en,
        shortDescription_th: record.shortDescription_th,
        channel: record.channel,
      }
      output.push(newData)
    })
  }

  return output
}

exports.lives = function(req, res) {
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
    Live.find({}, function(err, lives) {
      if (err) {
        output.status.message = err.message
      } else if (lives) {
        //console.log('live', lives)
        responseLive = lives
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = setData(lives, 'not-paid')
      }
      return res.json(output)
    })
  } else {
    //console.log('2')
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
                  //console.log('live', lives)
                  responseLive = lives
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = defaultSuccessMessage
                  output.data = setData(lives, 'paid')
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
