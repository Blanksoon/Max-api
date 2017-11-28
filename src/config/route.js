import jwt from 'jsonwebtoken'
import env from './env'

exports.verifyToken = function verifyToken(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token']
  if (token) {
    jwt.verify(token, env.JWT_SECRET, function(err, decoded) {
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
    jwt.verify(token, env.JWT_SECRET, function(err, decoded) {
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
  const middleware = [verifyToken]
  //var middleware = []; uneble Token
  const vod = require('../controllers/vodController')
  const user = require('../controllers/userController')
  const order = require('../controllers/orderController')
  const live = require('../controllers/liveController')
  const ppcheckout = require('../controllers/ppcheckoutController')

  app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    next()
  })

  // Vod Routes
  app.get('/program-name', vod.getProgramName)
  app.post('/insert-vod', vod.insertValue)
  app.get('/vods-feature', vod.featureVods)
  app.route('/vods').get(vod.vods)
  // .get(vod.search)
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

  // Live Routes
  app.route('/lives').get(live.lives)
  app.route('/lives/:liveId').get(live.livesById)
  app.post('/insert-live', live.insertValue)

  // Order and Transection Routes
  app.route('/order').post(middleware, order.search)
  app.route('/checksubscribe').post(middleware, order.checkSubScribe)
  //app.route('/subscribe').post(middleware, order.subscribe)
  app.get('/product', order.products)
  app.get('/subscribe-history', order.fetchSubscribe)

  // Paypal checkout
  app.route('/ppcheckout/webhooks').post(ppcheckout.createWebhook)
  app.route('/ppcheckout/webhooks_handler').post(ppcheckout.webhookHandler)
  app.route('/ppcheckout/:liveId').post(ppcheckout.createPayment)
  app.route('/ppcheckout/:orderId/success').get(ppcheckout.executePayment)
  app.route('/ppcheckout/:orderId/cancel').get(ppcheckout.cancelPayment)
  app
    .route('/ppcheckout/:orderId/cancel/subscribe')
    .post(ppcheckout.cancelSubscribe)
  app.route('/billingplans').post(ppcheckout.billingPlans)
  app.route('/subscribe/:subscribeId').post(ppcheckout.subscribe)
  app.route('/subscribe/success').get(ppcheckout.successSubscribe)
  app.route('/client_token').get(ppcheckout.braintreeToken)
  //braintree
  app
    .route('/purchase-live-paypal-braintree')
    .post(ppcheckout.createAndSettledPayment)
  app
    .route('/cancel-live-paypal-braintree')
    .post(ppcheckout.cancelReleasePayment)
  app.route('/subscribe-paypal-braintree').post(ppcheckout.subscribeBraintree)
  app
    .route('/cancel-subcribe-paypal-braintree')
    .post(ppcheckout.cancelSubscribeBraintree)

  // Login and Validate Token Routes
  app.route('/login').post(user.login)
  app.route('/fb-login').post(user.fbLogin)
  // app.route('/local-register').post(user.localRegister)
  app.route('/local-register').post(user.localRegister)
  app.route('/local-login').post(user.localLogin)
  app.post('/email', user.sendEmail)
  app.get('/activate-user', user.activateLocalUser)
  app.post('/check-old-password', user.checkOldPassword)
  app.post('/change-password', user.changePassword)
  app.post('/forgot-password', user.forgotPassword)
  app.get('/profile', user.profileUser)
  app.post('/update-user', user.updateUser)
  app.get('/purchase-history', order.purchaseHistory)
  //app.post('/test', ppcheckout.findOrder)
}
