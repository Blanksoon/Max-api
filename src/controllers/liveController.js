var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var jwt = require('jsonwebtoken')
var mongoose = require('mongoose'),
  Order = mongoose.model('Order')
var live = require('../../data/live/live')
var buyLive = require('../../data/live/buyLive')

exports.lives = function(req, res) {
  var decoded = {}
  var token = req.body.token
  if (req.body.token == null) {
    res.json(live)
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
            productId: '1001',
          }
          Order.findOne(queryParams, function(err, order) {
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
            } else if (order) {
              output.status.code = 200
              output.status.success = true
              output.status.message = defaultSuccessMessage
              output.data = buyLive
            }
            return res.json(output)
          })
        }
      })
    }
  }
}
