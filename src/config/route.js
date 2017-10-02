'use strict'

var jwt = require('jsonwebtoken')

exports.verifyToken = function verifyToken(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token']
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
        req.decoded = decoded
        next()
      }
    })
  } else {
    return res.json({
      status: {
        code: 403,
        success: false,
        message: 'No token provided.',
      },
      data: [],
    })
  }
}

var verifyToken = function verifyToken(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token']
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
        req.decoded = decoded
        next()
      }
    })
  } else {
    return res.json({
      status: {
        code: 403,
        success: false,
        message: 'No token provided.',
      },
      data: [],
    })
  }
}

module.exports = function(app) {
  var middleware = [verifyToken]
  //var middleware = []; uneble Token
  var vod = require('../controllers/vodController')
  var user = require('../controllers/userController')
  var order = require('../controllers/orderController')
  var live = require('../controllers/liveController')

  app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    next()
  })

  // vod Routes
  app
    .route('/vods')
    .get(vod.search)
    .post(vod.vods)
  //.post(middleware, vod.create)

  app
    .route('/vods/:vodId')
    .get(vod.get)
    .put(middleware, vod.update)
    .delete(middleware, vod.delete)

  // User Routes
  app
    .route('/users')
    .get(middleware, user.search)
    .post(user.create)

  app
    .route('/users/:userId')
    .get(middleware, user.get)
    .put(middleware, user.update)
    .delete(middleware, user.delete)

  app.route('/order').post(middleware, order.search)
  app.route('/checksubscribe').post(middleware, order.checkSubScribe)
  app.route('/subscribe').post(middleware, order.subscribe)

  app.route('/lives').post(live.lives)

  app.route('/lives/:liveId').post(live.livesById)

  // Login and Validate Token Routes
  app.route('/login').post(user.login)

  app.route('/fb-login').post(user.fbLogin)
}
